L.Control.Sidebar = L.Control.extend({
    options: {
        position: "left"
    },
    initialize: function(sidebarid) {
        this._sidebar = L.DomUtil.get(sidebarid);
        // TabItems
        this._tabitems = this._sidebar.querySelectorAll("ul.sidebar-tabs > li, .sidebar-tabs > ul > li");
        // Content
        this._container = this._sidebar.getElementsByClassName("sidebar-content")[0];
        // add sidebar panes
        this._panes = [];
        this._closeButtons = [];
        for (let e of this._container.children) {
            if (L.DomUtil.hasClass(e, "sidebar-pane")) {
                this._panes.push(e);
                this._closeButtons.push(e.querySelector(".sidebar-close"));
            }
        }
    },
    addTo: function(map) {
        this._map = map;
        for (let ti of this._tabitems) {
            var e = ti.querySelector("a");
            if (e.hasAttribute("href") && "#" == e.getAttribute("href").slice(0, 1)) {
                L.DomEvent.on(e, "click", L.DomEvent.preventDefault).on(e, "click", this._onClick, ti);
                ti._sidebar = this;
            }
        }
        for (let cb of this._closeButtons) {
            L.DomEvent.on(cb, "click", this._onCloseClick, this);
        }
        return this;
    },
    onRemove: function(map) {
        // TODO: remove handlers
        for (let cb of this._closeButtons) {
            L.DomEvent.off(cb, "click", this._onCloseClick, this);
        }
    },
    open: function(id) {
        for (let p of this._panes) {
            p.id == id ? L.DomUtil.addClass(p, "active") : L.DomUtil.removeClass(p, "active");
        }
        for (let ti of this._tabitems) {
            ti.querySelector("a").hash == "#" + id ? L.DomUtil.addClass(ti, "active") : L.DomUtil.removeClass(ti, "active");
        }
        L.DomUtil.removeClass(this._sidebar, "collapsed");
    },
    close: function() {
        for (let ti of this._tabitems) {
            if (L.DomUtil.hasClass(ti, "active")) {
                L.DomUtil.removeClass(ti, "active");
            }
        }
        L.DomUtil.addClass(this._sidebar, "collapsed");
    },
    _onClick: function(e) {
        if (L.DomUtil.hasClass(this, "active")) {
            this._sidebar.close();
        } else {
            let id = this.querySelector("a").hash.slice(1);
            this._sidebar.open(id);
        }
    },
    _onCloseClick: function() {
        this.close()
    }
});
