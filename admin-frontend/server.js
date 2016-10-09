/**
 * server.js
 */
'use strict';

const URL = 'mongodb://localhost:27017/classsign';
const PORT = 8080;

var moment = require('moment');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var classes;
var schedules;
var general;
var days;

// Static Stuff
app.use('/js', express.static(__dirname + '/js'));
app.use('/libs', express.static(__dirname + '/libs'));
app.use('/css', express.static(__dirname + '/css'));
app.get('/', function (req, res) {
    return res.sendFile('index.html', {root: __dirname});
});

// REST Interface
app.use(bodyParser.json({type: 'application/json'}));

// Classes
app.get('/rest/classes', function (req, res) {
    classes.find({}).toArray().then(function (c) {
        res.json(c);
    });
});

// Schedules
app.get('/rest/schedules', function (req, res) {
    schedules.find({}).project({name: 1}).toArray().then(function (s) {
        res.json(s);
    });
});
app.get('/rest/schedules/today', function (req, res) {
    var start = moment().startOf('day');
    var end = moment(start).add(1, 'days');
    schedules.findOne({dates: {$elemMatch: {$gte: start.toDate(), $lt: end.toDate()}}}).then(function (s) {
        if (s) {
            res.json(s);
        } else {
            schedules.findOne({name: 'master'}).then(function (s) {
                res.json(s);
            });
        }
    });
});
app.get('/rest/schedules/:name', function (req, res) {
    schedules.findOne({name: req.params.name}, {fields: {_id: 0}}).then(function (s) {
        res.json(s);
    });
});
app.post('/rest/schedules/:name', function (req, res) {
    schedules.findOne({name: req.params.name}).then(function (s) {
        if (s) {
            schedules.updateOne({name: req.params.name}, req.body, {w: 0});
        } else {
            schedules.insert(req.body, {w: 0});
        }
        res.status(201).end();
    });
});
app.post('/rest/schedules/:name/adddate', function (req, res) {
    schedules.updateOne({name: req.params.name}, {$push: {dates: new Date(req.body.date)}}, {w: 0});
    res.status(201).end();
});
app.post('/rest/schedules/:name/removedate', function (req, res) {
    schedules.updateOne({name: req.params.name}, {$pull: {dates: new Date(req.body.date)}}, {w: 0});
    res.status(201).end();
});

// General Info
app.get('/rest/general/latest', function (req, res) {
    general.findOne({date: {$lte: moment().endOf('day').toDate()}}, {sort: {date: -1}}).then(function (g) {
        res.json(g);
    });
});
app.get('/rest/general/:date', function (req, res) {
    var start = moment(req.params.date, 'YYYYMMDD');
    var end = moment(start).add(1, 'days');
    general.findOne({date: {$gte: start.toDate(), $lt: end.toDate()}}).then(function (g) {
        res.json(g);
    });
});
app.post('/rest/general/:date', function (req, res) {
    var start = moment(req.params.date, 'YYYYMMDD');
    var end = moment(start).add(1, 'days');
    general.findOne({date: {$gte: start.toDate(), $lt: end.toDate()}}).then(function (g) {
        req.body.date = new Date(req.body.date);
        if (g) {
            general.updateOne({_id: g._id}, {$set: {announcements: req.body.announcements}}, {w: 0});
        } else {
            general.insert(req.body, {w: 0});
        }
        res.status(201).end();
    });
});

// Day Info
app.get('/rest/days/:cid/latest', function (req, res) {
    days.findOne({class: ObjectID.createFromHexString(req.params.cid)}, {sort: {date: -1}}).then(function (d) {
        res.json(d);
    });
});
app.get('/rest/days/:cid/:date', function (req, res) {
    var start = moment(req.params.date, 'YYYYMMDD');
    var end = moment(start).add(1, 'days');
    days.findOne({
        class: ObjectID.createFromHexString(req.params.cid),
        date: {$gte: start.toDate(), $lt: end.toDate()}
    }).then(function (d) {
        res.json(d);
    });
});
app.post('/rest/days/:cid/:date', function (req, res) {
    var start = moment(req.params.date, 'YYYYMMDD');
    var end = moment(start).add(1, 'days');
    days.findOne({class: ObjectID.createFromHexString(req.params.cid),
        date: {$gte: start.toDate(), $lt: end.toDate()}}).then(function (d) {
        req.body.class = ObjectID.createFromHexString(req.body.class);
        req.body.date = new Date(req.body.date);
        if (d) {
            days.updateOne({_id: d._id}, {$set: {announcements: req.body.announcements}}, {w: 0});
        } else {
            days.insert(req.body, {w: 0});
        }
        res.status(201).end();
    });
});


MongoClient.connect(URL).then(function (db) {
    console.log('Connected to DB!');
    // Grab references to all collections
    classes = db.collection('classes');
    schedules = db.collection('schedules');
    general = db.collection('general');
    days = db.collection('days');
    server.listen(PORT);
    //db.close();
});
