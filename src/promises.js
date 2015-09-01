/**
 * Created by Jonathan Willis on 28/08/15.
 *
 * Promise manipulation library.
 *
 */

var dataManipulators = require('./data.js');
var cloneArray = require('./arrays.js').clone;
var partialRight = require('./functions.js').partialRight;


function randomInteger(minOrMax, maybeMax) {
    var min, max;
    if( maybeMax===undefined ) {
        min=0; max=minOrMax;
    } else {
        min=minOrMax; max=maybeMax+1;
    }
    return Math.floor(Math.random()*(max-min))+min;
}
function randomTimeout(fn, minOrMax, maybeMax) {
    setTimeout(fn, randomInteger(minOrMax, maybeMax));
}


function createFakeApiCall(data, id, minOrMax, maybeMax) {

    return function() {

        return new Promise(function(resolve, reject) {
            randomTimeout(function() {
                if( id===undefined ) resolve(data);
                else resolve({
                    id: id,
                    payload: data
                });
            }, minOrMax, maybeMax);
        });
    };
}



function promiseTester(assert) {
    var promise, done, nterface;
    function createWrapper(fn) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            promise.then(
                function(actual) {
                    try {
                        args.push(actual);
                        assert[fn].apply(this, args);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }, function(err) {
                    done(err);
                });
        };
    }
    function buildInterface(assert) {
        var prop, nterface = {};

        for( prop in  assert ) {
            if ( typeof assert[prop]==='function' ) {
                nterface[prop] = createWrapper(prop);
            }
        }
        return nterface;
    }
    nterface = buildInterface(assert);

    return function(doneInstance) {
        done = doneInstance;
        return function(p) {
            promise=p;
            return nterface;
        };
    };
}


/**
 * Given a data manipulation function, convert it into a promise converting
 * function.
 *
 * @param manipulatorFn     A function that takes data as its first argument
 * @returns {Function}      A function that can convert a promise producing
 *                          function so that it's final data has the manipulation
 *                          applied.
 */
function promiseDecorator(manipulatorFn) {
    return function(/* promiseFn, partialArgs* */) {
        var args = cloneArray(arguments);
        var promiseFn = args.shift();
        args.unshift(manipulatorFn);
        //var fn = args.shift();
        var manipulator = partialRight.apply(this, args);
        return function() {
            return promiseFn
                    .apply(this, arguments)
                    .then(manipulator);
        };
    };
}

function bind(api) {
    return dataManipulators.reduce(api, function(newApi, fn, name) {
        newApi[name] = promiseDecorator(fn);
        return newApi;
    });
}

var manipulators = bind(dataManipulators);

module.exports = {
      promiseTester:        promiseTester
    , createFakeApiCall:    createFakeApiCall
    , promiseDecorator:     promiseDecorator
    , bind:                 bind
    , manipulators:         manipulators
};