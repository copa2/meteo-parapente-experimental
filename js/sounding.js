var Sounding = (function() {

    var res = {};

    var viewmodel = {
      height: 4500,
      temp: [-20,40],  // tempratue x-axis -20 to 40 degrees
      tempSize: 60
    };

    return {

        initialize: function(canvas) {
            viewmodel.canvas = canvas;
            canvas.addEventListener("mousedown", this._onClick, false);
        },

        load: function(day, run, hour, lat, lng, fn) {
            var sq = this.createSoundingSearchQuery(run, day, hour, lat, lng);
            var url = "https://data0.meteo-parapente.com/json.php?" + MPUtil.queryString(sq);
            MPUtil.httpGetJsonP(url, function(res) {

                // FIXME: Check for valid state and error...

                var data = res;

                // Draw WindAlti on canvas
                Sounding.setData(sq, data);
                Sounding.draw();

                if (fn) {
                    var gridCoords = data[sq.places].gridCoords;
                    fn(gridCoords.lat, gridCoords.lon);
                }
            });
        },

        changeHour: function(day, run, hour) {
            if (res.sq) {
                var latlng = res.sq.places.split(",");
                this.load(day, run, hour, latlng[0], latlng[1]);
            }
        },

        createSoundingSearchQuery: function(run, date, hour, lat, lng) {
            // REVISIT: Probably merge data aggregation for WindAlti and Sounding
            // instead of different calls.

            // convert hour local time to UTC
            var d = new Date()
            var n = d.getTimezoneOffset();
            var tsOffsetH = n / 60;
            hour += tsOffsetH;
            
            return {
                domain: "france",
                run: run,
                places: lat + "," + lng,
                dates: date,
                heures: hour, // UTC
                params: "tc;td;z;ter;umet;vmet;p;pblh"
            };
        },

        setData: function(varSQ, varData) {
            res.sq = varSQ;
            res.data = varData;
            res.places = res.data[varSQ.places];
            // We support currently only 1 place/date/hour
            res.soundingData = res.places[varSQ.dates][varSQ.heures];

            // reset
            viewmodel.height = 4500;
        },

        draw: function() {

            var c = viewmodel.canvas;
            c.width = c.offsetWidth;
            c.height = c.offsetHeight;

            var ctx = c.getContext("2d");
            ctx.translate(0.5, 0.5); // canvas is half pixel :-/

            if (res.data) {

                this.drawComponent(ctx, 40, c.height - 30, c.width - 100, 20, this.drawTemperatureScale);
                this.drawComponent(ctx, 0, 60, 40, c.height - 90, this.drawHeightScale);
                this.drawComponent(ctx, 50, 0, c.width - 50, 20, this.drawLocalText);

                // clip draw area
                var r = {x:40,y:60,w:c.width-100,h:c.height-90};
                ctx.save();
                ctx.rect(r.x,r.y,r.w,r.h);
                ctx.clip();

                this.drawComponent(ctx, r.x,r.y,r.w,r.h, this.drawTerrain);
                this.drawComponent(ctx, r.x,r.y,r.w,r.h, this.drawBL);
                this.drawComponent(ctx, r.x,r.y,r.w,r.h, this.drawTcTd);
                ctx.restore(); // restore clip

                // TODO: Draw wind, Draw gradient tc
                this.drawComponent(ctx, r.x+r.w,r.y,50,r.h, this.drawWinds);
            }
        },

        drawTemperatureScale: function(ctx, width, height) {

            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.stroke();

            ctx.font = "12px Verdana";
            ctx.textAlign = "center";
            var totalParts = viewmodel.tempSize/5;
            var part = width / totalParts;
            for(var i = 0; i < totalParts; i++) {
              // temp seperator
              var x = (part * i) | 0;
              ctx.moveTo(x, 0);
              ctx.lineTo(x, 5);
              ctx.stroke();

              // temp text
              var text = viewmodel.temp[0] + i*5;
              ctx.fillText(text+"°", x, height);
            };
        },

        drawComponent: function(ctx, x, y, width, height, fc) {
            ctx.translate(x, y);
            fc(ctx, width, height);
            ctx.translate(-x, -y);
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
            var text = res.places.gridCoords.location + " - " + res.sq.dates + " " + res.sq.heures + "h UTC";
            ctx.fillText(text, 0, height);
        },

        drawTerrain: function(ctx, width, height) {
            var terh = height / viewmodel.height * res.soundingData.ter;
            ctx.fillStyle = "black";
            ctx.font = "9px Verdana";
            ctx.fillText(res.soundingData.ter.toFixed(0) + " m", 5, height - terh + 10);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, height - terh, width, terh);
        },

        drawBL: function(ctx, width, height) {
            ctx.fillStyle = 'rgba(255, 255, 0, 1)';
            var pblh = res.soundingData.ter + res.soundingData.pblh;
            var y = height - (height / viewmodel.height * pblh);
            ctx.fillRect(0, y, width, 1);
            ctx.fillStyle = "black";
            ctx.font = "9px Verdana";
            ctx.fillText(pblh.toFixed(0) + " m", width-50, y+3);
        },

        drawTcTd: function(ctx, width, height) {

            //var xxx = 200;
            //var xxx = 166; // don't ask me why, but look more natural for our size, 45° would be 100
            var xxx = 100;

            var totalParts = viewmodel.tempSize/5;
            var part = width / totalParts;
            var tcPoints = [];
            var tdPoints = [];
            var tcDiff = [];
            var prevTc = 0;
            var prevY = 0;
            var prevZ = 0;
            for(var i = 0; i < res.soundingData.z.length; i++) {
              var z = res.soundingData.z[i];
              var tc = res.soundingData.tc[i];
              var td = res.soundingData.td[i];

              var xDelta = z / xxx; // temperature is 45° moved

              var x = width / viewmodel.tempSize * (tc+xDelta-viewmodel.temp[0]);
              var y = height - (height / viewmodel.height * z);

              tcPoints.push({x: x, y: y});
              x = width / viewmodel.tempSize * (td+xDelta-viewmodel.temp[0]);
              tdPoints.push({x: x, y: y});

              if(i > 0) {
                // diff per 100m
                var diffZ = z-prevZ;
                var diffTc = prevTc-tc; //tc-prevTc;
                var diffTc100 = diffTc / diffZ * 100;
                //console.log(z.toFixed(0)+":"+tc+":            "+(diffTc / diffZ * 100).toFixed(2));
                tcDiff.push({y1: prevY, y2: y, tcd: diffTc100, h1: prevZ, h2: z});
              }
              prevTc = tc;
              prevY = y;
              prevZ = z;

              if(z > 10000) {
                break;
              }
            }

            // tc
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            Sounding.drawCurve(ctx, tcPoints);
            // td
            ctx.strokeStyle = "blue"
            Sounding.drawCurve(ctx, tdPoints);
            ctx.closePath();

            // draw temperature lines
            ctx.strokeStyle = "black";
            ctx.lineWidth = 0.3;
            for(var i = 0; i < totalParts; i=i+2) {
              var x = (part * i) | 0;
              var d = (viewmodel.tempSize - i*5) * xxx;
              var y = height - (height / viewmodel.height * d);

              ctx.beginPath();
              ctx.moveTo(x,height);
              ctx.lineTo(width,y);
              ctx.stroke();
            }

            // draw tc diffs
            for(i = 0; i < tcDiff.length; i++) {
              var d = tcDiff[i];
              if(d.tcd < 0) {
                // Insotherm / Inversion)
                ctx.fillStyle = "black";
              } else
              if(0 < d.tcd && d.tcd < 0.5) {
                // bad
                ctx.fillStyle = "rgba(200,200,200,0.8)";
              } else
              if(0.5 <= d.tcd && d.tcd < 0.6) {
                // medium
                ctx.fillStyle = "yellow";
              } else
              if(0.6 <= d.tcd && d.tcd <= 0.8) {
                // good
                ctx.fillStyle = "green";
              } else
              if(0.8 < d.tcd) {
                // strong / too strong
                ctx.fillStyle = "red";
              }
              ctx.fillRect(0,d.y2,10,d.y1-d.y2);
              ctx.fillText(d.tcd.toFixed(2), 12, (d.y2+(d.y1-d.y2)/2)+3);
              //ctx.fillText(d.h1.toFixed(2), 12, d.y1+3);
              //ctx.fillText(d.h2.toFixed(2), 12, d.y2+3);
              /*
              ctx.beginPath();
              ctx.moveTo(0,d.y2);
              ctx.lineTo(width,d.y2);
              ctx.stroke();
              */
            }

            // draw dry adiabatic
            ctx.strokeStyle = "rgba(0,128,0,0.8)";
            ctx.setLineDash([5, 3]);/*dashes are 5px and spaces are 3px*/
            ctx.lineWidth = 0.3;
            Sounding.drawDiabatic(ctx, width, height, 1, xxx);

            // draw wet adiabatic
            ctx.strokeStyle = "rgba(0,0,255,0.8)";
            ctx.setLineDash([5, 3]);/*dashes are 5px and spaces are 3px*/
            ctx.lineWidth = 0.3;
            Sounding.drawDiabatic(ctx, width, height, 0.65, xxx);

            // draw mix
        },

        drawDiabatic(ctx, width, height, df, xxx) {
          var totalParts = viewmodel.tempSize/5;
          var part = width / totalParts;
          var da = viewmodel.height/100*df;
          for(var i = 0; i < totalParts; i=i+2) {
            var x = (part * i);
            // degree on base - difference from height
            var t = (i*5) + viewmodel.temp[0] - da;
            var xDelta = viewmodel.height / xxx; // temperature is 45° moved
            //var xTop = width / viewmodel.tempSize * (t+xDelta);
            var xTop = width / viewmodel.tempSize * (t+xDelta-viewmodel.temp[0]);

            ctx.beginPath();
            ctx.moveTo(x|0,height);
            ctx.lineTo(xTop|0,0);
            ctx.stroke();
          }
        },

        drawCurve: function(ctx, points) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
           for (i = 1; i < points.length - 2; i ++) {
              var xc = (points[i].x + points[i + 1].x) / 2;
              var yc = (points[i].y + points[i + 1].y) / 2;
              //ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
              ctx.lineTo(points[i].x, points[i].y);
           }
           //ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x,points[i+1].y);
           ctx.lineTo(points[i+1].x, points[i+1].y);
           ctx.stroke();
        },

        drawWinds: function(ctx, width, height) {
          var DEG2RAD = Math.PI / 180.;
          ctx.font = "9px Verdana";

          var lh = 0;
          for(var i = 0; i < res.soundingData.z.length; i++) {
            var z = res.soundingData.z[i];
            var umet = res.soundingData.umet[i];
            var vmet = res.soundingData.vmet[i];
              if (z > viewmodel.height) {
                  break;
              }
              var h = height / viewmodel.height * z
              // don't overdraw
              if (lh > 0 && h - lh < 8) {
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
      },

        _onClick: function(e) {

          var rect = viewmodel.canvas.getBoundingClientRect();
          var x = event.clientX - rect.left;
          var y = event.clientY - rect.top;

          if(res.data)
            // check within bounds (see draw)
            if( 0 <= x && x <= 40 && 60 <= y && y <= viewmodel.canvas.height-90+60) {
                Sounding.changeHeightScale();
            }
        },

        changeHeightScale: function() {
          if(viewmodel.height == 4500) {
            viewmodel.height = 7000;
          } else if(viewmodel.height == 7000) {
              viewmodel.height = 10000;
          } else if(viewmodel.height == 10000){
            var maxheight = res.soundingData.ter + res.soundingData.pblh + 300;
            viewmodel.height = maxheight + (500 - (maxheight % 500));
          } else {
            viewmodel.height = 4500;
          }
          Sounding.draw();
        }

    };
}());
