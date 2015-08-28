/**
 * Created by Jonathan Willis on 21/08/15.
 */


var assert = require("assert");
var jaw = require('../src/api-amalgamator.js');

describe('Api Amalgamator', function() {
    describe('Amalgamator', function() {

        function randomInteger(minOrMax, maybeMax) {
            var min, max;
            if( maybeMax===undefined ) {
                min=0; max=minOrMax;
            } else {
                min=minOrMax; max=maybeMax+1;
            }
            return Math.floor(Math.random()*(max-min))+min;
        }
        function randomTimeout(fn) {
            setTimeout(fn, randomInteger(300, 1100));
        }

        function createFakeApiCall(data, id) {
            var promise = {
                _listeners: [],
                notify: function(data) {
                    var i;
                    for(i=0; i<this._listeners.length; i++) {
                        this._listeners[i](data);
                    }
                },
                done: function(fn) {
                    this._listeners.push(fn);
                }
            };

            return function() {

                randomTimeout(function() {
                    if( id===undefined ) promise.notify(data);
                    else promise.notify({
                            id: id,
                            payload: data
                        });
                });

                return promise;
            };
        }


        it('can notify when api calls return', function(done) {
            this.timeout(4000);
            //createFakeApiCall({})().done(function() { done(); });
            //return;
            var d1 = { a:1, b:2, c:3 };
            var d2 = { a:2, b:3, c:1 };
            var d3 = { a:3, b:1, c:2 };
            var expected = { 1: d1, 2: d2, 3: d3 }
            var callsDone = 0;
            jaw
                .amalgamator([ createFakeApiCall(d1, 1), createFakeApiCall(d2, 2), createFakeApiCall(d3, 3) ])
                .update(function(data) {
                    assert.deepEqual(expected[data.id], data.payload);
                    callsDone++;
                    if( callsDone===3 ) done();
                });
        });




        it('can combine api calls', function(done) {
            this.timeout(4000);
            //createFakeApiCall({})().done(function() { done(); });
            //return;
            var d1 = { a:1, b:2, c:3 };
            var d2 = { a:2, b:3, c:1 };
            var d3 = { a:3, b:1, c:2 };
            function combiner(acc, data) {
                for(var k in acc) {
                    acc[k] = acc[k] + data[k];
                }
                return acc;
            }
            var expected = { a:6, b:6, c:6 };
            var callsDone = 0;
            jaw
                .amalgamator([ createFakeApiCall(d1), createFakeApiCall(d2), createFakeApiCall(d3) ], combiner)
                .update(function(data) {
                    callsDone++;
                    if( callsDone===3 ) {
                        assert.deepEqual(expected, data);
                        done();
                    }
                });
        });

    });
});