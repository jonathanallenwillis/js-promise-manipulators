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