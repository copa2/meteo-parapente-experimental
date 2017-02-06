class TimeSlider {
    constructor(ts) {
      //const ts = document.getElementById('timeslider');
      this.viewmodel = {
        timeslider: ts,
        progress: ts.getElementsByClassName('progress')[0],
        timehour: ts.getElementsByClassName('timehour')[0],
        daycontainer: ts.getElementsByClassName('daycontainer')[0],
        parentOffsetLeft: ts.offsetLeft,
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
      ts.onmousedown = this.onMouseDown.bind(this);
      ts.onmouseup = this.onMouseUp.bind(this);
      ts.onmousemove = this.onMouseMove.bind(this);

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
            dele.innerHTML = dayNames[d.getDay()] +" "+ d.getDate();
            daycontainer.appendChild(dele);
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
      const daywidth = this.viewmodel.daycontainer.offsetWidth/this.model.days.length;
      let x = i*daywidth;
      x += daywidth/this.hoursPerDay*(this.model.hour-this.model.hours[0]);
      this.viewmodel.progress.style.width = x + "px";
      this.viewmodel.timehour.style.left = x + "px";
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
        this.updateSlider(e);
      }
    }

    onMouseUp(e) {
      if(e.which === 1) {
        this.viewmodel.pressed = false;
        this.updateTime(e);
      }
    }

    onMouseMove(e) {
      if(this.viewmodel.pressed) {
        this.updateSlider(e);
      }
    }

    updateSlider(e) {
      const x = e.pageX - this.viewmodel.parentOffsetLeft;
      this.viewmodel.progress.style.width = x + "px";
      this.viewmodel.timehour.style.left = x + "px";
      const h = this.model.hours[0] + this.hoursPerDay/e.target.offsetWidth*e.offsetX;
      this.viewmodel.timehour.innerHTML = h.toFixed(0) +":00";
    }

    updateTime(e) {
      var oldDay = this.model.day;
      var oldHour = this.model.hour;

      const v = this.model.hours[0] + this.hoursPerDay/e.target.offsetWidth*e.offsetX;
      this.model.hour = parseInt(v.toFixed(0));
      this.model.day = e.target.day;

      // inform
      MPUtil.fireEvent(this.viewmodel.timeslider, "changedatetime", {
          day: this.model.day,
          hour: this.model.hour,
          oldDay: oldDay,
          oldHour: oldHour
      });

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
}
