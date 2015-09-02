/**
 * Created by Jonathan Willis on 28/08/15.
 */


var assert = require("assert");
var jaw = require('../src/data.js');


describe('Data object manipulation', function() {
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


        it('can get the "rest" of the key value pairs in an object except for the "first"', function () {
            var o = {a:1};
            assert.deepEqual({}, jaw.rest(o));
            assert.deepEqual({ a:1 }, o);

            var o = {
                aa:2,
                b:2,
                c:3
            };
            assert.deepEqual({ b: 2, c:3 }, jaw.rest(o));
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

        it('can pluck a new object from an old', function() {
            var src = { a:1, b:2, c:'3', d:'4' };

            var actual = jaw.pluck(src, ['a', 'c', 'z']);
            assert.deepEqual({a:1, c:'3'}, actual, 'target object contains only defined keys');
            actual.a=321;
            assert.deepEqual({ a:1, b:2, c:'3', d:'4' }, src, "source object remains untouched");

            var actual = jaw.pluck(src, ['a', 'c', 'z'], true);
            assert.deepEqual({a:1, c:'3', z:undefined }, actual, 'but target can include undefined keys too');
        });

        it('can combine manipulators', function() {
            function double(x) { return x*2; }
            var o = { a: { a1:1, a2:2 }, b:2, c:4 };

            var actual = jaw.combine(o, [ jaw.flatten, '_' ] );
            assert.deepEqual({ a_a1:1, a_a2:2, b:2, c: 4 }, actual);

            var actual = jaw.combine(o, jaw.first );
            assert.deepEqual({ a: { a1:1, a2:2 } }, actual);

            var actual = jaw.combine(o, [ jaw.flatten, '_' ], [ jaw.transform, { 'a_a2': double, bogus: double } ], [ jaw.remap, { a_a2: 'aaa' } ], jaw.rest, jaw.first ); //now where did I put that kitchen sink...
            assert.deepEqual({ aaa:4 }, actual);

        });

    })
});