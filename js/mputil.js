class MPUtil {

    static httpGet(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }

    static httpGetJsonP(url, callback) {
        var callbackName = 'jsonp' + Math.round(100000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            callback(data);
        };

        var script = document.createElement('script');
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
        document.body.appendChild(script);
    }

    static queryString(obj) {
        var s = [];
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                s.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        }
        return s.join("&");
    }

    static fireEvent(el, eventName, options) {
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

    static debounce(func, wait, immediate) {
    	var timeout;
    	return function() {
    		var context = this, args = arguments;
    		var later = function() {
    			timeout = null;
    			if (!immediate) func.apply(context, args);
    		};
    		var callNow = immediate && !timeout;
    		clearTimeout(timeout);
    		timeout = setTimeout(later, wait);
    		if (callNow) func.apply(context, args);
    	};
    }

    // range=[min,max], step
    static range(range, step = 1) {
       let arr=[];
       for(let i = range[0]; i <= range[1]; i=i+step) {
        arr.push(i);
       }
       return arr;
    }

    // x value, from=[min,max], to=[min,max]
    static mapLinear(x, from, to) {
      return ( x - from[0] ) * ( to[1] - to[0] ) / ( from[1] - from[0] ) + to[0];
    }


 }
