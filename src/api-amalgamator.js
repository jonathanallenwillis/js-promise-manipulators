/**
 * Created by Jonathan Willis on 20/08/15.
 */


var jaw_data = require('./data.js');


/**
 * Given a list of apiCalls (preprimed functions) and a combiner,
 * return a notification object that can be observed into in order to
 * be notified of successive updates to the
 *
 * @param: {array}      each apiCall should be a function ready to be
 *                      executed and return the same data structure. *
 * @param: {function}   is given the accumulator and new data from the
 *                      next api call.
 */
function amalgamator(apiCalls, combiner) {
    var notifier = {
        _listeners: [],
        notify: function(data) {
            var i;
            for(i=0; i<this._listeners.length; i++) {
                this._listeners[i](data);
            }
        },
        update: function(fn) {
            this._listeners.push(fn);
        }
    };
    var data=null;
    if( typeof combiner!=="function" ) combiner = function(data) { return data; };
    apiCalls.forEach(function(apiCall) {
        apiCall().then(function(response) {
            if( data===null ) {
                data = response;
            } else {
                data = combiner(data, response);
            }
            notifier.notify(data);
        });
    });
    return notifier;
}

module.exports = {
    amalgamator: amalgamator
};
