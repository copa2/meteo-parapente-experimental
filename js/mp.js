var MP = (function() {

    var model = {
        dayrun: {},
        type: 'wstar'
    };

    return {
        initialize: function() {
            // hillshade layer
            var hillshade = L.tileLayer('https://{s}-rasp.meteo-parapente.com/tiles/hillshade.php/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="http://meteo-parapente.com">meteo-parapente</a>, <a href="http://openstreetmap.org">OpenStreetMap</a>',
                id: 'meteo-parapente.hillshade'
            });
            // osm layer
            var osm = L.tileLayer('https://{s}-rasp.meteo-parapente.com/tiles/osm.php/{z}/{x}/{y}.png', {
                maxZoom: 18,
                id: 'meteo-parapente.osm'
            });

            // keep only 1 overlay layer which gets changed with url
            //'https://{s}-rasp.meteo-parapente.com/tiles/rasp.php/run/datetime/france/type/{z}/{x}/{y}/tile.png'
            var raspLayer = L.tileLayer(this.createDefaultRaspLayerTemplateUrl(), {
                maxZoom: 18,
                id: 'meteo-parapente.rasp',
                opacity: 0.4
            });
            model.raspLayer = raspLayer;

            model.map = L.map('map', {
                center: [46.53619, 7.59155],
                zoom: 8,
                layers: [hillshade, osm, raspLayer],
                //layers: [hillshade, raspLayer],
                zoomControl: false
            });

            model.map.on('click', this.onMapClick);
        },

        getMap: function() {
            return model.map;
        },

        setRaspLayerType: function(type) {
            model.type = type;
            this.updateRaspLayer();
        },

        setDayRun: function(dayrun) {
            model.dayrun = dayrun;
            this.updateRaspLayer();
        },

        getDayRun: function() {
            return model.dayrun;
        },

        updateRaspLayer: function() {
            var run = model.dayrun[TimeControl.formatDate(TimeControl.getDay())];
            var datetime = TimeControl.formatDate(TimeControl.getDay()) + TimeControl.formatTime(TimeControl.getHour());
            model.raspLayer.setUrl(this.createRaspLayerTemplateUrl(run, datetime, model.type));
        },

        onMapClick: function(e) {
            // set a marker on click position
            MP.setMarker(e.latlng.lat, e.latlng.lng);

            // open side panel which shows windalti canvas
            var sp = L.DomUtil.get('slide-panel');
            L.DomUtil.removeClass(sp, "collapsed");

            // Load and show WindAlti data
            var date = TimeControl.formatDate(TimeControl.getDay());
            var run = model.dayrun[date];
            WindAlti.load(date, run, e.latlng.lat, e.latlng.lng, function(lat, lng) {
                // update marker position
                MP.setMarker(lat, lng);
            });
        },

        setMarker: function(lat, lng) {
            if (model.marker) {
                model.map.removeLayer(model.marker);
            }
            model.marker = L.marker([lat, lng]).addTo(model.map);
        },

        createRaspLayerTemplateUrl: function(run, time, type) {
            // rasp.php/{run}/{time}/france/{type}/{z}/{x}/{y}/tile.png
            return 'https://{s}-rasp.meteo-parapente.com/tiles/rasp.php/' + run + '/' + time + '/france/' + type + '/{z}/{x}/{y}/tile.png'
        },

        createDefaultRaspLayerTemplateUrl: function() {
            // this is a hack - probably load just later
            var today = new Date();
            var run = TimeControl.formatDate(TimeControl.addDays(today, -3)) + '06';
            var datetime = TimeControl.formatDate(today) + TimeControl.formatTime(13);
            return this.createRaspLayerTemplateUrl(run, datetime, 'wstar');
        },

        // -------------------------------------------------------------------------
        // left sidebar
        initializeSidebar: function() {
            model.sidebar = L.control.sidebar('sidebar').addTo(model.map);
            // add actions for rasp-layers
            var rasplayertypes = L.DomUtil.get('sidebar').querySelectorAll('ul.rasp-layers > li > a')
            for (var i = 0; i < rasplayertypes.length; i++) {
                var e = rasplayertypes[i];
                e.hasAttribute("href") &&
                    "#" == e.getAttribute("href").slice(0, 1) &&
                    L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", MP.onClickChangeLayer)
            }
        },

        onClickChangeLayer: function() {
            var type = this.getAttribute("href").substring(1);
            MP.setRaspLayerType(type);
            Legend.selectLayer(type);
            // make visible move this code to on hover
            var sb = L.DomUtil.get('sidebar')
            var rasplayertypes = sb.querySelectorAll('ul.rasp-layers > li > a')
            for (var i = 0; i < rasplayertypes.length; i++) {
                var e = rasplayertypes[i];
                e === this ? L.DomUtil.addClass(e, 'selected') : L.DomUtil.removeClass(e, 'selected');
            }
            var explainEles = sb.querySelectorAll('div.explain > div');
            for (var i = 0; i < explainEles.length; i++) {
                var e = explainEles[i];
                L.DomUtil.hasClass(e, type) ? L.DomUtil.addClass(e, 'visible') : L.DomUtil.removeClass(e, 'visible');
            }

            // close only when screen is small
            if (window.innerWidth < 768) {
                model.sidebar.close();
            }
        },

        // -------------------------------------------------------------------------
        // right slide-panel
        initializeSlidePanel: function() {
            var spo = L.DomUtil.get('opener');
            L.DomEvent.on(spo, "click", L.DomEvent.preventDefault).on(spo, "click", this.toggleSlidePanel);
            var sp = L.DomUtil.get('slide-panel');
            sp.addEventListener('transitionend', function(event) {
                MP.getMap().invalidateSize();
            }, false);
        },

        toggleSlidePanel: function(e) {
            var sp = L.DomUtil.get('slide-panel');
            L.DomUtil.hasClass(sp, "collapsed") ? L.DomUtil.removeClass(sp, "collapsed") : L.DomUtil.addClass(sp, "collapsed");
        }

    };

}());
