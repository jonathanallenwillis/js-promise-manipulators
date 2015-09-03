(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Jonathan Willis on 01/09/15.
 */


var slice = Function.prototype.call.bind(Array.prototype.slice);

module.exports = {
      slice:      slice
    , clone:      slice
};
},{}],2:[function(require,module,exports){
/**
 * Created by Jonathan Willis on 27/08/15.
 */


var __hop = Object.prototype.hasOwnProperty;
var cloneArray = require('./arrays').clone;

/**
 * Returns the "first" pair in an object according to the for operator.
 *
 * WARNING: do not assume order.
 *
 * @param obj
 * @returns {object}    a key: value pair
 */
function first(obj) {
    for( var k in obj ) {
        if( __hop.call(obj, k) ) {
            var pair = {};
            pair[k] = obj[k];
            return  pair;
        }
    }
    return undefined;
}

function rest(obj) {
    var keys = Object.keys(obj);

    if ( keys.length===0 ) return undefined;
    keys.shift();

    var rest = {}, i;
    for( i=0; i<keys.length; i++ ) {
        rest[keys[i]] = obj[keys[i]];
    }
    return rest;
}

/**
 * Returns the "first" pair in an object according to the for operator
 * and removes it from the original.
 *
 * WARNING: do not assume order.
 *
 * @param obj
 * @returns {object}    a key: value pair
 */
function shift(obj) {
    for( var k in obj ) {
        if( __hop.call(obj, k) ) {
            var pair = {};
            pair[k] = obj[k];
            delete obj[k];
            return  pair;
        }
    }
}


/**
 * reduce for objects.
 *
 * @param obj
 * @param fn
 * @param acc {*}   defaults to new empty object
 * @returns {*}
 */
function reduce(obj, fn, acc) {
    var k;

    if( acc===undefined ) acc = {};

    for( k in obj ) {
        if( __hop.call(obj, k) ) {
            acc = fn(acc, obj[k], k);
        }
    }
    return acc;
}


var DEFAULT_SEPARATOR = '/';
function prefix(obj, prefix, separator) {
    separator = separator || DEFAULT_SEPARATOR;
    return reduce(obj, function(newObj, v, k) {
        newObj[prefix + separator + k] = v;
        return newObj;
    }, {});
}

/**
 * Check if param is an object.
 *
 * ??Should it return false on functions??
 *
 * @param maybeObject
 * @returns {boolean}
 */
function isObject(maybeObject) {
    return maybeObject instanceof Object;
}

/**
 * Given POO of arbitrary depth and an optional separator
 * and creates a new one level deep POO.
 *
 * @param obj
 * @param separator     defaults to '/'
 * @returns {object}    new object
 */
function flatten(obj, separator) {
    separator = separator || DEFAULT_SEPARATOR;
    function helper(obj, newObj, prefix) {
        return reduce(obj, function(newObj, v, k) {
            var newKey = prefix + separator + k;
            if( isObject(v) ) {
                helper(v, newObj, newKey);
            } else {
                newObj[newKey] = v;
            }
            return newObj;
        }, newObj);
    }
    return reduce(obj, function (newObj, v, k) {
        if( isObject(v) ) {
            helper(v, newObj, k);
        } else {
            newObj[k] = v;
        }
        return newObj;
    }, {});
}

function explode(obj, separator) {
    throw new Error('@TODO')
}
/**
 * Given POO and a mapping, creates new POO with keys remapped.
 * If exclusive is true, the new POO will not include the keys
 * not in map,
 *
 * WARNING: Not recursive
 *  - map should only be one level deep
 *  - the new returned object will share data if values are not primitive.
 *
 * @param obj {object}
 * @param map {object}          one level deep mapping of keys
 * @param exclusive {boolean}   defaults to false
 */
function remap(obj, map, exclusive) {
    if( exclusive===undefined ) exclusive = false;

    return reduce(obj, function(newObj, v, k){
        if( map[k]===undefined ) {
            if( !exclusive ) newObj[k]=v;
        } else {
            newObj[map[k]]=v;
        }
        return newObj;
    });
}

/**
 * Given POO and a mapping of keys to transformer functions or values,
 * creates new POO with values transformed.
 *
 * WARNING: Not recursive
 *  - transformers map should only be one level deep
 *  - if value is not a primitive the original obj will be modified.
 *
 * @param obj
 * @param transformers
 * @returns {*}
 */
function transform(obj, transformers) {
    return reduce(obj, function(newObj, v, k) {
        if( transformers[k]===undefined ) {
            newObj[k] = v;
        } else {
            if ( typeof transformers[k]==="function" ) {
                newObj[k] = transformers[k](v);
            } else {
                newObj[k] = transformers[k];
            }
        }
        return newObj;
    });
}

/**
 * Given a source object and a list of keys, return a new object with only those keys.
 *
 * @param src
 * @param keys
 * @param includeUndefined      optional defaults to false, whether returned object
 *                              should contain keys that do not exist in src.
 * @returns {object}
 */
function pluck(src, keys, includeUndefined) {
    if( typeof includeUndefined!=='boolean' ) includeUndefined=false;
    return keys
        .reduce(function(target, key) {
            if( includeUndefined || src[key]!==undefined ) {
                target[key] = src[key];
            }
            return target;
        }, {});
}

function combine(/* data, fn | array, ... */) {
    var args = cloneArray(arguments);
    var data = args.shift();
    var i;

    for( i=0; i<args.length; i++ ) {
        if( typeof args[i]==='function' ) {
            data = args[i].call(this, data);
        } else if ( args[i] instanceof Array ) {
            var args2 = args[i];
            var fn = args2.shift();
            args2.unshift(data);
            data = fn.apply(this, args2)
        }
    }
    return data;
}


module.exports = {
      first:        first
    , rest:         rest
    , shift:        shift
    , reduce:       reduce
    , flatten:      flatten
    , remap:        remap
    , pluck:        pluck
    , transform:    transform
    , combine:      combine
};

},{"./arrays":1}],3:[function(require,module,exports){
/**
 * Created by Jonathan Willis on 01/09/15.
 */

var __slice = require('./arrays.js').clone;

function partial(/* fn,  arg* */) {
    var leftArgs = __slice(arguments);
    var fn = leftArgs.shift();
    return function() {
        var rightArgs = __slice(arguments);
        return fn.apply(this, leftArgs.concat(rightArgs));
    };
}
function partialRight(/* fn,  arg* */) {
    var rightArgs = __slice(arguments);
    var fn = rightArgs.shift();
    return function() {
        var leftArgs = __slice(arguments);
        return fn.apply(this, leftArgs.concat(rightArgs));
    };
}



module.exports = {
      partial:      partial
    , partialRight: partialRight
};
},{"./arrays.js":1}],4:[function(require,module,exports){
/**
 * Created by Jonathan Willis on 02/09/15.
 */


jaw = {
      functions: require('./functions')
    , arrays: require('./arrays')
    , random: require('./random')
    , data: require('./data')
    , promises: require('./promises')
};
},{"./arrays":1,"./data":2,"./functions":3,"./promises":5,"./random":6}],5:[function(require,module,exports){
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

module.exports = {
      promiseTester:        promiseTester
    , createFakeApiCall:    createFakeApiCall
    , promiseDecorator:     promiseDecorator
    , bind:                 bind
    , manipulators:         manipulators
    , reduce:               reduce
};
},{"./arrays.js":1,"./data.js":2,"./functions.js":3,"./random.js":6}],6:[function(require,module,exports){
/**
 * Created by Jonathan Willis on 03/09/15.
 */


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

function randomLetter(from, to) {
    return String.fromCharCode(randomInteger(from.charCodeAt(0), to.charCodeAt(0)));
}

module.exports = {
      integer:  randomInteger
    , timeout:  randomTimeout
    , letter:   randomLetter
};
},{}]},{},[4]);
