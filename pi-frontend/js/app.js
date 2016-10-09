/**
 * app.js
 */
'use strict';

var announceLinger = 15;
var slideLinger = 30;

var _announcements = [];
var _announcementsGeneral = [];
var _announcementsClass = [];
var _curAnnouncement = 0;
var _slides = [];
var _curSlide = 0;
var _names = [];
var _slideTimeout = null;
var _announceTimeout;

// Init
$(function () {
    console.log('Class Sign Init');
    $('.sidebar').hide();
    $('.popup').hide();
    setAnnouncements();
    setSlides();
    setInterval(function () {
        var date = new Date();
        $('#date').html(formatDate(date));
        $('#time').html(formatTime(date));
    }, 1000);
    var socket = io('http://localhost:8888');
    socket.on('connect', function () {
        $('.meta .message').html('Awaiting class information.');
        // New Class Info
        socket.on('class', function (cl) {
            $('#title').html(cl.name);
            // Announcements
            if (cl.gcc) {
                _announcementsClass = ['Google Classroom Code: *' + cl.gcc + '*'].concat(cl.announcements || []);
            } else {
                _announcementsClass = cl.announcements || [];
            }
            setAnnouncements(_announcementsClass.concat(_announcementsGeneral));
            // Slides
            var i;
            var slides = [];
            if (cl.eq && cl.eq.length) {
                for (i = 0; i < cl.eq.length; i++) {
                    slides.push({type: 'eq', content: cl.eq[i], format: 'general'});
                }
            }
            if (cl.standard && cl.standard.length) {
                for (i = 0; i < cl.standard.length; i++) {
                    slides.push({type: 'standard', content: cl.standard[i], format: 'general'});
                }
            }
            if (cl.vocabulary && cl.vocabulary.length) {
                slides.push({type: 'vocabulary', content: cl.vocabulary, format: 'table'});
            }
            if (cl.agenda && cl.agenda.length) {
                slides.push({type: 'agenda', content: cl.agenda, format: 'list'});
            }
            setSlides(slides);
        });
        // Between classes
        socket.on('noclass', function () {
            $('.content').hide();
            $('.meta').hide();
            $('.default').show();
        });
        // New general info
        socket.on('general', function (general) {
            _announcementsGeneral = general.announcements || [];
            setAnnouncements(_announcementsClass.concat(_announcementsGeneral));
        });
    });
});

function formatDate(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var y = date.getFullYear() % 100;
    return m + '/' + d + '/' + y;
}

function formatTime (date) {
    var h = date.getHours();
    var m = date.getMinutes();
    var t = h < 12 ? 'AM' : 'PM';
    h = h % 12;
    if (h === 0) {
        h = 12;
    }
    if (m < 10) {
        m = '0' + m;
    }
    return h + ':' + m + ' ' + t;
}

var _boldRe = /\*([^*]+?)\*/g;
function formatContent (content) {
    content = content.replace(_boldRe, '<span class="bold">$1</span>');
    return content;
}

function setContent(id, content) {
    var $el = $('#' + id);
    $el.find('.fitbox').html(formatContent(content));
    shrinkToFit($el);
}

function setListContent(id, content) {
    var $el = $('#' + id);
    var str = '<ul>';
    for (var i = 0; i < content.length; i++) {
        str += '<li>' + formatContent(content[i]) + '</li>';
    }
    str += '</ul>';
    $el.find('.fitbox').html(formatContent(str));
    shrinkToFit($el);
}

function setTableContent(id, content) {
    var $el = $('#' + id);
    // Punt if too many items
    var i, j, str;
    if (content.length > 15) {
        str = '';
        for (i = 0; i < content.length; i++) {
            str += formatContent(content[i]) + ' ';
        }
        $el.find('.fitbox').html(str);
        shrinkToFit($el);
    } else {
        var cols = Math.ceil(content.length / 5);
        var fullrows = Math.floor(content.length / cols);
        str = '<table>';
        for (i = 0; i < fullrows; i++) {
            str += '<tr>';
            for (j = 0; j < cols; j++) {
                str += '<td>' + formatContent(content[i*cols + j]) + '</td>';
            }
            str += '</tr>';
        }
        for (i = fullrows*cols; i < content.length; i++) {
            str += '<tr><td class="center" colspan=' + cols + '>' + formatContent(content[i]) + '</td></tr>';
        }
        str += '</table>';
        $el.find('.fitbox').html(str);
        shrinkToFit($el);
    }
}

function setSlides (slides) {
    if (!slides) {
        slides = [];
    }
    if (_slideTimeout) {
        clearTimeout(_slideTimeout);
        _slideTimeout = null;
    }
    _slides = slides;
    _curSlide = -1;
    if (_slides.length) {
        $('.meta:visible').hide();
        $('.default:visible').hide();
        _slideTimeout = setTimeout(_handleTimeout, 0);
    } else {
        $('.meta:visible').hide();
        $('.content:visible').hide();
        $('.default').show();
    }
    function _handleTimeout () {
        $('.content:visible').hide();
        _curSlide = (_curSlide + 1) % _slides.length;
        var slide = _slides[_curSlide];
        $('#' + slide.type).show();
        switch (slide.format) {
            case 'general':
                setContent(slide.type, slide.content);
                break;
            case 'list':
                setListContent(slide.type, slide.content);
                break;
            case 'table':
                setTableContent(slide.type, slide.content);
                break;
        }

        _slideTimeout = setTimeout(_handleTimeout, (slide.duration || slideLinger) * 1000);
    }
}

function setAnnouncements (announcements) {
    if (!announcements) {
        announcements = [];
    }
    if (_announceTimeout) {
        clearTimeout(_announceTimeout);
        _announceTimeout = null;
    }
    _announcements = announcements;
    _curAnnouncement = 0;
    $('.current_announcement').stop().html('').css('left', 0);
    $('.next_announcement').stop().html('').css('left', $('footer').width());
    if (_announcements.length === 1) {
        $('.current_announcement').html(formatContent(_announcements[0]));
    } else if (_announcements.length > 1) {
        $('.current_announcement').html(formatContent(_announcements[0]));
        _announceTimeout = setTimeout(_handleTimeout, announceLinger*1000);
    }
    function _handleTimeout () {
        _curAnnouncement = (_curAnnouncement + 1) % announcements.length;
        $('.next_announcement').html(formatContent(_announcements[_curAnnouncement]));
        $('.current_announcement').animate({left: -$('footer').width()}, 2000, 'swing');
        $('.next_announcement').animate({left: 0}, 2000, 'swing', function () {
            var $t = $('.next_announcement');
            $('.current_announcement').css('left', $('footer').width()).removeClass().addClass('next_announcement');
            $t.removeClass().addClass('current_announcement');
            _announceTimeout = setTimeout(_handleTimeout, announceLinger*1000);
        });
    }
}

function shrinkToFit($el) {
    var $fitbox = $el.find('.fitbox');
    $fitbox.css('font-size', '100%');
    var pct = 100;
    while ($el.height() > $el.parent().height()) {
        pct -= 5;
        $fitbox.css('font-size', pct + '%');
    }
}