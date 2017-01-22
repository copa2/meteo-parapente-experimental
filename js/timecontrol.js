var TimeControl = (function() {

    var model = {
        day: new Date(),
        hour: 13,
        days: [],
        from: 6,
        to: 22
    };

    var viewmodel = {};

    return {

        initialize: function() {
            viewmodel.timeslider = L.DomUtil.get('timeslider');

            var dayselect = viewmodel.timeslider.querySelector('select');
            dayselect.onchange = this.onSelectDay;
            dayselect.value = this.formatDate(model.day);
            viewmodel.dayselect = dayselect;

            var timecontrols = viewmodel.timeslider.getElementsByTagName('a');
            for (var i = 0; i < timecontrols.length; i++) {
                var e = timecontrols[i];
                if ("#prev-day" == e.getAttribute("href")) {
                    viewmodel.prevDay = e;
                    L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this.onClickPrevDay);
                }
                if ("#prev-hour" == e.getAttribute("href")) {
                    viewmodel.prevHour = e;
                    L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this.onClickPrevHour);
                }
                if ("#next-hour" == e.getAttribute("href")) {
                    viewmodel.nextHour = e;
                    L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this.onClickNextHour);
                }
                if ("#next-day" == e.getAttribute("href")) {
                    viewmodel.nextDay = e;
                    L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this.onClickNextDay);
                }
            }
        },

        setHourRange: function(from, to) {
            model.from = from;
            model.to = to;
        },

        setDays: function(days) {
            model.days = days;
            // update options
            var optionsHtml = "";
            for (var i = 0; i < days.length; i++) {
                var key = days[i];
                optionsHtml += "<option value='" + key + "'>" + key + "</option>";
            }
            viewmodel.dayselect.innerHTML = optionsHtml;
            viewmodel.dayselect.value = this.formatDate(model.day);
        },

        getDay: function() {
            return model.day;
        },
        getHour: function() {
            return model.hour;
        },
        addChangeListener: function(fn) {
            viewmodel.timeslider.addEventListener("changedatetime", fn);
        },

        containsDay: function(day) {
            var d = this.formatDate(day);
            for (var i = 0; i < model.days.length; i++) {
                if (model.days[i] === d) {
                    return true;
                }
            }
            return false;
        },

        onSelectDay: function(e) {
            var day = parseInt(e.target.value.slice(6, 8));
            var month = parseInt(e.target.value.slice(4, 6)) - 1;
            var year = parseInt(e.target.value.slice(0, 4));
            TimeControl.update(new Date(year, month, day), model.hour);
        },

        onClickPrevDay: function() {
            TimeControl.update(TimeControl.addDays(model.day, -1), model.hour);
        },

        onClickPrevHour: function() {
            if (model.hour > model.from) {
                TimeControl.update(model.day, model.hour - 1);
            } else {
                // check if we have a previous day
                var prevDay = TimeControl.addDays(model.day, -1);
                if (TimeControl.containsDay(prevDay)) {
                    TimeControl.update(prevDay, model.to);
                }
            }

        },

        onClickNextHour: function() {
            if (model.hour < model.to) {
                TimeControl.update(model.day, model.hour + 1);
            } else {
                // check if we have a next day
                var nextDay = TimeControl.addDays(model.day, 1);
                if (TimeControl.containsDay(nextDay)) {
                    TimeControl.update(nextDay, model.from);
                }
            }
        },

        onClickNextDay: function() {
            TimeControl.update(TimeControl.addDays(model.day, 1), model.hour);
        },

        update: function(newDay, newHour) {
            var oldDay = model.day;
            var oldHour = model.hour;
            model.day = newDay;
            model.hour = newHour;

            // update day
            viewmodel.dayselect.value = this.formatDate(model.day);

            // update hour
            var hourSpan = viewmodel.timeslider.getElementsByClassName('hour')[0];
            hourSpan.innerHTML = "- " + model.hour + "h";

            // enable disabled states
            var prevDay = this.addDays(model.day, -1);
            this.containsDay(prevDay) ? L.DomUtil.removeClass(viewmodel.prevDay, "disabled") : L.DomUtil.addClass(viewmodel.prevDay, "disabled");
            var nextDay = this.addDays(model.day, 1);
            this.containsDay(nextDay) ? L.DomUtil.removeClass(viewmodel.nextDay, "disabled") : L.DomUtil.addClass(viewmodel.nextDay, "disabled");

            // inform
            MPUtil.fireEvent(viewmodel.timeslider, "changedatetime", {
                day: model.day,
                hour: model.hour,
                oldDay: oldDay,
                oldHour: oldHour
            });
        },

        addDays: function(date, days) {
            var res = new Date(date);
            res.setDate(res.getDate() + days);
            return res;
        },

        formatDate: function(d) {
            return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2); // yyyymmdd
        },
        formatTime: function(h) {
            return ("0" + h).slice(-2) + "0000"; // hhmmss
        }
    };

}());
