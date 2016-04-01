'use strict';

// Required Libs
var whois       = require('node-xwhois'); // Domain Tools Package
var _           = require('underscore');
var Q           = require("q"); // Promises Library

// CouchDB Setup
var nano        = require('nano')('http://localhost:5984');
var db_name     = "domains";
var db_domains  = nano.use(db_name);


// Extend Array with Clean function
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};




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




function getWhois(domain) {
    var whoIsRequest = Q.defer();
    var disclaimer = '';

    whois.whois(domain)
        .then(function(whois) {

            // Save Dump
            var dataDump    = whois,
                parsedDump  = whois;
            // Convert each line into array
            parsedDump = parsedDump.split('\n');
            // Remove empty arrays
            parsedDump.clean('').clean('\r');
            // Traverse through whois return data
            parsedDump.forEach(function(element, index){
                if (index < 56) {
                    // Replace line breaks & convert element to array
                    element = [element.replace(/(\r\n|\n|\r)/gm, '')];

                    // Need to format each element before converting to object to avoid malformed objects
                    element[1] = element[0].substr(element[0].indexOf(':')+1).replace(/ /, '');
                    element[0] = element[0].substr(0 ,element[0].indexOf(':')).replace(/( |\/)/g, '_').toLowerCase();
                    whois[index] = element;
                } else {
                    // Collect all disclaimer lines and put into seperate variable to be appened later
                    element = element.replace(/(\r\n|\n|\r)/gm, ' ');
                    disclaimer = disclaimer.toString() + element.toString();
                    parsedDump[index] = '';
                }
            });

            // Convert Array to Object
            parsedDump = _.object(parsedDump);
            // Remove undefined items
            delete parsedDump.undefined;
            // Push disclaimer to whois object
            whois.domain        = domain;
            whois.parsed        = parsedDump;
            whois.raw           = dataDump;
            whois.disclaimer    = disclaimer;

            // Resolve promise with parsed whois response
            whoIsRequest.resolve(whois);
        })
        .catch(function(err) {
            console.log('Whois Request Failed... ', err);
        });

    return whoIsRequest.promise;
}

// Lookup Registrar information
// use IP passed in from getDNS promise
function getRegistrar(data) {

    var registrarRequest = Q.defer();

    if (_.isEmpty(data)) {
        registrarRequest.resolve({dns: "failed", registrar: "failed"});
    }

    whois.bgpInfo(data.ip)
        .then(function(info) {
            // Pass current data along with registrar result into promise
            registrarRequest.resolve({dns: data.dns, registrar: info});
        })
        .catch(function(err) {
            console.log('error in fetching registrar: ', err);
            registrarRequest.resolve({dns: "failed", registrar: "failed"});
        });

    return registrarRequest.promise;
}

// Lookup DNS information
// pass IP through promise resolve to use in getRegistrar
function getDns(domain) {

    var dnsRequest = Q.defer();

    whois.nslookup(domain)
        .then(function(info) {
            // Pass DNS information & IP

            if (_.isEmpty(info) && _.isUndefined(info.A[0])) {
                console.log(`No DNS Info Found: ${domain}`);
                dnsRequest.resolve({});
            } else {
                dnsRequest.resolve({ dns: info, ip: info.A[0]});
            }
        })
        .catch(function(err) {
            console.log('NS Lookup Failed', err);
            dnsRequest.resolve({});
        });

    return dnsRequest.promise;
}


module.exports = {
    // Parse in Domains
    parseFile: function(path) {
        return fs.readFileSync(path, 'utf8').toString().split("\n");
    },
    // Run Whois on the Host
    getWhois: function(host) {
        return getWhois(host);
    },
    // Get Domain Registrar Information
    getRegistrar: function(data) {
        return getRegistrar(data);
    },
    // Get _all_ the Data
    getHostInfo: function(host) {
        whois.hostInfo(host)
            .then(function(data) {
                console.log(`${host} info:\n`, JSON.stringify(data, null, 4));
            })
            .catch(function(err) {
                console.log(err);
            });
    },
    getDns: function(host) {
        return getDns(host);
    }
};