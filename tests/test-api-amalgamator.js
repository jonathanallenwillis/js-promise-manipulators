/**
 * Created by Jonathan Willis on 21/08/15.
 */


var assert = require("assert");

var amalgamator = require('../src/api-amalgamator.js').amalgamator;
var createFakeApiCall = require('../src/promises.js').createFakeApiCall;

describe('Api Amalgamator', function() {
    describe('Amalgamator', function() {

        it('can notify when api calls return', function(done) {
            this.timeout(4000);
            //createFakeApiCall({})().done(function() { done(); });
            //return;
            var d1 = { a:1, b:2, c:3 };
            var d2 = { a:2, b:3, c:1 };
            var d3 = { a:3, b:1, c:2 };
            var expected = { 1: d1, 2: d2, 3: d3 }
            var callsDone = 0;

            amalgamator([ createFakeApiCall(d1, 1), createFakeApiCall(d2, 2), createFakeApiCall(d3, 3) ])
                .update(function(data) {
                    try {
                        assert.deepEqual(expected[data.id], data.payload);
                        callsDone++;
                        if (callsDone === 3) done();
                    } catch(err) {
                        done(err);
                    }
                });
        });


        //
        //
        //it('can combine api calls', function(done) {
        //    this.timeout(4000);
        //    //createFakeApiCall({})().done(function() { done(); });
        //    //return;
        //    var d1 = { a:1, b:2, c:3 };
        //    var d2 = { a:2, b:3, c:1 };
        //    var d3 = { a:3, b:1, c:2 };
        //    function combiner(acc, data) {
        //        for(var k in acc) {
        //            acc[k] = acc[k] + data[k];
        //        }
        //        return acc;
        //    }
        //    var expected = { a:6, b:6, c:6 };
        //    var callsDone = 0;
        //
        //    amalgamator([ createFakeApiCall(d1), createFakeApiCall(d2), createFakeApiCall(d3) ], combiner)
        //        .update(function(data) {
        //            callsDone++;
        //            if( callsDone===3 ) {
        //                assert.deepEqual(expected, data);
        //                done();
        //            }
        //        });
        //});

    });
});