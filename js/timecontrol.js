class TimeControl {
    constructor() {
        this.model = {
            day: new Date(),
            hour: 13,
            days: [],
            from: 6,
            to: 22
        };
        this.viewmodel = {};
    }

    initialize() {
        this.viewmodel.timeslider = L.DomUtil.get('timeslider');

        var dayselect = this.viewmodel.timeslider.querySelector('select');
        dayselect.onchange = this._onSelectDay.bind(this);
        dayselect.value = TimeControl.formatDate(this.model.day);
        this.viewmodel.dayselect = dayselect;

        var timecontrols = this.viewmodel.timeslider.getElementsByTagName('a');
        for (var i = 0; i < timecontrols.length; i++) {
            var e = timecontrols[i];
            if ("#prev-day" == e.getAttribute("href")) {
                this.viewmodel.prevDay = e;
                L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this._onClickPrevDay.bind(this));
            }
            if ("#prev-hour" == e.getAttribute("href")) {
                this.viewmodel.prevHour = e;
                L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this._onClickPrevHour.bind(this));
            }
            if ("#next-hour" == e.getAttribute("href")) {
                this.viewmodel.nextHour = e;
                L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this._onClickNextHour.bind(this));
            }
            if ("#next-day" == e.getAttribute("href")) {
                this.viewmodel.nextDay = e;
                L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this._onClickNextDay.bind(this));
            }
        }
    }

    setHourRange(from, to) {
        this.model.from = from;
        this.model.to = to;
    }

    setDays(days) {
        this.model.days = days;
        // update options
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let optionsHtml = "";
        for (var i = 0; i < days.length; i++) {
            var key = days[i];
            let d = TimeControl.parseDate(key);

            optionsHtml += "<option value='" + key + "'>" + dayNames[d.getDay()] +" "+ d.getDate() + "</option>";
        }
        this.viewmodel.dayselect.innerHTML = optionsHtml;
        this.viewmodel.dayselect.value = TimeControl.formatDate(this.model.day);
    }

    getDay() {
        return this.model.day;
    }
    getHour() {
        return this.model.hour;
    }
    addChangeListener(fn) {
        this.viewmodel.timeslider.addEventListener("changedatetime", fn);
    }

    containsDay(day) {
        var d = TimeControl.formatDate(day);
        for (var i = 0; i < this.model.days.length; i++) {
            if (this.model.days[i] === d) {
                return true;
            }
        }
        return false;
    }

    _onSelectDay(e) {
        var selectedDate = TimeControl.parseDate(e.target.value);
        this.update(selectedDate, this.model.hour);
    }

    _onClickPrevDay() {
        var prevDay = TimeControl.addDays(this.model.day, -1);
        if (this.containsDay(prevDay)) {
            this.update(prevDay, this.model.hour);
        }
    }

    _onClickPrevHour() {
        if (this.model.hour > this.model.from) {
            this.update(this.model.day, this.model.hour - 1);
        } else {
            // check if we have a previous day
            var prevDay = TimeControl.addDays(this.model.day, -1);
            if (this.containsDay(prevDay)) {
                this.update(prevDay, this.model.to);
            }
        }
    }

    _onClickNextHour() {
        if (this.model.hour < this.model.to) {
            this.update(this.model.day, this.model.hour + 1);
        } else {
            // check if we have a next day
            var nextDay = TimeControl.addDays(this.model.day, 1);
            if (this.containsDay(nextDay)) {
                this.update(nextDay, this.model.from);
            }
        }
    }

    _onClickNextDay() {
        var nextDay = TimeControl.addDays(this.model.day, 1);
        if (this.containsDay(nextDay)) {
            this.update(nextDay, this.model.hour);
        }
    }

    update(newDay, newHour) {
        var oldDay = this.model.day;
        var oldHour = this.model.hour;
        this.model.day = newDay;
        this.model.hour = newHour;

        // update day
        this.viewmodel.dayselect.value = TimeControl.formatDate(this.model.day);

        // update hour
        var hourSpan = this.viewmodel.timeslider.getElementsByClassName('hour')[0];
        hourSpan.innerHTML = "- " + this.model.hour + "h";

        // enable disabled states
        var prevDay = TimeControl.addDays(this.model.day, -1);
        this.containsDay(prevDay) ? L.DomUtil.removeClass(this.viewmodel.prevDay, "disabled") : L.DomUtil.addClass(this.viewmodel.prevDay, "disabled");
        var nextDay = TimeControl.addDays(this.model.day, 1);
        this.containsDay(nextDay) ? L.DomUtil.removeClass(this.viewmodel.nextDay, "disabled") : L.DomUtil.addClass(this.viewmodel.nextDay, "disabled");

        // inform
        MPUtil.fireEvent(this.viewmodel.timeslider, "changedatetime", {
            day: this.model.day,
            hour: this.model.hour,
            oldDay: oldDay,
            oldHour: oldHour
        });
    }

    static localToUTC(hour) {
      return hour + TimeControl.tsOffsetH;
    }
    static addDays(date, days) {
        var res = new Date(date);
        res.setDate(res.getDate() + days);
        return res;
    }
    static formatDate(d) {
        return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2); // yyyymmdd
    }
    static parseDate(dateStr) {
      var year = parseInt(dateStr.slice(0, 4));
      var month = parseInt(dateStr.slice(4, 6)) - 1;
      var day = parseInt(dateStr.slice(6, 8));
      return new Date(year, month, day);
    }
    static formatTime(h) {
        return ("0" + h).slice(-2) + "0000"; // hhmmss
    }
}
TimeControl.tsOffsetH = new Date().getTimezoneOffset()/60;
