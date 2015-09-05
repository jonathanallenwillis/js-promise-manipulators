/**
 * Created by Jonathan Willis on 28/08/15.
 *
 * Promise manipulation library.
 *
 */

var dataManipulators = require('./data.js');
var cloneArray = require('./arrays.js').clone;
var partialRight = require('./functions.js').partialRight;
var randomTimeout = require('./random.js').timeout;

/**
 * Create a mock API call.
 *
 * @param data
 * @param opts
 * @returns {Function}
 */
function mockApiCall(data, opts) {
    var defaults = {
        // If a string then changes the resolve/rejects to the format { id: id, payload: data }
          id:           undefined
        // If this is >=0 then an exact timeout is set
        , exact:        undefined
        // When exact is undefined, do a call of random timeout in between min-max ms
        , min:          50
        , max:          500
        // whether this call succeeds
        , successful:   true
        // error message to use on failure
        , errorMsg:     'Call failed!'
        // a hook to do some processing of the result before its resolved.
        , processResult:function(result) { return result; }
    };
    opts = dataManipulators.merge(defaults, opts);

    function theResolution(data) {
        return opts.id === undefined
                ? data
                : {
                    id: opts.id,
                    payload: data
                };
    }
    function doResolution(fn, data) {
        fn(opts.processResult(theResolution(data)));
    }
    function doCall(resolve, reject) {
        return function() {
            if (opts.successful) doResolution(resolve, data);
            else doResolution(reject, new Error(opts.errorMsg));
        };
    }
    return function() {
        return new Promise(function(resolve, reject) {
            if( opts.exact>=0 ) setTimeout(doCall(resolve, reject), opts.exact);
            else                randomTimeout(doCall(resolve, reject), opts.min, opts.max);
        });
    };
}


/**
 * Given an assertion framework, return an assertion framework that matches the api
 * but can be used to assert the results of promises.
 *
 * @param assertApi
 * @returns {Function}
 */
function promiseTester(assertApi) {
    var promise, done, nterface;
    function createWrapper(fn) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            promise.then(
                function(actual) {
                    try {
                        args.push(actual);
                        assertApi[fn].apply(this, args);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }, function(err) {
                    done(err);
                });
        };
    }
    function buildInterface(assertApi) {
        var prop, nterface = {};

        for( prop in  assertApi ) {
            if ( typeof assertApi[prop]==='function' ) {
                nterface[prop] = createWrapper(prop);
            }
        }
        return nterface;
    }
    nterface = buildInterface(assertApi);

    return function(doneInstance) {
        done = doneInstance;
        return function(p) {
            promise=p;
            return nterface;
        };
    };
}


/**
 * Given a data manipulation function, convert it into a promise result manipulating
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
/**
 * Given an api of functions that take an object as their first argument,
 * wrap them in a promise so that the result of the promise has that
 * function applied to it.
 *
 * @param api
 * @returns {object}
 */
function bind(api) {
    return dataManipulators.reduce(api, function(newApi, fn, name) {
        newApi[name] = promiseDecorator(fn);
        return newApi;
    });
}

var manipulators = bind(dataManipulators);

/**
 * Given one or more promise returning functions and a consolidator function, call each
 * promise function and apply the consolidator function to it. When all promise fns are
 * done resolve the promise.
 *
 * @param promises
 * @param consolidatorFn
 */
function reduce(promiseFns, consolidatorFn, acc) {

    function resolver(resolve, reject) {
        var promiseFn = promiseFns.shift();
        if( promiseFn===undefined ) {
            resolve(acc);
            return;
        }
        promiseFn()
            .then(
                function(data) {
                    acc = acc===undefined
                            ? data
                            : consolidatorFn(acc, data);
                    resolver(resolve, reject);
                },
                function(error) {
                    reject(error);
                });
    }
    return new Promise(resolver);
}

/**
 * Turns a function that returns a promise into one with a timeout.
 *
 * @param promiseFn
 * @param timeout
 * @returns {Function}
 */

function timeout(promiseFn, timeout) {
    var TIMED_OUT_MSG = 'TIMED OUT';
    var timeoutId = undefined;

    function timeoutDecorator(fn) {
        return function() {
            if( timeoutId===undefined ) return;
            clearTimeout(timeoutId);
            timeoutId = undefined;
            fn.apply(this, arguments);
        };
    }

    return function() {
        return new Promise(function (resolve, reject) {
            timeoutId = setTimeout(function () {
                timeoutId = undefined;
                reject(new Error(TIMED_OUT_MSG));
            }, timeout);

            promiseFn.apply(this, arguments)
                .then(timeoutDecorator(resolve), timeoutDecorator(reject));
        });
    };
}

/**
 * Turns anything into a string that can be used as a key.
 *
 * @param item
 * @returns {string}
 */
function toKeyString(item) {
    if( item instanceof Object ) {
        // Unsure if this is a valid method.
        return JSON.stringify(item).replace(/["':_%!@#$%^&*()]/, '');
    } else {
        return item.toString();
    }
}

/**
 * Creates a unique key from 0+ arguments.
 *
 * @returns {string}    string that can be used as a key to an object map.
 */
function createKey() {
    var i, key='k';
    for(i=0; i<arguments.length; i++) {
        key = key + '.' + toKeyString(arguments[i]);
    }
    return key;
}

/**
 * Given a function that returns a promise, cache the results using the
 * combination of the arguments as a key.
 *
 * Each call is unique by the combination of parameters with which it is called.
 *
 * @param promiseFn
 * @param identity      a function that takes n number of arguments and
 *                      creates a unique value from them
 * @returns {Function}
 */
function memoize(promiseFn, identity) {
    var RESOLVE = 0, REJECT = 1;
    if( identity===undefined ) identity=createKey;
    var cache = {};

    function resolve(cacheItem) {
        var resolver, resolution = cacheItem.resolution;
        while( (resolver = cacheItem.resolvers.shift())!==undefined ) {
            resolver[RESOLVE].apply(this, resolution);
        }
        delete cacheItem.resolvers;
    }
    function createPromise(cacheItem) {
        return new Promise(function (resolve, reject) {
            cacheItem.resolvers.push([resolve, reject]);
        });
    }

    function doPromiseFn(promiseFnArgs, cacheKey, cacheItem) {
        promiseFn
            .apply(this, promiseFnArgs)
            .then(function () {
                //finalize(cacheItem.resolvers, RESOLVE, arguments);
                cacheItem.resolution = arguments;
                resolve(cacheItem);
            }, function () {
                var resolver = cacheItem.resolvers.shift();
                resolver[REJECT].apply(this, arguments);
                if (cacheItem.resolvers.length > 0) {
                    doPromiseFn(promiseFnArgs, cacheKey, cacheItem);
                } else {
                    delete cache[cacheKey]; // don't cache failures
                }
            });
    }

    return function() {
        var key = identity.apply(this, arguments);
        if ( cache[key]===undefined ) {
            // brand new call
            var cacheItem = {
                resolution: undefined,
                resolvers: []
            };
            doPromiseFn(arguments, key, cacheItem);
            cache[key] = cacheItem;
            return createPromise(cacheItem);
        } else {
            // call in progress
            if ( cache[key].resolution===undefined ) {
                // pending
                return createPromise(cache[key]);
            } else {
                // resolved
                return Promise.resolve(cache[key].resolution);
            }
        }
    };
}

module.exports = {
      promiseTester:        promiseTester
    , mockApiCall:    mockApiCall
    , promiseDecorator:     promiseDecorator
    , bind:                 bind
    , manipulators:         manipulators
    , reduce:               reduce
    , timeout:              timeout
    , memoize:              memoize
};