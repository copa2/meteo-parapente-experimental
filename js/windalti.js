var WindAlti = (function() {

    var res = {};

    var c;

    return {

        initialize: function(canvas) {
            c = canvas;
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
            // currently we support only 1 place and 1 date
            res.dates = res.data[varSQ.places][varSQ.dates];
            res.hours = Object.keys(res.dates);
            res.ter = res.dates[res.hours[0]].ter;
        },

        draw: function() {

            c.width = c.offsetWidth;
            c.height = c.offsetHeight;

            var ctx = c.getContext("2d");
            ctx.translate(0.5, 0.5);  // canvas is half pixel :-/

            if (res.data) {

                this.drawComponent(ctx, 40, c.height - 30, c.width - 50, 20, this.drawTimeScale);
                this.drawComponent(ctx, 0, 50, 40, c.height - 80, this.drawHeightScale);
                this.drawComponent(ctx, 50, 0, c.width - 50, 20, this.drawLocalText);
                this.drawComponent(ctx, 40, 25, c.width - 50, 30, this.drawCloudHML);

                this.drawComponent(ctx, 40, 50, c.width - 50, c.height - 80, this.drawTerrain);
                this.drawComponent(ctx, 40, 50, c.width - 50, c.height - 80, this.drawBL);
                this.drawComponent(ctx, 40, 50, c.width - 50, c.height - 80, this.drawClouds);
                this.drawComponent(ctx, 40, 50, c.width - 50, c.height - 80, this.drawWinds);
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
            var part = width / res.hours.length;
            for (var i = 0; i < res.hours.length; i++) {
                var x = (part * i) | 0;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height - 10);
                ctx.stroke();

                // text
                var text = res.hours[i] - tsOffsetH + "h";
                ctx.fillText(text, x + part / 2, height);
            }
        },

        drawHeightScale: function(ctx, width, height) {
            //ctx.strokeRect(0,0,width,height);
            ctx.moveTo(width, 0);
            ctx.lineTo(width, height);
            ctx.stroke();

            ctx.font = "12px Verdana";
            ctx.textAlign = "right";
            var part = height / 9;
            for (var i = 0; i < 10; i++) {
                var text = 4500 - i * 500;
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

        drawCloudHML: function(ctx, width, height) {
            // 3 high,medium,low
            var part = height / 4;

            // rects
            var hourParts = width / res.hours.length;
            for (var i = 0; i < res.hours.length; i++) {

                var hi = res.hours[i];
                var clfh = res.dates[hi].cfrach;
                ctx.fillStyle = 'rgba(100, 100, 100, ' + clfh / 100 + ')';
                ctx.fillRect(hourParts * i, 0, hourParts, part);
                var clfm = res.dates[hi].cfracm;
                ctx.fillStyle = 'rgba(200, 200, 200, ' + clfm / 100 + ')';
                ctx.fillRect(hourParts * i, part, hourParts, part);
                var clfl = res.dates[hi].cfracl;
                ctx.fillStyle = 'rgba(200, 200, 200, ' + clfl / 100 + ')';
                ctx.fillRect(hourParts * i, part * 2, hourParts, part);
            }


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
            var terh = height / 4500 * res.ter;
            ctx.fillStyle = "black";
            ctx.font = "9px Verdana";
            ctx.fillText(res.ter.toFixed(0) + " m", 5, height - terh + 10);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, height - terh, width, terh);
        },

        drawBL: function(ctx, width, height) {
            var terh = height / 4500 * res.ter;
            var ht = height - terh;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            var hourParts = width / res.hours.length;
            for (var i = 0; i < res.hours.length; i++) {
                var hi = res.hours[i];
                var pblh = height / 4500 * res.dates[hi].pblh;
                var y = ht - pblh;
                ctx.fillRect(hourParts * i, y, hourParts, ht - y);
            }
        },

        drawWinds: function(ctx, width, height) {

            var DEG2RAD = Math.PI / 180.;
            ctx.font = "9px Verdana";

            var hourParts = width / res.hours.length;
            for (var i = 0; i < res.hours.length; i++) {
                var hi = res.hours[i];
                var z = res.dates[hi].z;
                var lh = 0;
                for (var j = 0; j < z.length; j++) {
                    if (z[j] > 4500) {
                        break;
                    }
                    var h = height / 4500 * z[j];
                    // don't overdraw
                    if (lh > 0 && h - lh < 8) {
                        continue;
                    }
                    lh = h;

                    var umet = res.dates[hi].umet[j];
                    var vmet = res.dates[hi].vmet[j];

                    var ws = Math.sqrt(umet * umet + vmet * vmet); // windspeed m/s
                    var wskmh = 3.6 * ws; // windspeed km/h

                    //var wd = Math.atan2(umet, vmet) / DEG2RAD + 180.0; // windirection degrees
                    var wd = Math.atan2(umet, vmet) / DEG2RAD; // windirection degrees
                    //console.log(wd);

                    ctx.fillStyle = "black";
                    ctx.fillText(wskmh.toFixed(0), hourParts * i + 20, height - h + 5);

                    var aw = 7 + Math.min(ws, 9);
                    var ah = 7 + Math.min(ws, 9);
                    var ax = hourParts * i + 6;
                    var ay = height - h - (ah / 2);

                    var ar = wd * DEG2RAD;


                    ctx.save();

                    ctx.translate(ax + aw / 2, ay + ah / 2);
                    ctx.rotate(ar);
                    ctx.translate(-aw / 2, -ah / 2);
                    ctx.fillStyle = WindAlti.selectWindColor(ws);
                    WindAlti.drawArrow(ctx, aw, ah);
                    ctx.translate(-(-aw / 2), -(-ah / 2));

                    ctx.restore();
                }
            }
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

        selectWindColor: function(wsms) {

            // TODO: Create gradient...
            var WIND_SPEED_COLORS = Legend.getWindSpeedColors();
            for (var i = 0; i < WIND_SPEED_COLORS.length - 1; i++) {
                var wsl = WIND_SPEED_COLORS[i];
                var wsh = WIND_SPEED_COLORS[i + 1];
                if (wsl[0] < wsms && wsms < wsh[0]) {
                    return "rgba(" + wsl[1] + "," + wsl[2] + "," + wsl[3] + "," + wsl[4] + ")";
                }
            }
            var wsl = WIND_SPEED_COLORS[WIND_SPEED_COLORS.length - 1];
            return "rgba(" + wsl[1] + "," + wsl[2] + "," + wsl[3] + "," + wsl[4] + ")";
        },

        drawClouds: function(ctx, width, height) {

            var hourParts = width / res.hours.length;
            for (var i = 0; i < res.hours.length; i++) {
                var hi = res.hours[i];
                var z = res.dates[hi].z;
                for (var j = 0; j < z.length; j++) {
                    if (z[j] > 4500) {
                        break;
                    }
                    var h = height / 4500 * z[j];

                    //ctx.fillRect(hourParts * i, height - h, 3, 2); // DEBUG Point
                    var clf = res.dates[hi].cldfra[j];
                    if (clf > 0) {
                        var s = 1;
                        if (j < z.length - 1) {
                            s = height / 4500 * z[j + 1];
                        }
                        ctx.fillStyle = 'rgba(200, 200, 200, ' + clf + ')';
                        ctx.fillRect(hourParts * i + 1, height - h, hourParts - 2, (height - h) - (height - s));
                    }

                }
            }
        }

    };

}());
