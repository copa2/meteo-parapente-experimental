var Legend = (function() {

    // m/s, rgba
    var WIND_SPEED_COLORS = [
        [0, 255, 255, 255, 255],
        [0.92, 0, 255, 255, 255],
        [1.86, 3, 230, 175, 255],
        [2.78, 5, 204, 95, 255],
        [3.69, 8, 179, 15, 255],
        [4.64, 88, 204, 10, 255],
        [5.56, 168, 228, 5, 255],
        [6.47, 248, 253, 0, 255],
        [7.42, 255, 228, 0, 255],
        [8.33, 255, 198, 0, 255],
        [9.25, 255, 168, 0, 255],
        [10.19, 255, 115, 0, 255],
        [11.11, 255, 60, 0, 255],
        [12.03, 255, 5, 0, 255],
        [12.97, 204, 0, 41, 255],
        [13.89, 148, 0, 87, 255],
        [999, 150, 150, 150, 255]
    ];

    // m, rgba
    var ALTITUDE_COLORS = [
        [-250, 255, 255, 255, 255],
        [0.1, 0, 0, 255, 255],
        [250, 0, 85, 255, 255],
        [500, 0, 170, 255, 255],
        [750, 0, 255, 255, 255],
        [1000, 3, 230, 175, 255],
        [1250, 5, 204, 95, 255],
        [1500, 8, 179, 15, 255],
        [1750, 88, 204, 10, 255],
        [2000, 168, 228, 5, 255],
        [2250, 248, 253, 0, 255],
        [2500, 255, 228, 0, 255],
        [2750, 255, 198, 0, 255],
        [3000, 255, 168, 0, 255],
        [3250, 255, 115, 0, 255],
        [3500, 255, 60, 0, 255],
        [3750, 255, 5, 0, 255],
        [4000, 204, 0, 41, 255],
        [4250, 148, 0, 87, 255]
    ];

    // m, rgba
    var THERMAL_COLORS = [
        [0, 255, 255, 255, 255],
        [0.5, 255, 247, 172, 255, 0],
        [1, 255, 231, 0, 255],
        [1.5, 202, 222, 45, 255],
        [2, 101, 214, 0, 255],
        [2.5, 0, 255, 181, 255],
        [3, 0, 208, 255, 255],
        [3.5, 0, 128, 255, 255],
        [4, 0, 0, 255, 255],
        [4.5, 128, 0, 255, 255],
        [5, 255, 0, 255, 255],
        [5.5, 255, 0, 128, 255],
        [6, 255, 0, 0, 255],
        [6.5, 128, 0, 0, 255],
        [7, 0, 0, 0, 255]
    ];

    var BSRATIO_COLORS = [
        [0, 165, 0, 38, 255],
        [1, 215, 48, 39, 255, 0],
        [2, 244, 109, 67, 255],
        [3, 253, 174, 97, 255],
        [4, 254, 224, 139, 255],
        [5, 217, 239, 139, 255],
        [6, 166, 217, 106, 255],
        [7, 102, 189, 99, 255],
        [8, 26, 152, 80, 255],
        [9, 0, 104, 55, 255]
    ];

    var CONVERGENCE_COLORS = [
        [-250, 165, 0, 38, 255],
        [-200, 215, 48, 39, 255, 0],
        [-150, 244, 109, 67, 255],
        [-100, 253, 174, 97, 255],
        [-50, 254, 224, 139, 255],
        [0, 217, 239, 139, 255],
        [50, 166, 217, 106, 255],
        [100, 102, 189, 99, 255],
        [150, 26, 152, 80, 255],
        [200, 0, 104, 55, 255]
    ];

    var CLOUD_COLORS = [
        [0, 204, 204, 204, 255],
        [10, 189, 198, 209, 255],
        [20, 172, 189, 214, 255],
        [30, 156, 181, 219, 255],
        [40, 136, 172, 224, 255],
        [50, 116, 161, 229, 255],
        [60, 97, 152, 235, 255],
        [70, 72, 139, 240, 255],
        [80, 51, 129, 245, 255],
        [90, 26, 116, 250, 255],
        [100, 0, 102, 255, 255]
    ];

    var RAIN_COLORS = [
        [0, 204, 204, 204, 255],
        [0.1, 170, 255, 255, 255],
        [1, 85, 213, 255, 255],
        [2, 42, 170, 255, 255],
        [5, 42, 127, 255, 255],
        [10, 0, 85, 192, 255],
        [15, 0, 42, 192, 255],
        [20, 170, 0, 127, 255]
    ];

    var TEMPERATUR_COLORS = [
        [0, 0, 0, 255, 255],
        [2.5, 0, 85, 255, 255],
        [5, 0, 170, 255, 255],
        [7.5, 0, 255, 255, 255],
        [10, 3, 230, 175, 255],
        [12.5, 5, 204, 95, 255],
        [15, 8, 179, 15, 255],
        [17.5, 88, 204, 10, 255],
        [20, 168, 228, 5, 255],
        [22.5, 248, 253, 0, 255],
        [25, 255, 228, 0, 255],
        [27.5, 255, 198, 0, 255],
        [30, 255, 168, 0, 255],
        [32.5, 255, 115, 0, 255],
        [35, 255, 60, 0, 255],
        [37.5, 255, 5, 0, 255],
        [40, 204, 0, 41, 255]
    ];

    var PRESSURE_COLORS = [
        [995, 0, 0, 255, 255],
        [997, 0, 85, 255, 255],
        [999, 0, 170, 255, 255],
        [1001, 0, 255, 255, 255],
        [1003, 3, 230, 175, 255],
        [1005, 5, 204, 95, 255],
        [1007, 8, 179, 15, 255],
        [1009, 88, 204, 10, 255],
        [1011, 168, 228, 5, 255],
        [1013, 248, 253, 0, 255],
        [1015, 255, 228, 0, 255],
        [1017, 255, 198, 0, 255],
        [1019, 255, 168, 0, 255],
        [1021, 255, 115, 0, 255],
        [1023, 255, 60, 0, 255],
        [1025, 255, 5, 0, 255],
        [1027, 204, 0, 41, 255],
        [1029, 148, 0, 87, 255]
    ];

    var model = {
        type: 'wstar',
    };

    return {

        initialize: function(c) {
            model.canvas = c;
            this.selectLayer('wstar');
        },

        draw: function() {

            model.canvas.width = model.canvas.offsetWidth;
            model.canvas.height = model.canvas.offsetHeight;

            var ctx = model.canvas.getContext("2d");
            ctx.translate(0.5, 0.5);

            var width = model.canvas.width;
            var height = model.canvas.height;

            var selectedLegend = this.getPalette();
            var part = (width - 25) / selectedLegend.length;
            for (var i = 0; i < selectedLegend.length; i++) {
                var l = selectedLegend[i];
                ctx.fillStyle = "rgba(" + l[1] + "," + l[2] + "," + l[3] + "," + l[4] + ")";
                ctx.fillRect(part * i | 0, 0, part | 0, 17);
            }
            ctx.font = "8px Verdana";
            ctx.textAlign = "left";
            ctx.fillStyle = "black";
            for (var i = 0; i < selectedLegend.length; i++) {
                var x = (part * i) | 0;
                var text = this.format(selectedLegend[i][0]);
                ctx.fillText(text, x, 25);
            }

            ctx.fillText(this.getValueType(), part * selectedLegend.length | 0, 15);
        },

        selectLayer: function(type) {
            model.type = type;
            this.draw();
        },

        getPalette: function() {
            if (model.type == 'wstar') {
                return THERMAL_COLORS;
            } else
            if (model.type == 'bsratio') {
                return BSRATIO_COLORS;
            } else
            if (model.type.indexOf('wind') !== -1) {
                return WIND_SPEED_COLORS;
            } else
            if (model.type == 'wblmaxmin') {
                return CONVERGENCE_COLORS;
            } else
            if (model.type.indexOf('cfrac') !== -1) {
                return CLOUD_COLORS;
            } else
            if (model.type == 'raintot') {
                return RAIN_COLORS;
            } else
            if (model.type == 'tc2') {
                return TEMPERATUR_COLORS;
            } else
            if (model.type == 'slp') {
                return PRESSURE_COLORS;
            }
            return ALTITUDE_COLORS;
        },

        getValueType: function() {
            if (model.type == 'wstar') {
                return "m/s";
            } else
            if (model.type == 'bsratio') {
                return "";
            } else
            if (model.type.indexOf('wind') !== -1) {
                return "km/h";
            } else
            if (model.type == 'wblmaxmin') {
                return "cm/s";
            } else
            if (model.type.indexOf('cfrac') !== -1) {
                return "%";
            } else
            if (model.type == 'raintot') {
                return "mm";
            } else
            if (model.type == 'tc2') {
                return "°C";
            } else
            if (model.type == 'slp') {
                return "hPa";
            }

            return "m";
        },

        format: function(val) {
            if (model.type.indexOf('wind') !== -1) {
                return (val * 3.6).toFixed(0); // km/h
            }
            return val;
        },

        getWindSpeedColors: function() {
            return WIND_SPEED_COLORS;
        }

    };

}());
