/**
 * server.js
 */
'use strict';
//const ADMIN_URL = 'http://localhost';
const ADMIN_URL = 'http://ec2-52-87-247-12.compute-1.amazonaws.com';
//const ADMIN_PORT = 8080;
const ADMIN_PORT = 80;
const PORT = 8888;
const PREFIX = '/../pi-frontend';

var Q = require('q');
var axios = require('axios');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var Model = require('./Model.js');

var model;

// Serve static resources
app.use('/js', express.static(__dirname + PREFIX + '/js'));
app.use('/libs', express.static(__dirname + PREFIX + '/libs'));
app.use('/css', express.static(__dirname + PREFIX + '/css'));
app.get('/', function (req, res) {
    return sendFile(__dirname + PREFIX + '/', 'index.html', res);
});
app.get('/index.html', function (req, res) {
    return sendFile(__dirname + PREFIX + '/', 'index.html', res);
});

// Socket.io connection handler
io.on('connect', function (socket) {
    // FIXME
    if (model.activeClass) {
        socket.emit('class', model.activeClass);
    } else {
        socket.emit('noclass');
    }
    socket.emit('general', model.general);
    model.on('endclass', function () {
        socket.emit('noclass');
    });
    model.on('startclass', function () {
        socket.emit('class', model.activeClass);
    });
    model.on('generalupdate', function () {
        socket.emit('general', model.general);
    })
});

Q.all([
    axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/schedule'),
    axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/general'),
    axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/classes')
]).then(function (results) {
    //console.log(results[2].data);
    model = new Model(results[0].data.entries, results[1].data, results[2].data);
    setInterval(function () {
        model.updateActiveClass();
    }, 1000);
    setInterval(function () {
        Q.all([
            axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/schedule'),
            axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/general'),
            axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/classes')
        ]).then(function (update) {
            if (update[0].data.entries && update[0].data.entries.length) {
                model.schedule = update[0].data.entries;
            }
            if (update[1].data) {
                model.general = update[1].data;
            }
            if (update[2].data) {
                model.classes = update[2].data;
            }
        }).catch(function (reason) {
            console.log('Problem connecting to upstream server:', reason);
        });
    }, 10*60*1000);
    server.listen(PORT, '127.0.0.1', function () {
        console.log('Listening on port', PORT);
    })
}).catch(function (reason) {
    console.log('ERR', reason);
});


// Thin wrapper to add some error handling
function sendFile (root, filename, res) {
    return res.sendFile(filename, {root: root},
        function (err) {
            if (err) {
                console.log(err);
                res.status(err.status).end();
            }
        });
}
