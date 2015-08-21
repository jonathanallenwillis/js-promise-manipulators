/**
 * Created by Jonathan Willis on 21/08/15.
 */


var assert = require("assert");
var jaw = require('../src/api-amalgamator.js');
describe('Api Amalgamator', function() {
    describe('Basic functions', function() {


        it('can get the "first" key value pair in an object', function () {
            var o = {a:1};
            assert.deepEqual({ a:1 }, jaw.first(o));
            assert.deepEqual({ a:1 }, o);

            var o = {
                aa:2,
                b:2,
                c:3
            };
            assert.deepEqual({ aa: 2 }, jaw.first(o));
            assert.deepEqual({ aa:2, b:2, c:3 }, o, "original is untouched");
        });



        it('can shift off the "first" key value pair in an object', function () {
            var o = {a:1};
            assert.deepEqual({ a:1 }, jaw.shift(o));
            assert.deepEqual({}, o);

            var o = {
                aa:2,
                b:2,
                c:3
            };
            assert.deepEqual({ aa: 2 }, jaw.shift(o));
            assert.deepEqual({ b:2, c:3 }, o);
        });



        it('can reduce an object with an accumulator', function() {
            var o = { a:1, b:2 };
            var actual = jaw.reduce(o, function(c, v, k) {
                c[k+k] = v+v;
                return c;
            }, {});
            assert.deepEqual({ aa:2, bb:4 }, actual);
            assert.deepEqual({ a:1, b:2 }, o, "original is untouched");

            var o = { a:1, b:2 };
            var actual = jaw.reduce(o, function(c, v, k) {
                c.push(k);
                return c;
            }, []);
            // order matters
            assert.deepEqual(['a', 'b'], actual);

            var o = { a:1, b:2 };
            var actual = jaw.reduce(o, function(c, v, k) {
                c.push(v);
                return c;
            }, []);
            // order matters
            assert.deepEqual([1, 2], actual);
        });



        it('can reduce an object without an accumulator to return a new object', function() {
            var o = { a:1, b:2 };
            var actual = jaw.reduce(o, function(c, v, k) {
                c[k+k] = v+v;
                return c;
            });
            assert.deepEqual({ aa:2, bb:4 }, actual);
            assert.deepEqual({ a:1, b:2 }, o, "original is untouched");
        });



        it('can flatten an object of arbitrary depth into one level deep object', function() {
            var o = { a:1, b:2 };
            var actual = jaw.flatten(o, '/');
            assert.deepEqual({ a:1, b:2 }, actual, "flatten one level object returns similar object");
            assert.deepEqual({ a:1, b:2 }, o, "original is untouched");
            o.bb = 3;
            assert.deepEqual({ a:1, b:2 }, actual, "a new object was created");


            var o = { a:{ aa: 1 }, b:2, c:{ cc:{ ccc:1, ccc2:2 }, cc2:3 } };
            var actual = jaw.flatten(o);
            var expected = JSON.parse('{"a/aa":1,"b":2,"c/cc/ccc":1,"c/cc/ccc2":2,"c/cc2":3}');
            assert.deepEqual(expected, actual, "defaults to / for separator");

            var o = { a:{ aa: 1 }, b:2, c:{ cc:{ ccc:1, ccc2:2 }, cc2:3 } };
            var actual = jaw.flatten(o, '_');
            assert.deepEqual({ a_aa:1, b:2, c_cc_ccc:1, c_cc_ccc2:2, c_cc2:3 }, actual, "flatten can use arbitrary separator");
        });



        it('can remap an objects keys', function() {
            var o = { a:1, b:2, c:3 };
            assert.deepEqual({ aaa:1, bbb:2, ccc:3 }, jaw.remap(o, {'a':'aaa', 'b':'bbb', 'c':'ccc'}));
            assert.deepEqual({ a:1, b:2, c:3 }, o, "orignial is untouched");

            var o = { a:1, b:2 };
            assert.deepEqual({ b:1, a:2 }, jaw.remap(o, {'a':'b', 'b':'a'}), "can be used for a switch");
            assert.deepEqual({ a:1, b:2 }, o, "orignial is untouched");
        });



        it('can transform an objects values', function() {
            function double(x) { return x*2; }
            var o = { a:1, b:2, c:4 };
            assert.deepEqual({ a:null, b:4, c:2 }, jaw.transform(o, {'a':null, 'b':double, 'c':Math.sqrt}));
            assert.deepEqual({ a:1, b:2, c:4 }, o, "orignial is untouched");
        });
    });


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