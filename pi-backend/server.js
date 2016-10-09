/**
 * server.js
 */
'use strict';
const ADMIN_URL = 'http://localhost';
const ADMIN_PORT = 8080;
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

server.listen(PORT, '127.0.0.1', function () {
    console.log('pi backend ready');
    Q.all([
        axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/schedule'),
        axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/general'),
        axios.get(ADMIN_URL + ':' + ADMIN_PORT + '/pirest/classes')
    ]).then(function (results) {
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
                model.schedule = update[0].data.entries;
                model.general = update[1].data;
                model.classes = update[2].data;
            });
        }, 10*60*1000);
    });
    //model = new Model([], {}, []);
    //setInterval(function () {
    //    model.updateActiveClass();
    //}, 1000);
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

// Test Data
var testdata = {
    schedule: [
        {start: [13,3], end: [13,50], name: 'Math 8 Honors', section: 1},
        {start: [16,53], end: [23,40], name: 'Honors Geometry', section: 2},
        {start: [15,4], end: [15,53], name: 'Math 8', section: 3},
        {start: [15,53], end: [16,10], name: 'Test Class', section: 4}
    ],
    general: {
        announcements: [
            'PSAT October 19th',
            'Tutoring Tuesdays 2:30 - 3:30'
        ]
    },
    classes: [
        {
            name: 'Math 8 Honors',
            section: 1,
            gcc: 'xyz3ab',
            announcements: ['Test Wednesday'],
            eq: [
                'How can we identify congruent triangles?'
            ],
            standard: [
                'Apply ASA, SSS, SAS, and AAS rules to identify congruent triangles.'
            ],
            agenda: [
                'Do this',
                'Do that',
                'Do the other thing'
            ]
        },
        {
            name: 'Honors Geometry',
            section: 2,
            gcc: 'xyz3ab',
            announcements: ['Test Thursday'],
            vocabulary: ['parallel', 'perpendicular', 'transversal', 'alternate interior angles',
                'corresponding angles', 'consecutive interior angles', 'alternate exterior angles'],
            eq: [
                'What is the relationship between slopes of parallel and perpendicular lines?'
            ],
            standard: [
                'Apply slope to do some math thing.'
            ],
            agenda: [
                'Do this',
                'Geogebra',
                'Proofs',
                'Do the other thing'
            ]
        },
        {
            name: 'Math 8',
            section: 3,
            gcc: 'xyz3ab',
            announcements: ['Test Friday', 'Project due Thursday'],
            eq: [
                'How can we identify congruent triangles?'
            ],
            standard: [
                'Apply ASA, SSS, SAS, and AAS rules to identify congruent triangles.'
            ],
            agenda: [
                'Do this',
                'Do that',
                'Do the other thing'
            ]
        },
        {
            name: 'Test Class',
            section: 4,
            gcc: '12345',
            announcements: ['Test Friday', 'Project due Thursday'],
            eq: [
                'What\'s the deal with airplane food?'
            ],
            standard: [
                'Apply ASA, SSS, SAS, and AAS rules to identify congruent triangles.'
            ],
            agenda: [
                'Do this',
                'Do that',
                'Do the other thing'
            ]
        }

    ]
};
