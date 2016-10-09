/**
 * model.js
 */
'use strict';

const EventEmitter = require('events');

var Model = function (schedule, general, classes) {
    this.schedule = schedule;
    this.classes = classes;
    this.general = general;
    this.updateActiveClass();
};

Model.prototype = Object.create(EventEmitter.prototype);
Model.prototype.constructor = Model;

Model.prototype.updateActiveClass = function () {
    var old = this.activeClass;
    var d = new Date();
    var t = d.getHours()*60 + d.getMinutes();
    for (var i = 0; i < this.schedule.length; i++) {
        var entry = this.schedule[i];
        var start = entry.start[0]*60 + entry.start[1];
        var end = entry.end[0]*60 + entry.end[1];
        if (t >= start && t < end) {
            break;
        } else {
            entry = null;
        }
    }
    if (entry) {
        this.activeClass = this.findClass(entry.name, entry.section);
    }
    if (this.activeClass !== old) {
        if (this.activeClass) {
            if (old) {
                this.emit('endclass');
            }
            this.emit('startclass');
        } else {
            this.emit('endclass');
        }
    }
};

Model.prototype.findClass = function (name, section) {
    for (var i = 0; i < this.classes.length; i++) {
        var cl = this.classes[i];
        if (cl.name === name && (!cl.section || cl.section === section)) {
            return cl;
        }
    }
    return null;
};

Model.prototype.setGeneral = function (general) {
    this.general = general;
    this.emit('generalupdate');
};

module.exports = Model;
