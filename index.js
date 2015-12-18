#! /usr/bin/env node
'use strict'

/* Required Modules */
var dotenv      = require('dotenv').load(); // Load .env variables
var Email       = require('email'); // Email Package

var fs          = require('fs'); // Node File System Module
var readline    = require('readline'); // Readline Module
var _           = require('underscore');
var SSH2Shell   = require('ssh2shell');

// var path        = require("path");
var whois       = require('node-xwhois'); // Domain Tools Package

// // CouchDB Setup
// var nano        = require('nano')('http://localhost:5984');
// var db_name     = "domains";
// var db_domains  = nano.use(db_name);

// Command Line Arguments
var userArgs    = process.argv.slice(2);




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

// // Standard insert doc function, if DB not present it will automatically create
// function insert_doc(doc, tried) {
//     db_domains.insert(doc,
//         function (error,http_body,http_headers) {
//             if(error) {
//                 if(error.message === 'no_db_file'  && tried < 1) {
//                     // create database and retry
//                     return nano.db.create(db_name, function () {
//                         insert_doc(doc, tried+1);
//                     });
//                 } else {
//                     // return console.log(error);
//                     return console.log('-- record already exists --');
//                 }
//             }
//         console.log(http_body);
//     });
// }




/*

    Variables

*/

// Define Namespace
var goFetch     = {};

// Domain Utilities
goFetch.utils   = require('./server/util-domains');


// Log Server Host object
var host        = require('./server/host-logs');
var SSH         = new SSH2Shell(host);



//Start the process
// SSH.connect();

goFetch.importFile = function(path) {

    console.log('Parsing:', path);

    // Parse Input Domain
    readline.createInterface({
        input: fs.createReadStream(path),
        terminal: false
    }).on('line', function(line) {
        // Catch malformed domains
        if (!whois.isDomain(line) ) {
            console.log('Invalid Entry: ' + line);
            return;
        } else {
            // Create initial entry in PouchDB
            goFetch.utils.insert_doc({ domain: line, _id: line}, 0);
            console.log(`Successfully Imported: ${line} `);
            console.log('----');
        }

    });
}


goFetch.handler = function(userArgs) {
    // Command Line Args
    var goFetch         = this,
        mainArg         = userArgs[0];
        // mode            = userArgs[1],

    console.log('length: ', userArgs.length);
    console.log('userargs:', userArgs);

    // Commands are prefixed by a dash '-'
    if (mainArg.charAt(1) === '-') {

    } else {
        goFetch.importFile(mainArg);
    }

    // // Arguments are passed after the initial import command
    // if (mode === 'whois') {
    //     // Get Whois Data
    //     goFetch.utils.getWhois(line);
    // } else if(mode === 'dns'){
    //     // Get Domain & Registrar Information
    //     goFetch.utils.getDns(line);
    // } else if(mode === 'test'){
    //     // Get Domain & Registrar Information
    //     db_domains.list('_id', function(err, body) {
    //       if (!err) {
    //         body.rows.forEach(function(doc) {
    //           console.log(doc.id);
    //         });
    //       }
    //     });
    // }  else if(mode === 'registrar'){
    //     // Get Domain & Registrar Information
    //     db_domains.get(line, function(err, body) {
    //       if (!err)
    //         goFetch.utils.getRegistrar(line, body.info.A[0]);
    //     });
    // } else {
    //     // Create initial entry in PouchDB
    //     insert_doc({ domain: line, _id: line}, 0);
    //     console.log(`Successfully Imported: ${line} `);
    // }


}



goFetch.handler(userArgs);