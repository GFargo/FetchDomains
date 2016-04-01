'use strict';

// Required Libs
var whois       = require('node-xwhois'); // Domain Tools Package
var _           = require('underscore'); // Underscore
var Q           = require("q"); // Promises Library
var utils       = require('./util-domains');


// CouchDB Setup
var nano        = require('nano')('http://localhost:5984');
var request     = require('request');
var db_name     = "domains";
var db_domains  = nano.use(db_name);

var self        = this;
var DATABASE    = 'http://localhost:5984/domains';



// Recursively Merge Objects
function MergeRecursive(obj1, obj2) {
    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if ( obj2[p].constructor == Object ) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch(e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}

// Extended insert doc function
// if database not found it automatically creates one
function insertDoc(doc, tried) {
    db_domains.insert(doc,
        function (error,http_body,http_headers) {
            if(error) {
                if(error.message === 'no_db_file'  && tried < 1) {
                    // create database and retry
                    return nano.db.create(db_name, function () {
                        // retry insert after database has been created
                        insertDoc(doc, tried+1);
                    });
                } else {
                    // return console.log(error);
                    return console.log('-- record already exists --');
                }
            }
        console.log(http_body);
    });
}

// Hacked Update Function for CouchDB - doesn't natively support this.
// Best practice is to add new objects to the database and use
// _revs and combine the different models together like a git tree (?)
db_domains.update = function(obj, key, callback) {
 var db_domains = this;
 db_domains.get(key, function (error, existing) {
  if(!error) obj._rev = existing._rev;
  obj = MergeRecursive(obj, existing);
  db_domains.insert(obj, key, callback);
 });
}

// Go through the Data returned by 'Get Domains' loop
function parseDomain(domain) {

    // Run GetWhoIs
    // Run GetDNS
    // Run GetRegistrar
    // Return return promise to get domains

    console.log('Domain to Parse: ', domain);

    return Q.all([
        utils.getWhois(domain),
        utils.getDns(domain).then(function (data) {
            return utils.getRegistrar(data);
        }),
    ]).spread(function (whoisData, dnsData) {
        return storeData(whoisData, dnsData)
    });
}

function storeData(whois, dns) {

    var storageRequest  = Q.defer(),
        domainData      = {},
        domain          = whois.domain;


    domainData.whois = whois;
    domainData.registrar = dns.registrar;
    domainData.dns = dns.dns;

    db_domains.update(domainData, domain, function(err, body) {
        if (err) {
            console.log("Error Updating: ", err);
            console.log('body: ', body);
        } else {
            console.log('Update Domain Info Complete');
        }
        storageRequest.resolve();
    });

    return storageRequest.promise;

}

function populateDomains (params) {
    if (!_.isObject(params)) {
        params = {};
        params.chunkSize = 5;
        params.skip      = 0;
    };

    // Get all domains - promise
    var chunkSize           = (typeof params.chunkSize != undefined ? params.chunkSize : 5),
        skip                = params.skip;

    // Ajax Request for Domains
    var domains             = getDomains(chunkSize, skip),
        extractDomains      = function(data) { return _.pluck(data, "key"); }

    domains.then(function(data) {
        // console.log('Domain Data:', data);
        // console.log('extracted domains: ', extractDomains(data.rows));
        return getDomainInfo(extractDomains(data.rows));
    }).then(function(data) {
        console.log('------------------------------------');
        console.log('Populate Domains Complete', data);

        if (data.length < chunkSize) {
            console.log('No More Domains to Parse');
        } else {
            setTimeout(function() {
                populateDomains({chunkSize: 5, skip: skip + chunkSize });
            }, 250);
        }

    }).catch(function(err, body) {
        console.log('DOMAINS CATCH', err);
    });

}

function getDomainInfo (array) {

    // var domainInfoRequest = Q.defer();

    return Q.all(array.map(function(item) {
        return parseDomain(item);
    }));

    // return domainInfoRequest.promise;
}

function getDomains(limit, skip) {
    var domainRequest   = Q.defer();

    var url = DATABASE + "/_all_docs?limit=" + limit + "&skip=" + skip;
    console.log('GETDOMAINS URL: ', url);


    // HTTP Request
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var domainData = JSON.parse(body);

        console.log("DomainRequest: ", _.size(domainData.rows)); // Show the HTML for the Google homepage.

        domainRequest.resolve(domainData);

      } else {
        console.log('There was an Error Retrieving Domains: ', error);
        console.log('Error Body: ', body);
        // console.log('response: ', response);
      }
    });

    return domainRequest.promise;
}





module.exports = {
    // List current domains
    getDomains: function (chunkSize) {
        return getDomains(chunkSize);
    },
    // Standard insert doc function, if DB not present it will automatically create
    insert_doc: function (doc, tried) {
        return insertDoc(doc, tried);
    },
    // Populate Domain Entries with Info
    populate: function (params) {
        return populateDomains(params)
    },
};