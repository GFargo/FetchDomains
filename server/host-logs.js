'use strict'

module.exports = {
    server:              {
        host:         process.env.LOG_HOST,
        // port:         "external port number",
        userName:     process.env.LOG_USER,
        password:     process.env.LOG_PASS,
        // passPhrase:   "privateKeyPassphrase", //optional default:""
        // privateKey:   require('fs').readFileSync('/path/to/private/key/id_rsa'), //optional default:""
    },
    // hosts:               [Array, of, nested, host, configs, objects], //optional default:[]
    standardPrompt:     "$%#>",//optional default:"$#>"
    passwordPrompt:     ":",//optional default:":"
    passphrasePrompt:   ":",//optional default:":"
    commands:            [
        "sudo -s",
        "cd /storage/logs/engineering/domains",
        "exit"
    ],
    msg:                 {
        send: function( message ) {
            //message handler code
            console.log('repsponse: ', message);
        }
    },
    verbose:             true,  //optional default:false
    debug:               false,  //optional default:false
    idleTimeOut:         5000,        //optional: value in milliseconds (default:5000)
    connectedMessage:    "Connected", //optional: on Connected message
    readyMessage:        "Ready",     //optional: on Ready message
    closedMessage:       "Closed",    //optional: on Close message

    //optional event handlers defined for a host that will be called by the default event handlers
    //of the class
    onCommandProcessing: function( command, response, sshObj, stream ) {
        //optional code to run during the procesing of a command
        //command is the command being run
        //response is the text buffer that is still being loaded with each data event
        //sshObj is this object and gives access to the current set of commands
        //stream object allows strea.write access if a command requires a response
    },
    onCommandComplete:   function( command, response, sshObj ) {
        //optional code to run on the completion of a command
        //response is the full response from the command completed
        //sshObj is this object and gives access to the current set of commands
        console.log('Command Complete', command);
    },
    onCommandTimeout:    function(command, response, sshObj, stream, connection) {
        //optional code for responding to command timeout
        //response is the text response from the command up to it timing out
        //stream object used  to respond to the timeout without having to close the connection
        //connection object gives access to close the shell using connection.end()
        console.log('Command Timeout');
        // connection.end();
        stream.end("exit\n");
    },
    onEnd:               function( sessionText, sshObj ) {
        //optional code to run at the end of the session
        //sessionText is the full text for this hosts session
        console.log('End of Connection');
    },
    onClose: function onClose(had_error) {
    //default: outputs primaryHost.closeMessage or error if one was received
    //had_error indicates an error was recieved on close
        if (had_error) {
           console.log('Error:', had_error);
        }

    },

    onError: function onError(err, type, close, callback) {
        //default: Outputs the error, runs the callback if defined and closes the connection
        //Close and callback should be set by default to close = false and callback = undefined
        //not all error events will pass those two parameters to the evnt handler.
        //err is the error message received
        //type is a string identifying the source of the error
        //close is a bollean value indicating if the error will close the session
        //callback a fuction that will be run by the default handler

        console.log('Error Encountered', err);
    },
};