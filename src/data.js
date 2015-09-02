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
    return [];
}

function rest(obj) {
    var keys = Object.keys(obj);
    keys.shift();

    //return keys.reduce(function(rest, key) {
    //    rest[key] = obj[key];
    //    return rest;
    //}, {});
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
