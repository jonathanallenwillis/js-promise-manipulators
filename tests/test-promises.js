/**
 * Created by Jonathan Willis on 28/08/15.
 */

if( typeof Promise==="undefined" ) {
    Promise = require('es6-promise-polyfill').Promise
}

//var assert = require("assert");
var chai = require('chai');
var assert = chai.assert;
var AssertionError = chai.AssertionError;


var jaw = {
      promises:     require('../src/promises.js')
    , data:         require('../src/data.js')
};
var promiseTester = jaw.promises.promiseTester;
var createFakeApiCall = jaw.promises.createFakeApiCall;
var manipulators = jaw.promises.manipulators;

describe('Promises', function() {
    function isEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    }

    describe('promiseTester', function() {

        it('can mimick an assert library API', function() {
            var api =  promiseTester(assert)(function(){})(Promise.resolve(null));
            var prop;
            var setOfFns = {};
            for( prop in assert ) {
                if( typeof assert[prop]==='function' ) {
                    setOfFns[prop]=true;
                }
            }
            for( prop in api ) {
                assert.strictEqual(typeof api[prop], "function");
                delete setOfFns[prop];
            }
            assert.strictEqual(isEmptyObject(setOfFns), true);
        });

        it('calls done on success', function(done) {
            this.timeout(100);
            var assertThat = promiseTester(assert);
            assertThat(function(assertNoError){
                done(assertNoError);
            })(Promise.resolve(true)).ok()
        });

        it('calls done on failure', function(done) {
            this.timeout(100);
            var assertThat =  promiseTester(assert);
            var expected = "ERROR";
            assertThat(function(actual){
                try {
                    assert.strictEqual(expected, actual);
                    done();
                } catch(e) {
                    done(e);
                }
            })(Promise.reject(expected)).ok();
        });

        describe('proxies assertion library calls', function() {

            it('fails on mismatched response', function(done) {
                var assertThat =  promiseTester(assert);
                var expected = 'abc123';

                assertThat(function(err) {
                    try {
                        assert.ok(err instanceof AssertionError, 'Did not throw an AssertionError');
                        done();
                    } catch(e) {
                        done(e);
                    }
                })(Promise.resolve(expected))
                    .strictEqual(expected + 'extra');

            });

            it('succeeds on matched response', function(done) {

                var assertThat =  promiseTester(assert);
                assertThat(function(noError) {
                    try {
                        assert.strictEqual(noError, undefined, 'Did not throw an AssertionError');
                        done();
                    } catch(e) {
                        done(e);
                    }
                })(Promise.resolve(true)).ok();

            });

        });

    });

    var assertThat =  promiseTester(assert);

    describe('Faking API calls', function() {

        it('can create a fake api call', function(done) {
            var expected = { abc:123, doremi:'abc', 123:'babyyouandme' };
            var apiCall = createFakeApiCall(expected, undefined, 400);

            assertThat(done)(apiCall())
                .deepEqual(expected);
        });

    });

    describe('Wrapping functions that return promises', function() {

        it('can transform the result', function(done) {
            var data = { abc:123, doremi:'abc', 123:'babyyouandme' };
            var apiCall = createFakeApiCall(data, undefined, 400);

            var transformers = {
                  abc:    function(v) { return v+100; }
                , doremi: function(v) { return v+'d'; }
                , 123:    function(V) { return 'meandyou'; }
            };
            apiCall = manipulators.transform(apiCall, transformers);
            var expected = { abc:223, doremi:'abcd', 123:'meandyou' };

            assertThat(done)(apiCall())
                .deepEqual(expected);
        });

        it('can remap data', function(done) {

            var data = { a:123, b:'abc', c:'babyyouandme' };
            var apiCall = createFakeApiCall(data, undefined, 400);

            var map = {
                a:    'aaa'
                , b:    'bbb'
                , c:    'ccc'
            };



            apiCall = manipulators.remap(apiCall, map);
            var expected = { aaa:123, bbb:'abc', ccc:'babyyouandme' };

            assertThat(done)(apiCall())
                .deepEqual(expected);

        });

        it('can get first pair in returned data', function(done) {

            var data = { a:123, b:'abc', c:'babyyouandme' };
            var apiCall = createFakeApiCall(data, undefined, 400);

            apiCall = manipulators.first(apiCall);
            var expected = { a:123 };

            assertThat(done)(apiCall())
                .deepEqual(expected);

        });

        it('can flatten returned data (flat)', function(done) {

            var data = { a:123, b:'abc', c:'babyyouandme' };
            var apiCall = createFakeApiCall(data, undefined, 400);

            apiCall = manipulators.flatten(apiCall);

            assertThat(done)(apiCall())
                .deepEqual(data);

        });

        it('can flatten returned data (deep)', function(done) {

            var data = { a: { b:'abc', c:123, d: { e: { f: null } } }, aa: 'xyz' };
            var apiCall = createFakeApiCall(data, undefined, 400);

            apiCall = manipulators.flatten(apiCall, '_');

            var expected = { 'a_b': 'abc', 'a_c': 123, 'a_d_e_f': null, aa: 'xyz' };
            assertThat(done)(apiCall())
                .deepEqual(expected);

        });

        it('can use any combination of data manipulators', function(done) {

            function double(x) { return x*2; }
            var data = { a: { a1:1, a2:2 }, b:2, c:4 };
            var apiCall = createFakeApiCall(data, undefined, 400);


            apiCall = manipulators.combine(apiCall,  [ jaw.data.flatten, '_' ], [ jaw.data.transform, { 'a_a2': double, bogus: double } ], [ jaw.data.remap, { a_a2: 'aaa' } ], jaw.data.rest, jaw.data.first);
            var expected = { aaa:4 };

            assertThat(done)(apiCall())
                .deepEqual(expected);

        });
    });

});