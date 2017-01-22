var MPUtil = (function() {

    return {

        httpGet: function(theUrl, callback) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                    callback(xmlHttp.responseText);
            }
            xmlHttp.open("GET", theUrl, true); // true for asynchronous
            xmlHttp.send(null);
        },

        httpGetJsonP: function(url, callback) {
            var callbackName = 'jsonp' + Math.round(100000 * Math.random());
            window[callbackName] = function(data) {
                delete window[callbackName];
                document.body.removeChild(script);
                callback(data);
            };

            var script = document.createElement('script');
            script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
            document.body.appendChild(script);
        },

        queryString: function(obj) {
            var s = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    s.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            }
            return s.join("&");
        },

        fireEvent: function(el, eventName, options) {
            var event;
            if (window.CustomEvent) {
                event = new CustomEvent(eventName, {
                    detail: options
                });
            } else {
                event = document.createEvent('CustomEvent');
                event.initCustomEvent(eventName, true, true, options);
            }
            el.dispatchEvent(event);
        }


    };

}());
