L.Control.Fullscreen = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-control leaflet-bar');

        this.link = L.DomUtil.create('a', 'leaflet-bar-part', container);
        this.link.href = '#';
        L.DomUtil.create('i', 'fa fa-arrows-alt', this.link);

        this._map = map;
        this._isFullscreen = false;
        L.DomEvent.on(this.link, "click", L.DomEvent.preventDefault)
                  .on(this.link, "click", L.DomEvent.stopPropagation)
                  .on(this.link, "click", this._click);

        return container;
    },

    _click: function(e) {
        if (this._isFullscreen) {
            // Brower hell
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            var b = document.body;
            if (b.requestFullscreen) {
                b.requestFullscreen();
            } else if (b.webkitRequestFullscreen) {
                b.webkitRequestFullscreen();
            } else if (b.mozRequestFullScreen) {
                b.mozRequestFullScreen();
            } else if (b.msRequestFullscreen) {
                b.msRequestFullscreen();
            }
        }
        this._isFullscreen = !this._isFullscreen;
    }

});
