'use strict';

// Required Libs
var whois       = require('node-xwhois'); // Domain Tools Package
var _           = require('underscore');

// CouchDB Setup
var nano        = require('nano')('http://localhost:5984');
var db_name     = "domains";
var db_domains  = nano.use(db_name);


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
function insert_doc(doc, tried) {
    db_domains.insert(doc,
        function (error,http_body,http_headers) {
            if(error) {
                if(error.message === 'no_db_file'  && tried < 1) {
                    // create database and retry
                    return nano.db.create(db_name, function () {
                        // retry insert after database has been created
                        insert_doc(doc, tried+1);
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




module.exports = {
    // Parse in Domains
    parseFile: function(path) {
        return fs.readFileSync(path, 'utf8').toString().split("\n");
    },
    // Standard insert doc function, if DB not present it will automatically create
    insert_doc: function(doc, tried) {
        insert_doc(doc,tried);
    },
    // Run Whois on the Host
    getWhois: function(host) {
        whois.whois(host)
            .then(function(whois) {
                whois = whois.split('\n');
                whois.forEach(function(element, index){
                    element = element.split(':');
                    element[0] = element[0].replace(' ', '_').toLowerCase();
                    whois[index] = element;
                });

                whois = _.object(whois);

                db_domains.update({whois: whois}, host, function(err, res) {
                    if (err) return console.log('No whois update!');
                    console.log('Updated Whois Info!');
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    },
    // Get Domain Registrar Information
    getRegistrar: function(host, ip) {
        whois.bgpInfo(ip)
            .then(function(info) {
                db_domains.update({registrar: info}, host, function(err, res) {
                    if (err) return console.log('No registrar update!');
                    console.log('Updated BGP Info!');
                });
            })
            .catch(function(err) {
                console.log(err);
            });
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
        whois.nslookup(host)
            .then(function(info) {
                db_domains.update({info: info}, host, function(err, res) {
                    if (err) return console.log('No ns update!');
                    console.log('Updated NS Info!');
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    }
};