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