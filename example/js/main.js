/**
 * Created by Jonathan Willis on 21/08/15.
 */

console.log('Sample loaded');

function what() {
    console.log(arguments);
}

/**
 Format:
 { lon: 34.34444, lat: 43.234 }
 */

var onlyLatLon = _.partial(jaw.pluck, ['lon', 'lat']);
//function transform(promise, fn) {
//    return promise
//        .then(fn);
//}
function transform(callFn, transformFn) {
    return callFn().then(transformFn);
}

var IpServices = {
    ipapi: transform(_.partial(makeCall, 'http://ip-api.com/json/'), onlyLatLon),
    ipinfo: transform(
        _.partial(makeCall, 'http://ipinfo.io/'),
        function (data) {
            var parts = data.loc.split(',');
            return {
                lat: parseFloat(parts[0]),
                lon: parseFloat(parts[1])
            };
        })
};


function makeCall(url) {
    var ajax = {
        url: url,
        dataType: 'jsonp',
        timeout: 2000
    };
    return $.ajax(ajax);
}

//var ipInfo = createApiCall(
//    'http://ipinfo.io/',
//    {
//        map: {
//            ip:'ip', city:'city', 'postal': 'postalCode',
//            'country':'country', region:'region', loc:'loc'
//        },
//        converter: function(data) {
//            if ( data.loc!==undefined ) {
//                var parts = data.loc.split(',');
//                data.lat = parseFloat(parts[0]);
//                data.long = parseFloat(parts[1]);
//                delete data.loc;
//            }
//            return data;
//        }
//    }
//);
//
//var ipApi = createApiCall(
//    'http://ip-api.com/json/',
//    {
//        map: {
//            query:'ip', city:'city', zip:'postalCode', countryCode:'country',
//            regionName:'region', lat:'lat', lon:'long'
//        }
//    }
//);
//
//var freeGeoIp = createApiCall(
//    'http://freegeoip.net/json/',
//    {
//        map: {
//            ip:'ip', countr_code:'country', region_name:'region', city:'city', zip_code:'postalCode', latitude:'lat', longitude:'long'
//        }
//    }
//);



function main() {
    //var map = new mxn.Mapstraction('map', 'openlayers');
    //var latlon = new mxn.LatLonPoint(39.74,-104.98);
    //map.setCenterAndZoom(latlon, 10);
}
window.onload=main;