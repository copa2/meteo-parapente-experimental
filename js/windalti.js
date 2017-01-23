var WindAlti = (function() {

    var res = {};

    var viewmodel = {
      height: 4500               // default height on heightscale
    };

    return {

        initialize: function(canvas) {
            viewmodel.canvas = canvas;
            canvas.addEventListener("mousedown", this._onClick, false);
        },

        load: function(day, run, lat, lng, fn) {
            var sq = this.createWindAltiSearchQuery(run, day, lat, lng);
            var url = "https://data0.meteo-parapente.com/json.php?" + MPUtil.queryString(sq);
            //MPUtil.httpGet("http://localhost:8080/test/windalti.json", function(res) {
            //var data = JSON.parse(res);
            MPUtil.httpGetJsonP(url, function(res) {

                // FIXME: Check for valid state and error...

                var data = res;

                // Draw WindAlti on canvas
                WindAlti.setData(sq, data);
                WindAlti.draw();

                if (fn) {
                    var gridCoords = data[sq.places].gridCoords;
                    fn(gridCoords.lat, gridCoords.lon);
                }
            });
        },

        changeDay: function(day, run) {
            if (res.sq) {
                var latlng = res.sq.places.split(",");
                this.load(day, run, latlng[0], latlng[1]);
            }
        },

        createWindAltiSearchQuery: function(run, date, lat, lng) {
            return {
                domain: "france",
                run: run,
                places: lat + "," + lng,
                dates: date,
                heures: "5;6;7;8;9;10;11;12;13;14;15;16;17;18;19;20;21", // UTC
                params: "z;umet;vmet;ter;pblh;raintot;cfracl;cfracm;cfrach;cldfra"
            };
        },

        setData: function(varSQ, varData) {
            res.sq = varSQ;
            res.data = varData;
            res.places = res.data[varSQ.places];
            res.dates = varSQ.dates.split(";");
            //res.hours = Object.keys(res.dates);
            var data = res.places[res.dates[0]]; // first date
            var hi = Object.keys(data)[0]; // first hour of first date
            res.ter = data[hi].ter;
            //
            var ht = 0;
            for (i = 0; i < res.dates.length; i++) {
                for (h in res.places[res.dates[i]]) {
                    ht++;
                }
            }
            res.totalHour = ht;

            // reset
            viewmodel.height = 4500;
        },

        forEachEntry: function(fn) {
            var hi = 0;
            for (var di = 0; di < res.dates.length; di++) {
                var date = res.dates[di]
                for (hour in res.places[date]) {
                    var data = res.places[date][hour];
                    fn(di, hi, date, hour, data);
                    hi++;
                }
            }
        },

        draw: function() {

            var c = viewmodel.canvas;
            c.width = c.offsetWidth;
            c.height = c.offsetHeight;

            var ctx = c.getContext("2d");
            ctx.translate(0.5, 0.5); // canvas is half pixel :-/

            if (res.data) {

                this.drawComponent(ctx, 40, c.height - 30, c.width - 50, 20, this.drawTimeScale);
                this.drawComponent(ctx, 0, 60, 40, c.height - 90, this.drawHeightScale);
                this.drawComponent(ctx, 50, 0, c.width - 50, 20, this.drawLocalText);
                this.drawComponent(ctx, 40, 25, c.width - 50, 40, this.drawCloudHMLRain);

                this.drawComponent(ctx, 40, 60, c.width - 50, c.height - 90, this.drawTerrain);
                this.drawComponent(ctx, 40, 60, c.width - 50, c.height - 90, this.drawBL);
                this.drawComponent(ctx, 40, 60, c.width - 50, c.height - 90, this.drawClouds);
                this.drawComponent(ctx, 40, 60, c.width - 50, c.height - 90, this.drawWinds);
            }
        },

        drawComponent: function(ctx, x, y, width, height, fc) {
            ctx.translate(x, y);
            fc(ctx, width, height);
            ctx.translate(-x, -y);
        },

        drawTimeScale: function(ctx, width, height) {

            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.stroke();

            // hmm this would be local time to browser but not location...
            var d = new Date()
            var n = d.getTimezoneOffset();
            var tsOffsetH = n / 60;

            ctx.font = "12px Verdana";
            ctx.textAlign = "center";
            var part = width / res.totalHour;
            var ldi = 0;
            WindAlti.forEachEntry(function(di, hi, date, hour, data) {
                // day separator
                if (di != ldi) {
                    var x = (part * hi) | 0;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                    ldi = di;
                }
                // hour separator
                var x = (part * hi) | 0;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height - 10);
                ctx.stroke();

                // hour text
                var text = hour - tsOffsetH + "h";
                ctx.fillText(text, x + part / 2, height);

            });
        },

        drawHeightScale: function(ctx, width, height) {
            //ctx.strokeRect(0,0,width,height);
            ctx.moveTo(width, 0);
            ctx.lineTo(width, height);
            ctx.stroke();

            ctx.font = "12px Verdana";
            ctx.textAlign = "right";
            var pl = viewmodel.height / 500;
            var part = height / pl;
            for (var i = 0; i < pl+1; i++) {
                var text = viewmodel.height - i * 500;
                var y = (part * i) | 0;
                ctx.fillText(text, width - 5, y + 3);

                ctx.moveTo(width, y);
                ctx.lineTo(width - 3, y);
                ctx.stroke();
            }
        },

        drawLocalText: function(ctx, width, height) {
            ctx.font = "12px Verdana";
            ctx.textAlign = "left";
            var text = res.data[res.sq.places].gridCoords.location + " - " +
                res.sq.dates + " - km/h";
            ctx.fillText(text, 0, height);
        },

        drawCloudHMLRain: function(ctx, width, height) {
            // 3 high,medium,low
            var part = height / 5;

            // rects
            var hourParts = width / res.totalHour;
            WindAlti.forEachEntry(function(di, hi, date, hour, data) {
                var clfh = data.cfrach;
                ctx.fillStyle = clfh == "NaN" ? "coral" : 'rgba(100, 100, 100, ' + clfh / 100 + ')';
                ctx.fillRect(hourParts * hi, 0, hourParts, part);
                var clfm = data.cfracm;
                ctx.fillStyle = clfm == "NaN" ? "coral" : 'rgba(200, 200, 200, ' + clfm / 100 + ')';
                ctx.fillRect(hourParts * hi, part, hourParts, part);
                var clfl = data.cfracl;
                ctx.fillStyle = clfl == "NaN" ? "coral" : 'rgba(200, 200, 200, ' + clfl / 100 + ')';
                ctx.fillRect(hourParts * hi, part * 2, hourParts, part);

                // rain - overdraw into following data...
                var rain = data.raintot; // mm
                ctx.fillStyle = WindAlti.selectColor(rain, Legend.getRainColors());
                ctx.fillRect(hourParts * hi, part * 3, hourParts, part);

            });

            // lines
            for (var i = 0; i < 4; i++) {
                // lines
                var y = (part * i) | 0;
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
        },

        drawTerrain: function(ctx, width, height) {
            var terh = height / viewmodel.height * res.ter;
            ctx.fillStyle = "black";
            ctx.font = "9px Verdana";
            ctx.fillText(res.ter.toFixed(0) + " m", 5, height - terh + 10);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, height - terh, width, terh);
        },

        drawBL: function(ctx, width, height) {
            var terh = height / viewmodel.height * res.ter;
            var ht = height - terh;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            var hourParts = width / res.totalHour;
            WindAlti.forEachEntry(function(di, hi, date, hour, data) {
                var pblh = height / viewmodel.height * data.pblh;
                var y = ht - pblh;
                ctx.fillRect(hourParts * hi, y, hourParts, ht - y);
            });
        },

        drawWinds: function(ctx, width, height) {

            var DEG2RAD = Math.PI / 180.;
            ctx.font = "9px Verdana";

            var hourParts = width / res.totalHour;
            WindAlti.forEachEntry(function(di, hi, date, hour, data) {
                var lh = 0;
                for (var j = 0; j < data.z.length; j++) {
                    if (data.z[j] > viewmodel.height) {
                        break;
                    }
                    var h = height / viewmodel.height * data.z[j];
                    // don't overdraw
                    if (lh > 0 && h - lh < 8) {
                        continue;
                    }
                    lh = h;

                    var umet = data.umet[j];
                    var vmet = data.vmet[j];

                    var ws = Math.sqrt(umet * umet + vmet * vmet); // windspeed m/s
                    var wskmh = 3.6 * ws; // windspeed km/h

                    //var wd = Math.atan2(umet, vmet) / DEG2RAD + 180.0; // windirection degrees
                    var wd = Math.atan2(umet, vmet) / DEG2RAD; // windirection degrees
                    //console.log(wd);

                    ctx.fillStyle = "black";
                    ctx.fillText(wskmh.toFixed(0), hourParts * hi + 25, height - h + 5);

                    var aw = 7 + Math.min(ws, 9);
                    var ah = 7 + Math.min(ws, 9);
                    var ax = hourParts * hi + 6;
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
            });
        },

        drawArrow: function(ctx, width, height) {
            ctx.beginPath();

            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width - 2, height);
            ctx.lineTo(width / 2, height / 3 * 2);
            ctx.lineTo(2, height);

            ctx.closePath();
            ctx.stroke();
            ctx.fill();

        },

        selectColor: function(value, colors) {
          if(value == "NaN") {
            return "coral";
          }
          // TODO: Create gradient...
          for (var i = 0; i < colors.length - 1; i++) {
              var l = colors[i];
              var h = colors[i + 1];
              if (l[0] <= value && value < h[0]) {
                  return "rgba(" + l[1] + "," + l[2] + "," + l[3] + "," + l[4] + ")";
              }
          }
          var c = colors[colors.length - 1];
          return "rgba(" + c[1] + "," + c[2] + "," + c[3] + "," + c[4] + ")";
        },

        drawClouds: function(ctx, width, height) {

            var hourParts = width / res.totalHour;
            WindAlti.forEachEntry(function(di, hi, date, hour, data) {
                for (var j = 0; j < data.z.length; j++) {
                    if (data.z[j] > viewmodel.height) {
                        break;
                    }
                    var h = height / viewmodel.height * data.z[j];

                    //ctx.fillRect(hourParts * i, height - h, 3, 2); // DEBUG Point
                    var clf = data.cldfra[j];
                    if (clf > 0) {
                        var s = 1;
                        if (j < data.z.length - 1) {
                            s = height / viewmodel.height * data.z[j + 1];
                        }
                        ctx.fillStyle = 'rgba(200, 200, 200, ' + clf + ')';
                        ctx.fillRect(hourParts * hi + 1, height - h, hourParts - 2, (height - h) - (height - s));
                    }
                }
            });
        },

        _onClick: function(e) {

          var rect = viewmodel.canvas.getBoundingClientRect();
          var x = event.clientX - rect.left;
          var y = event.clientY - rect.top;

          if(res.data)
            // check within bounds (see draw)
            if( 0 <= x && x <= 40 && 60 <= y && y <= viewmodel.canvas.height-90+60) {
                WindAlti.changeHeightScale();
            }
        },

        changeHeightScale: function() {
          if(viewmodel.height == 4500) {
            viewmodel.height = 10000;
          } else if(viewmodel.height == 10000){
            var maxpblh = 0;
            WindAlti.forEachEntry(function(di,hi,date,hour,data) {
              maxpblh = Math.max(maxpblh,data.pblh);
            });
            var maxheight = res.ter + maxpblh + 300;
            viewmodel.height = maxheight + (500 - (maxheight % 500));
          } else {
            viewmodel.height = 4500;
          }
          WindAlti.draw();
        }

    };

}());
