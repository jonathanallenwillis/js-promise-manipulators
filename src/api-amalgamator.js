/**
 * Created by Jonathan Willis on 20/08/15.
 */

// UMD
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.jaw = factory();
    }
}(this, function () {
    var __hop = Object.prototype.hasOwnProperty;

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
        return [];
    }

    function rest(obj) {
        throw new Error('@TODO');
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
            apiCall().done(function(response) {
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

    return {
        first: first,
        shift: shift,
        reduce: reduce,
        flatten: flatten,
        remap: remap,
        transform: transform,
        amalgamator: amalgamator
    };
}));
