class TimeSlider {
    constructor(ts) {
      //const ts = document.getElementById('timeslider');
      this.viewmodel = {
        timeslider: ts,
        progress: ts.getElementsByClassName('progress')[0],
        timehour: ts.getElementsByClassName('timehour')[0],
        daycontainer: ts.getElementsByClassName('daycontainer')[0],
        parentOffsetLeft: ts.offsetLeft,
        daywidth: 160, // FIXME
        pressed: false
      };
      this.model = {
        hours: [6,22],
        day: TimeSlider.formatDate(new Date()),
        hour: 13,
        days: []
      };

      this.hoursPerDay = this.model.hours[1]-this.model.hours[0]+1;

      // register events
      ts.addEventListener("mousedown", this.onMouseDown.bind(this));
      ts.addEventListener("mouseup", this.onMouseUp.bind(this));
      ts.addEventListener("mousemove", this.onMouseMove.bind(this));
      this.viewmodel.daycontainer.addEventListener("scroll", this.onScroll.bind(this));

      var debounceUpdateTime = MPUtil.debounce(this.updateTime.bind(this),100);
      this.viewmodel.daycontainer.addEventListener("scroll", debounceUpdateTime);
      // touch is another world...
      //ts.addEventListener("touchstart", this.onMouseDown.bind(this));
      //ts.addEventListener("touchend", this.onMouseUp.bind(this));
      //ts.addEventListener("touchmove", this.onMouseMove.bind(this));

    }

    setDays(days) {
        this.model.days = days;
        // update options
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const daycontainer = this.viewmodel.daycontainer;
        // clear
        while (daycontainer.firstChild) {
          daycontainer.removeChild(daycontainer.firstChild);
        }
        // add divs
        for (let i = 0; i < days.length; i++) {
            let key = days[i];
            let d = TimeSlider.parseDate(key);
            const dele = document.createElement("div");
            dele.day = key;
            //dele.innerHTML = dayNames[d.getDay()] +" "+ d.getDate();

            // hours
            const span = document.createElement("span");
            span.className += "hours";
            dele.appendChild(span);
            // 8x20=160px
            // reconsider on number of hours what is the best and which size
            // till 160px
            const dd = (this.hoursPerDay-1)/8;
            for(let j = 0; j < 8; j++){
              const span2 = document.createElement("span");
              span2.innerHTML = j*dd+this.model.hours[0]+1;
              span.appendChild(span2);
            }
            daycontainer.appendChild(dele);
            const ds = document.createElement("span");
            ds.innerHTML = dayNames[d.getDay()] +" "+ d.getDate();
            dele.appendChild(ds);
        }
    }

    // hours=[from,to]
    setHourRange(hours) {
        this.model.hours = hours;
        this.hoursPerDay = this.model.hours[1]-this.model.hours[0]+1;
    }

    selectDate(d) {
      this.model.day = TimeSlider.formatDate(d);
      let i = 0;
      for(i = 0; i < this.model.days.length; i++) {
        if(this.model.days[i] == this.model.day) {
          break;
        }
      }

      let x = i*this.viewmodel.daywidth;
      x += this.viewmodel.daywidth/this.hoursPerDay*(this.model.hour-this.model.hours[0]);
      this.viewmodel.daycontainer.scrollLeft = x;

      this.viewmodel.timehour.innerHTML = this.model.hour.toFixed(0) +":00";
    }

    addChangeListener(fn) {
      this.viewmodel.timeslider.addEventListener("changedatetime", fn);
    }

    getHour() {
      return this.model.hour;
    }

    getDay() {
      return this.model.day;
    }

    onMouseDown(e) {
      if(e.which === 1) {
        this.viewmodel.pressed = true;
        this.viewmodel.pressedX = e.pageX;
        this.viewmodel.startX = e.pageX;
      }
    }

    onMouseUp(e) {
      if(e.which === 1) {
        this.viewmodel.pressed = false;
        if(this.viewmodel.startX == e.pageX) {
          const deltaX = e.pageX-this.viewmodel.timeslider.offsetLeft-this.viewmodel.timeslider.offsetWidth/2;
          //this.viewmodel.daycontainer.scrollLeft += deltaX;
          this.animatedScroll(deltaX);
        }
      }
      this.updateTime();
    }

    animatedScroll(deltaX) {
      var endPos = this.viewmodel.daycontainer.scrollLeft + deltaX;
      var steps = 15
      var scrollStep = deltaX / steps;
      var scrollInterval = setInterval(function(){
        if (Math.abs(this.viewmodel.daycontainer.scrollLeft-endPos) > Math.abs(scrollStep)) {
            this.viewmodel.daycontainer.scrollLeft += scrollStep;
        } else {
          this.viewmodel.daycontainer.scrollLeft = endPos;
          clearInterval(scrollInterval);
        }
      }.bind(this),(300/steps));
    }

    onMouseMove(e) {
      if(this.viewmodel.pressed) {
        const deltaX = this.viewmodel.pressedX-e.pageX;
        this.viewmodel.pressedX = e.pageX;
        this.viewmodel.daycontainer.scrollLeft += deltaX;
      }
    }

    onScroll(e) {
      // set hour
      const daypos = this.viewmodel.daycontainer.scrollLeft/this.viewmodel.daywidth;
      const h = this.model.hours[0] + (this.hoursPerDay-1)*(daypos%1);
      this.viewmodel.timehour.innerHTML = h.toFixed(0) +":00";
    }

    updateTime() {

      var oldDay = this.model.day;
      var oldHour = this.model.hour;

      const daypos = this.viewmodel.daycontainer.scrollLeft/this.viewmodel.daywidth;
      const h = this.model.hours[0] + (this.hoursPerDay-1)*(daypos%1);
      this.model.hour = parseInt(h.toFixed(0));
      this.model.day = this.model.days[Math.floor(daypos)];

      // inform when something has changed
      if(this.model.day != oldDay || this.model.hour != oldHour) {
        MPUtil.fireEvent(this.viewmodel.timeslider, "changedatetime", {
            day: this.model.day,
            hour: this.model.hour,
            oldDay: oldDay,
            oldHour: oldHour
        });
      }
    }

    static localToUTC(hour) {
     return hour + TimeSlider.tsOffsetH;
    }
    static addDays(date, days) {
        var res = new Date(date);
        res.setDate(res.getDate() + days);
        return res;
    }

    static formatDate(d) {
        return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2); // yyyymmdd
    }
    static formatTime(h) {
        return ("0" + h).slice(-2) + "0000"; // hhmmss
    }

    static parseDate(dateStr) {
      var year = parseInt(dateStr.slice(0, 4));
      var month = parseInt(dateStr.slice(4, 6)) - 1;
      var day = parseInt(dateStr.slice(6, 8));
      return new Date(year, month, day);
    }
}
TimeSlider.tsOffsetH = new Date().getTimezoneOffset()/60;
