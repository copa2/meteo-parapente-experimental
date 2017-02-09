/**
 * Component to draw a Sounding diagram.
 *
 * There exist multiple diagramms:
 *  - Emmagram:
 *  - Tephigramm
 *  - Skew-T log p
 *  - Stüve
 *
 * NOTE: Our diagramm is not of equal area.
 *
 * Proper diagramms have pressure/temperature and keep the energy.
 * DryAdiabats (PotentialTemperatur) start from 0K and 0hpa.
 *
 */
class Sounding {
    constructor() {
        this.res = {};
        this.viewmodel = {
            height: 4500,
            temp: [-20, 40], // temperature x-axis -20 to 40 degrees
            tempSize: 60,
            thxxx: 166.666, // temperature axis °degrees moved per 100m  100=1°/100m, 200=0.5°/100m, 166.666=0.6°/100m
            visible: {
              dry: true,
              wet: true,
              mr: true
            }
        };
        this.visible = true;
    }

    initialize(canvas) {
        this.viewmodel.canvas = canvas;
        canvas.addEventListener("mousedown", this._onClick.bind(this));
        window.addEventListener('orientationchange', this.draw.bind(this));	// redraw on mobile orientation change
    }

    load(day, run, hour, lat, lng, fn) {
        var sq = this.createSoundingSearchQuery(run, day, hour, lat, lng);
        // optimization - only load if we are visible
        if(!this.visible) {
          this.pendingSq = sq;
        } else {
          this.loadSq(sq, fn);
        }
    }

    loadSq(sq, fn) {
      var url = "https://data0.meteo-parapente.com/json.php?" + MPUtil.queryString(sq);
      MPUtil.httpGetJsonP(url, function(res) {

          // FIXME: Check for valid state and error...

          var data = res;

          // Draw Sounding data on canvas
          this.setData(sq, data);
          this.draw();

          if (fn) {
              var gridCoords = data[sq.places].gridCoords;
              fn(gridCoords.lat, gridCoords.lon);
          }
      }.bind(this));
      this.pendingSq = null;
    }

    changeHour(day, run, hour) {
        if (this.res.sq) {
            var latlng = this.res.sq.places.split(",");
            this.load(day, run, hour, latlng[0], latlng[1]);
        }
    }

    // this is only for optimization in loading of data
    // if we are not visible we just save the search query
    setVisible(visible) {
      this.visible = visible;
      if(visible) {
        if(this.pendingSq != null) {
          this.loadSq(this.pendingSq);
        } else {
          this.draw();
        }
      }
    }

    createSoundingSearchQuery(run, date, hour, lat, lng) {
        // REVISIT: Probably merge data aggregation for WindAlti and Sounding
        // instead of different calls.

        hour = TimeSlider.localToUTC(hour);
        // RASP
        return {
            domain: "france",
            run: run,
            places: lat + "," + lng,
            dates: date,
            heures: hour, // UTC
            params: "tc;td;z;ter;umet;vmet;p;pblh"
        };

        // Arome
        // json-arome.php
        // params=tc;td;ter;uwind;vwind;pblh;press
    }

    setData(varSQ, varData) {
        this.res.sq = varSQ;
        this.res.data = varData;
        this.res.places = this.res.data[varSQ.places];
        // We support currently only 1 place/date/hour
        this.res.soundingData = this.res.places[varSQ.dates][varSQ.heures];

        // reset
        this.viewmodel.height = 4500;
    }

    draw() {

        var c = this.viewmodel.canvas;
        c.width = c.offsetWidth;
        c.height = c.offsetHeight;

        var ctx = c.getContext("2d");
        ctx.translate(0.5, 0.5); // canvas is half pixel :-/

        if (this.res.data) {

            this.drawComponent(ctx, 40, c.height - 30, c.width - 100, 20, this.drawTemperatureScale);
            this.drawComponent(ctx, 0, 60, 40, c.height - 90, this.drawHeightScale);
            this.drawComponent(ctx, 50, 0, c.width - 50, 20, this.drawLocalText);
            this.drawComponent(ctx, 50, 30, c.width - 50, 20, this.drawMenu);

            // clip draw area
            var r = {
                x: 40,
                y: 60,
                w: c.width - 100,
                h: c.height - 90
            };
            ctx.save();
            ctx.rect(r.x, r.y, r.w, r.h);
            ctx.clip();
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawTerrain);
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawBL);
            // Lines
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawTemperatureLines);
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawDryAdiabats);
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawWetAdiabats);
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawMixingRatios);
            // Data
            this.drawComponent(ctx, r.x, r.y, r.w, r.h, this.drawTcTd);
            ctx.restore(); // restore clip

            this.drawComponent(ctx, r.x + r.w, r.y, 50, r.h, this.drawWinds);
        }
    }

    drawTemperatureScale(ctx, width, height) {

        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();

        ctx.font = "12px Verdana";
        ctx.textAlign = "center";
        var totalParts = this.viewmodel.tempSize / 5;
        var part = width / totalParts;
        for (var i = 0; i < totalParts; i++) {
            // temp seperator
            var x = (part * i) | 0;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 5);
            ctx.stroke();

            // temp text
            var text = this.viewmodel.temp[0] + i * 5;
            ctx.fillText(text + "°", x, height);
        };
    }

    drawComponent(ctx, x, y, width, height, fc) {
        ctx.translate(x, y);
        fc.bind(this)(ctx, width, height);
        ctx.translate(-x, -y);
    }

    drawHeightScale(ctx, width, height) {
        //ctx.strokeRect(0,0,width,height);
        ctx.moveTo(width, 0);
        ctx.lineTo(width, height);
        ctx.stroke();

        ctx.font = "12px Verdana";
        ctx.textAlign = "right";
        var pl = this.viewmodel.height / 500;
        var part = height / pl;
        for (var i = 0; i < pl + 1; i++) {
            var text = this.viewmodel.height - i * 500;
            var y = (part * i) | 0;
            ctx.fillText(text, width - 5, y + 3);

            ctx.moveTo(width, y);
            ctx.lineTo(width - 3, y);
            ctx.stroke();
        }
    }

    drawLocalText(ctx, width, height) {
        ctx.font = "12px Verdana";
        ctx.textAlign = "left";
        var text = this.res.places.gridCoords.location + " - " + this.res.sq.dates + " " + this.res.sq.heures + "h UTC";
        ctx.fillText(text, 0, height);
    }

    drawTerrain(ctx, width, height) {
        var terh = height / this.viewmodel.height * this.res.soundingData.ter;
        ctx.fillStyle = "black";
        ctx.font = "9px Verdana";
        ctx.fillText(this.res.soundingData.ter.toFixed(0) + " m", 5, height - terh + 10);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, height - terh, width, terh);
    }

    drawBL(ctx, width, height) {
        ctx.fillStyle = 'rgba(255, 255, 0, 1)';
        var pblh = this.res.soundingData.ter + this.res.soundingData.pblh;
        var y = height - (height / this.viewmodel.height * pblh);
        ctx.fillRect(0, y, width, 1);
        ctx.fillStyle = "black";
        ctx.font = "9px Verdana";
        ctx.fillText(pblh.toFixed(0) + " m", width - 50, y + 3);
    }

    drawTemperatureLines(ctx, width, height) {

      ctx.strokeStyle = "black";
      let tempSteps = MPUtil.range([-80,40],10); // draw bigger range
      for(let ts of tempSteps) {
        var x = MPUtil.mapLinear(ts, this.viewmodel.temp, [0,width]);
        var d = (120 - (ts+80)) * this.viewmodel.thxxx; // skew
        var y = height - (height / this.viewmodel.height * d);

        // 0 line bolder
        if(ts == 0) {
          ctx.lineWidth = 0.6;
        } else {
          ctx.lineWidth = 0.3;
        }

        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // normaly dry adiabats are from positoin 0K,0hpa down the pot.temperature line
    drawDryAdiabats(ctx, width, height) {
      if(!this.viewmodel.visible.dry) {
        return;
      }

      ctx.strokeStyle = "rgba(0,200,0,1)";

      ctx.setLineDash([]);
      ctx.lineWidth = 0.4;
      this.drawDiabatic(ctx, width, height, 0.98); // temp change of 0.98° per 100m
    }

    drawDiabatic(ctx, width, height, df) {

        var da = this.viewmodel.height / 100 * df;
        var xDelta = this.viewmodel.height / this.viewmodel.thxxx; // temperature skew
        let steps = MPUtil.range([-20,60],5); // draw bigger range
        for(let tempBase of steps) {
            var x = MPUtil.mapLinear(tempBase, this.viewmodel.temp, [0,width]);
            let tempTop  = tempBase - da;
            let xTop = width / this.viewmodel.tempSize * (tempTop + xDelta - this.viewmodel.temp[0]);

            ctx.beginPath();
            ctx.moveTo(x, height);
            ctx.lineTo(xTop, 0);
            ctx.stroke();
        }
    }

    drawWetAdiabats(ctx, width, height) {
      if(!this.viewmodel.visible.wet) {
        return;
      }
      // draw wet adiabatic
      ctx.strokeStyle = "rgba(0,0,255,1)";
      ctx.lineWidth = 0.4;
      ctx.setLineDash([2, 2]);

      // calculate malr(moist adiabatic lapse rate)
      const pl = (this.viewmodel.height+100) / 100; // each 100 meters
      let steps = MPUtil.range(this.viewmodel.temp,5);
      for(let t of steps) {
          let p = [];
          let malr = 0;
          for (let i = 0; i < pl; i++) {
              var z = i * 100;
              t = t + (100 * -malr);

              var press = MeteoMath.altitudeToPressure(z);
              malr = MeteoMath.calculateMALR(press, t); //[C/m]

              var xDelta = z / this.viewmodel.thxxx; // temp skew
              var x = width / this.viewmodel.tempSize * (t + xDelta - this.viewmodel.temp[0]);
              var y = height - (height / this.viewmodel.height * z);

              p.push({ x: x,  y: y });
          }
          this.drawCurve(ctx, p);
      }
    }

    drawMixingRatios(ctx, width, height) {
      if(!this.viewmodel.visible.mr) {
        return;
      }

      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.setLineDash([5, 2, 1, 2]);
      ctx.lineWidth = 0.3;

      // mixing ratios g/kg
      const pl = (this.viewmodel.height+100) / 100;
      let mixingratios = [0.4,0.6,0.8,1.0,1.5,2.0,3.0,4.0,6.0,8.0,10.0,15.0,20.0,30.0];
      for(let mr of mixingratios) {
        let mrpoints = [];
        for (let i = 0; i < pl; i++) {
          let z = i * 100;
          let press = MeteoMath.altitudeToPressure(z);
          let t = MeteoMath.saturationMixingRatioTemperature(press,mr);

          var xDelta = z / this.viewmodel.thxxx; // temperature skew
          var x = width / this.viewmodel.tempSize * (t + xDelta - this.viewmodel.temp[0]);
          var y = height - (height / this.viewmodel.height * z);

          mrpoints.push({x:x, y:y});
        }
        this.drawCurve(ctx, mrpoints);
      }
    }

    // draw lines from sounding data
    drawTcTd(ctx, width, height) {

        var totalParts = this.viewmodel.tempSize / 5;
        var part = width / totalParts;
        var tcPoints = [];
        var tdPoints = [];
        var tcDiff = [];
        var prevTc = 0;
        var prevY = 0;
        var prevZ = 0;
        for (var i = 0; i < this.res.soundingData.z.length; i++) {
            var z = this.res.soundingData.z[i];
            var tc = this.res.soundingData.tc[i];
            var td = this.res.soundingData.td[i];

            var xDelta = z / this.viewmodel.thxxx; // temperature skew
            var xtc = width / this.viewmodel.tempSize * (tc + xDelta - this.viewmodel.temp[0]);
            var y = height - (height / this.viewmodel.height * z);

            tcPoints.push({ x: xtc, y: y });
            var xtd = width / this.viewmodel.tempSize * (td + xDelta - this.viewmodel.temp[0]);
            tdPoints.push({ x: xtd, y: y });

            // calculate temperature difference for providing a gradient
            if (i > 0) {
                var diffZ = z - prevZ;
                var diffTc = prevTc - tc;
                var diffTc100 = diffTc / diffZ * 100;

                tcDiff.push({ y1: prevY, y2: y, tcd: diffTc100 });
            }
            prevTc = tc;
            prevY = y;
            prevZ = z;

            if(z > this.viewmodel.height) {
              break;
            }
        }
        // reset
        ctx.setLineDash([]);

        // tc
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        this.drawCurve(ctx, tcPoints);
        // td
        ctx.strokeStyle = "blue"
        this.drawCurve(ctx, tdPoints);

        // draw tc diffs
        for (i = 0; i < tcDiff.length; i++) {
            var d = tcDiff[i];
            if (d.tcd < 0) {
                // Insotherm / Inversion)
                ctx.fillStyle = "black";
            } else
            if (0 < d.tcd && d.tcd < 0.5) {
                // bad
                ctx.fillStyle = "rgba(200,200,200,0.8)";
            } else
            if (0.5 <= d.tcd && d.tcd < 0.6) {
                // medium
                ctx.fillStyle = "khaki";
            } else
            if (0.6 <= d.tcd && d.tcd <= 0.8) {
                // good
                ctx.fillStyle = "green";
            } else
            if (0.8 < d.tcd) {
                // strong / too strong
                ctx.fillStyle = "red";
            }
            ctx.fillRect(0, d.y2, 10, d.y1 - d.y2);
            ctx.fillText(d.tcd.toFixed(2), 12, (d.y2 + (d.y1 - d.y2) / 2) + 3);

        }
    }

    drawCurve(ctx, points) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        let i = 1;
        for (; i < points.length - 2; i++) {
            //var xc = (points[i].x + points[i + 1].x) / 2;
            //var yc = (points[i].y + points[i + 1].y) / 2;
            //ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            ctx.lineTo(points[i].x, points[i].y);
        }
        //ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x,points[i+1].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
    }

    drawWinds(ctx, width, height) {
        var DEG2RAD = Math.PI / 180.;
        ctx.font = "9px Verdana";

        var lh = 0;
        for (var i = 0; i < this.res.soundingData.z.length; i++) {
            var z = this.res.soundingData.z[i];
            var umet = this.res.soundingData.umet[i];
            var vmet = this.res.soundingData.vmet[i];
            if (z > this.viewmodel.height) {
                break;
            }
            var h = height / this.viewmodel.height * z
            // don't overdraw
            if (lh > 0 && h - lh < 8) {
                // TODO: add together and calculate weighted avg
                continue;
            }
            lh = h;

            var ws = Math.sqrt(umet * umet + vmet * vmet); // windspeed m/s
            var wskmh = 3.6 * ws; // windspeed km/h
            var wd = Math.atan2(umet, vmet) / DEG2RAD; // windirection degrees

            ctx.fillStyle = "black";
            ctx.fillText(wskmh.toFixed(0), 25, height - h + 5);

            var aw = 7 + Math.min(ws, 9);
            var ah = 7 + Math.min(ws, 9);
            var ax = 6;
            var ay = height - h - (ah / 2);

            var ar = wd * DEG2RAD;

            ctx.save();

            ctx.translate(ax + aw / 2, ay + ah / 2);
            ctx.rotate(ar);
            ctx.translate(-aw / 2, -ah / 2);
            ctx.fillStyle = WindAlti.selectColor(ws, Legend.getWindSpeedColors());
            WindAlti.drawArrow(ctx, aw, ah);
            ctx.translate(-(-aw / 2), -(-ah / 2));

            ctx.restore();
        }
    }

    drawMenu(ctx, width, height) {
      // dry
      ctx.fillStyle = "rgb(0,200,0)";
      ctx.fillRect(0, 0, 20, 10);
      // wet
      ctx.fillStyle = "rgb(0,0,255)";
      ctx.fillRect(30, 0, 20, 10);
      // mr
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(60, 0, 20, 10);
    }

    _onClick(e) {

        var rect = this.viewmodel.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        if (this.res.data) {
          // check within bounds (see draw)
          if (0 <= x && x <= 40 && 60 <= y && y <= this.viewmodel.canvas.height - 90 + 60) {
              this.changeHeightScale();
          }
          // menu
          if (50 <= x && x <= this.viewmodel.canvas.width - 50 && 30 <= y && y <= 30 + 20) {
            this.changeDiagrammVisibility(x);
          }
          // temp for experimenting
          if (50 <= x && x <= this.viewmodel.canvas.width - 50 && 0 <= y && y <= 20) {
              if (this.viewmodel.thxxx == 100) {
                  this.viewmodel.thxxx = 166.666;
              } else if (this.viewmodel.thxxx == 166.666) {
                  this.viewmodel.thxxx = 200;
              } else {
                  this.viewmodel.thxxx = 100;
              }
              this.draw();
          }
        }

    }

    changeHeightScale() {
        if (this.viewmodel.height == 4500) {
            this.viewmodel.height = 7000;
        } else if (this.viewmodel.height == 7000) {
            this.viewmodel.height = 10000;
        } else if (this.viewmodel.height == 10000) {
            var maxheight = this.res.soundingData.ter + this.res.soundingData.pblh + 300;
            this.viewmodel.height = maxheight + (500 - (maxheight % 500));
        } else {
            this.viewmodel.height = 4500;
        }
        this.draw();
    }

    changeDiagrammVisibility(x) {
      if (50 <= x && x <= 70) {
        this.viewmodel.visible.dry = !this.viewmodel.visible.dry;
      } else if(80 <= x && x <= 100) {
        this.viewmodel.visible.wet = !this.viewmodel.visible.wet;
      } else if(110 <= x && x <= 130) {
        this.viewmodel.visible.mr = !this.viewmodel.visible.mr;
      }
      this.draw();
    }
}
