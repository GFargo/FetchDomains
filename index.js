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

// print process.argv
process.argv.forEach(function(val, index, array) {
  console.log(index + ': ' + val);
});




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



/*

    Variables

*/

// Define Namespace
var goFetch     = {};

// Domain Utilities
// goFetch.domains   = require('./server/util-domains');
goFetch.dbUtil    = require('./server/util-database');


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
            goFetch.dbUtil.insert_doc({ domain: line, _id: line}, 0);
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

    // console.log('length: ', userArgs.length);
    // console.log('userargs:', userArgs);
    // goFetch.dbUtil.populate();

    // Commands are prefixed by a dash '-'
    if (mainArg.charAt(0) === '-') {
        mainArg = mainArg.slice(1);
        // Arguments are passed after the initial import command
        if (mainArg === 'whois') {
            // Get Whois Data
            goFetch.domains.getWhois(line);
        } else if(mainArg === 'dns'){
            // Get Domain & Registrar Information
            goFetch.domains.getDns(line);
        } else if(mainArg === 'test'){
            // console.log('derpy domains:', domains);
            goFetch.dbUtil.populate();
        }  else if(mainArg === 'registrar'){
            // Get Domain & Registrar Information

        } else {
           console.log('unknown command: ', mainArg);
        }

    } else {
        goFetch.importFile(mainArg);
    }

}



goFetch.handler(userArgs);
