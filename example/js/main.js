/**
 * Created by Jonathan Willis on 21/08/15.
 */

console.log('Sample loaded');

function what() {
    console.log(arguments);
}


function createApiCall(url) {
    return function() {
        return makeCall(url);
    };
}

function makeCall(url) {
    var ajax = {
        url: url,
        dataType: 'jsonp'
    };
    return $.ajax(ajax)
        .then(
        // normalize success to just return data
        function(data, status, xhrObj) {
            data.url = url;
            return data;
        });
}

/**
 Format:
 { lon: 34.34444, lat: 43.234 }
 */

function avg() {
    var i, total=0;
    for( i=arguments.length-1; i>=0; i--) {
        total += arguments[i];
    }
    return total/arguments.length;
}

function collectData(data, v, k) {
    if( k!=='loc' ) {
        data[k] = v;
        return data;
    }
    var parts = v.split(',');
    data.lat = parseFloat(parts[0].trim());
    data.lon = parseFloat(parts[1].trim());
    return data;
}

var LocationServices = {
      ipapi:        createApiCall('http://ip-api.com/json/')
    , freegeoip:    createApiCall('http://freegeoip.net/json/')
    , ipinfo:       createApiCall('http://ipinfo.io/')
    , telize:       createApiCall('http://www.telize.com/geoip')
};

var createFakeApiCall = jaw.promises.createFakeApiCall;
var LocationServices = {
      ipapi:        createFakeApiCall({"url":"http://ip-api.com/json/", "as":"AS5645 TekSavvy Solutions, Inc.","city":"Toronto","country":"Canada","countryCode":"CA","isp":"TekSavvy Solutions","lat":43.6899,"lon":-79.3853,"org":"TekSavvy Solutions","query":"107.179.159.142","region":"ON","regionName":"Ontario","status":"success","timezone":"America/Toronto","zip":"M4T"}, undefined, 300)
    , freegeoip:    createFakeApiCall({"url":"http://freegeoip.net/json/", "ip":"107.179.159.142","country_code":"CA","country_name":"Canada","region_code":"","region_name":"","city":"","zip_code":"","time_zone":"","latitude":43.643,"longitude":-79.388,"metro_code":0},undefined, 300)
    , ipinfo:       createFakeApiCall({"url":"http://ipinfo.io/", "ip": "107.179.159.142","hostname": "107-179-159-142.cpe.teksavvy.com","city": null,"country": "CA","loc": "43.6425,-79.3872","org": "AS5645 TekSavvy Solutions, Inc."},undefined, 300)
    , telize:       createFakeApiCall({"url":"http://www.telize.com/geoip", "country_code3":"CAN","country":"Canada","isp":"TekSavvy Solutions, Inc.","country_code":"CA","dma_code":"0","continent_code":"NA","area_code":"0","ip":"107.179.159.142","asn":"AS5645","latitude":43.6425,"longitude":-79.3872})
};

var manipulators = jaw.promises.manipulators;
var LocationServicesNormalized = {
      ipapi: manipulators.pluck(LocationServices.ipapi, ['url', 'lat', 'lon'])
    , freegeoip: manipulators.combine(LocationServices.freegeoip, [ jaw.data.pluck, ['url', 'latitude', 'longitude'] ], [ jaw.data.remap, { latitude: 'lat', longitude: 'lon'} ])
    , ipinfo: manipulators.combine(LocationServices.ipinfo, [ jaw.data.pluck, ['url', 'loc'] ], [ jaw.data.reduce, collectData, {}])
    , telize: manipulators.combine(LocationServices.telize, [ jaw.data.pluck, ['url', 'latitude', 'longitude'] ], [ jaw.data.remap, { latitude: 'lat', longitude: 'lon'} ])
};


function createMap(id, type) {
    var map = new mxn.Mapstraction(id, type);
    map.addLargeControls();
    return map;
}

function randomHexCode() {
    return _.shuffle('ABCDEF0123456789'.split(''))[0];
}

function randomColorCode() {
    return _.times(6, randomHexCode).join('');
}

function generateIconImageUrl(symbol, colorHex) {
    if( typeof symbol!=='string' ) symbol = 'A';
    if( typeof colorHex!=='string' ) colorHex = randomColorCode();
    return 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + symbol + '|' + colorHex;
}

function createRendererWithId(id) {
    return _.template(document.getElementById(id).innerHTML);
}

function getHostnameFromUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname==='' ? url : a.hostname;
}

var itemRowRenderer = createRendererWithId('item-row-tpl');

/**
 * @param location {object}     lat, lon, url
 */
function renderLocation(mapSymbol, location, map) {
    var point = new mxn.LatLonPoint(location.lat, location.lon);
    var marker = new mxn.Marker(point);
    var iconUrl = generateIconImageUrl(mapSymbol.toString());
    marker.setIcon(iconUrl, [21, 34]);
    marker.setShadowIcon('http://chart.apis.google.com/chart?chst=d_map_pin_shadow');
    marker.setLabel(location.url);
    marker.setInfoBubble(location.url);
    map.addMarker(marker);

    var html = itemRowRenderer({
          icon_url: iconUrl
        , title:    getHostnameFromUrl(location.url)
        , coords:   location.lat.toFixed(3) + '  ' + location.lon.toFixed(3)
    });
    $('.service-feedback').append(html);
}

function main() {

    locationLookups = _.values(LocationServicesNormalized);
    //map = createMap('map', 'openlayers');
    map = createMap('map', 'googlev3');

    jaw.promises.reduce(locationLookups, function(acc, location) {
        console.log('step', location);

        acc.push(location);
        return acc;
    }, []).then(function(locations) {
        var avgLocation = {
            url: 'avgLocation',
            lat: avg.apply(this, _.pluck(locations, 'lat')),
            lon: avg.apply(this, _.pluck(locations, 'lon'))
        };
        console.log('Avg', avgLocation);

        locations.forEach(function(location, i) {
            renderLocation(i+1, location, map);
        });
        renderLocation('A', avgLocation, map);
        map.autoCenterAndZoom();
    });

}

window.onload=main;