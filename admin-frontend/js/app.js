/**
 * app.js
 */
'use strict';

$(function () {
    var today = new Date();

    $.get('/rest/classes', function (classes) {
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].section) {
                var label = classes[i].name + ' (' + classes[i].section + ')';
            } else {
                label = classes[i].name;
            }
            var $el = $('<option>' + label + '</option>').val(classes[i]._id);
            $('#class-sel').append($el);
            $el = $('<option>' + label + '</option>').val(classes[i]._id);
            $('#class-copy-sel').append($el);
        }
        $('#class-sel').selectmenu();
        $('#class-copy-sel').selectmenu();
        $('#class-sel').selectmenu({change: function () {
            getRecentDay($('#class-sel').val());
        }});
        getRecentDay($('#class-sel').val());
    });
    $('#schedule-sel').selectmenu();
    $('#schedule-sel').selectmenu({'change': function () {
        getSchedule($('#schedule-sel').val());
    }});
    updateSchedules();
    $.get('/rest/general/latest', function (general) {
        if (general) {
            var $gen = $('.gen-announce input');
            for (var i = 0; i < general.announcements.length; i++) {
                $gen.eq(i).val(general.announcements[i]);
            }
            //$('#announcement-save-date').val(new Date(general.date).toLocaleDateString());
        }
    });

    $('.date').val(today.toLocaleDateString());
    $('.date').datepicker();
    $('#tabs').tabs();
    $('button').button();
    $('input').addClass('ui-widget ui-widget-content ui-corner-all ui-state-default');

    $('#class-copy-go').click(function () {
        var id = $('#class-copy-sel').val();
        if (id === 'clear') {
            $('.day input').val('');
            $('.day textarea').val('');
        } else {
            getRecentDay(id);
        }
    });
    $('#announcement-save').click(function () {
        var date = $('#announcement-save-date').datepicker('getDate') || today;
        var url = '/rest/general/' + getDateSegment(date);
        var general = {date: date, announcements: []};
        $('.gen-announce input').each(function () {
            var s = $(this).val().trim();
            if (s.length) {
                general.announcements.push(s);
            }
        });
        $.post({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify(general)
        });
    });
    $('#class-save').click(function () {
        var date = $('#class-save-date').datepicker('getDate') || today;
        var id = $('#class-sel').val();
        var url = '/rest/days/' + id + '/' + getDateSegment(date);
        var day = {date: date, class: id, standard: [], eq: [], agenda: [], vocabulary: [], announcements: []};
        var s;
        $('.class-eq textarea').each(function () {
            s = $(this).val().trim();
            if (s.length) {
                day.eq.push(s);
            }
        });
        $('.class-standards textarea').each(function () {
            s = $(this).val().trim();
            if (s.length) {
                day.standard.push(s);
            }
        });
        $('.class-agenda input').each(function () {
            s = $(this).val().trim();
            if (s.length) {
                day.agenda.push(s);
            }
        });
        $('.class-vocabulary input').each(function () {
            s = $(this).val().trim();
            if (s.length) {
                day.vocabulary.push(s);
            }
        });
        $('.class-announce input').each(function () {
            s = $(this).val().trim();
            if (s.length) {
                day.announcements.push(s);
            }
        });
        $.post({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify(day)
        });
    });
    $('#schedule-save').click(function () {
        var name = $('#schedule-save-name').val().trim();
        if (name) {
            var url = '/rest/schedules/' + name;
            var schedule = {
                name: name,
                dates: [],
                entries: []
            };
            var $rows = $('.schedule tr');
            for (var i = 1; i < $rows.length; i++) {
                var $cells = $rows.eq(i).find('input');
                var cls = $cells.eq(0).val().trim();
                var section = $cells.eq(1).val().trim();
                if (cls && cls.length) {
                    var entry = {
                        name: cls,
                        start: [Number($cells.eq(2).val()), Number($cells.eq(3).val())],
                        end: [Number($cells.eq(4).val()), Number($cells.eq(5).val())]
                    };
                    if (section && section.length) {
                        entry.section = Number(section);
                    }
                    schedule.entries.push(entry);
                }
            }
            $.post({
                url: url,
                contentType: 'application/json',
                data: JSON.stringify(schedule),
                success: function () {
                    updateSchedules(name);
                }
            });
        }
    });
    $('#schedule-apply').click(function () {
        var name = $('#schedule-sel').val();
        var url = '/rest/schedules/' + name + '/adddate';
        var date = $('#schedule-apply-date').datepicker('getDate') || today;
        $.post({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({date: date}),
            success: function () {
                $('.schedule-dates ul').append('<li>' + date.toLocaleDateString() + '</li>').data('date', date);
            }
        });
    });

    $('.schedule-dates ul').on('click', 'li', function () {
        var $self = $(this);
        var name = $('#schedule-sel').val();
        var url = '/rest/schedules/' + name + '/removedate';
        var date = $self.data('date');
        $.post({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({date: date}),
            success: function () {
                $self.remove();
            }
        });
    });

    function getRecentDay (cid) {
        $('.day textarea').val('');
        $('.day input').val('');
        $.get('/rest/days/' + cid + '/latest', function (day) {
            if (day) {
                var i, $els;
                $els = $('.class-eq textarea');
                for (i = 0; i < day.eq.length; i++) {
                    $els.eq(i).val(day.eq[i]);
                }
                $els = $('.class-standards textarea');
                for (i = 0; i < day.standard.length; i++) {
                    $els.eq(i).val(day.standard[i]);
                }
                $els = $('.class-agenda input');
                for (i = 0; i < day.agenda.length; i++) {
                    $els.eq(i).val(day.agenda[i]);
                }
                $els = $('.class-vocabulary input');
                for (i = 0; i < day.vocabulary.length; i++) {
                    $els.eq(i).val(day.vocabulary[i]);
                }
                $els = $('.class-announce input');
                for (i = 0; i < day.announcements.length; i++) {
                    $els.eq(i).val(day.announcements[i]);
                }
            }
        });
    }

    function getSchedule (name) {
        $.get('/rest/schedules/' + name, function (schedule) {
            if (!schedule) {
                return;
            }
            $('#schedule-save-name').val(name);
            $('.schedule input').val('');
            var $rows = $('.schedule tr');
            for (var i = 0; i < schedule.entries.length; i++) {
                $rows.eq(i+1).find('.class-name').val(schedule.entries[i].name);
                $rows.eq(i+1).find('.class-section').val(schedule.entries[i].section || '');
                $rows.eq(i+1).find('.start-h').val(schedule.entries[i].start[0]);
                $rows.eq(i+1).find('.start-m').val(schedule.entries[i].start[1]);
                $rows.eq(i+1).find('.end-h').val(schedule.entries[i].end[0]);
                $rows.eq(i+1).find('.end-m').val(schedule.entries[i].end[1]);
            }
            $('.schedule-dates ul').empty();
            for (i = 0; i < schedule.dates.length; i++) {
                $('.schedule-dates ul').append('<li>' + new Date(schedule.dates[i]).toLocaleDateString() + '</li>')
                    .data('date', schedule.dates[i]);
            }
        });
    }

    function updateSchedules (name) {
        $('#schedule-sel').empty();
        $.get('/rest/schedules', function (schedules) {
            for (var i = 0; i < schedules.length; i++) {
                $('#schedule-sel').append('<option>' + schedules[i].name + '</option>').val(schedules[i].name);
            }
            $('#schedule-sel').val(name || 'master').selectmenu('refresh');
            getSchedule(name || 'master');
        });
    }
});


function getDateSegment (dt) {
    var y = dt.getFullYear();
    var m = ('0' + dt.getMonth()).slice(-2);
    var d = ('0' + dt.getDate()).slice(-2);
    return y + m + d;
}