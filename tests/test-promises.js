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
    , functions:    require('../src/functions.js')
};
var promiseTester = jaw.promises.promiseTester;
var mockApiCall = jaw.promises.mockApiCall;
var manipulators = jaw.promises.manipulators;
var partialRight = jaw.functions.partialRight;

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

        it('can create a successful fake api call', function(done) {
            var expected = { abc:123, doremi:'abc', 123:'babyyouandme' };
            var apiCall = mockApiCall(expected, { max:100 });

            assertThat(done)(apiCall())
                .deepEqual(expected);
        });

        it('can create an unsuccessful fake api call', function(done) {
            this.timeout(200);
            var desired = { abc:123, doremi:'abc', 123:'babyyouandme' };
            var apiCall = mockApiCall(desired, { max:100, successful: false });

            apiCall().catch(function(err) {
                try {
                    assert.instanceOf(err, Error);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('can attach an identity to a successfull result', function(done) {
            this.timeout(300);
            var expected = { abc:123, doremi:'abc', 123:'babyyouandme' };
            var apiCall = mockApiCall(expected, { id:'get_data', max:100 });


            assertThat(done)(apiCall())
                .deepEqual({
                    id:         'get_data',
                    payload:    expected
                });

        });

        it('can attach an identity to a failed result', function(done) {
            this.timeout(300);
            var expected = { abc:123, doremi:'abc', 123:'babyyouandme' };
            var apiCall = mockApiCall(expected, { id:'get_data', max:100, successful: false });


            apiCall().catch(function(err) {
                try {
                    assert.strictEqual(err.id, 'get_data');
                    assert.instanceOf(err.payload, Error);
                    done();
                } catch(e) {
                    done(e);
                }
            });

        });

    });

    describe('Wrapping functions that return promises', function() {

        it('can transform the result', function (done) {
            var data = {abc: 123, doremi: 'abc', 123: 'babyyouandme'};
            var apiCall = mockApiCall(data, { max:100 });

            var transformers = {
                abc: function (v) {
                    return v + 100;
                }
                , doremi: function (v) {
                    return v + 'd';
                }
                , 123: function (V) {
                    return 'meandyou';
                }
            };
            apiCall = manipulators.transform(apiCall, transformers);
            var expected = {abc: 223, doremi: 'abcd', 123: 'meandyou'};

            assertThat(done)(apiCall())
                .deepEqual(expected);
        });

        it('can remap data', function (done) {

            var data = {a: 123, b: 'abc', c: 'babyyouandme'};
            var apiCall = mockApiCall(data, { max:100 });

            var map = {
                a: 'aaa'
                , b: 'bbb'
                , c: 'ccc'
            };


            apiCall = manipulators.remap(apiCall, map);
            var expected = {aaa: 123, bbb: 'abc', ccc: 'babyyouandme'};

            assertThat(done)(apiCall())
                .deepEqual(expected);

        });

        it('can get first pair in returned data', function (done) {

            var data = {a: 123, b: 'abc', c: 'babyyouandme'};
            var apiCall = mockApiCall(data, { max:100 });

            apiCall = manipulators.first(apiCall);
            var expected = {a: 123};

            assertThat(done)(apiCall())
                .deepEqual(expected);

        });

        it('can flatten returned data (flat)', function (done) {

            var data = {a: 123, b: 'abc', c: 'babyyouandme'};
            var apiCall = mockApiCall(data, { max:100 });

            apiCall = manipulators.flatten(apiCall);

            assertThat(done)(apiCall())
                .deepEqual(data);

        });

        it('can flatten returned data (deep)', function (done) {

            var data = {a: {b: 'abc', c: 123, d: {e: {f: null}}}, aa: 'xyz'};
            var apiCall = mockApiCall(data, { max:100 });

            apiCall = manipulators.flatten(apiCall, '_');

            var expected = {'a_b': 'abc', 'a_c': 123, 'a_d_e_f': null, aa: 'xyz'};
            assertThat(done)(apiCall())
                .deepEqual(expected);

        });

        it('can use any combination of data manipulators', function (done) {

            function double(x) {
                return x * 2;
            }

            var data = {a: {a1: 1, a2: 2}, b: 2, c: 4};
            var apiCall = mockApiCall(data, { max:100 });


            apiCall = manipulators.combine(apiCall, [jaw.data.flatten, '_'], [jaw.data.transform, {
                'a_a2': double,
                bogus: double
            }], [jaw.data.remap, {a_a2: 'aaa'}], jaw.data.rest, jaw.data.first);
            var expected = {aaa: 4};

            assertThat(done)(apiCall())
                .deepEqual(expected);

        });
    });


    describe('reduce', function() {
        it('can reduce any number of promise producing functions into one value', function(done) {

            var c1 = mockApiCall({ a:1 }, { max:100 });
            var c2 = mockApiCall({ a:10 }, { max:100 });
            var c3 = mockApiCall({ a:100 }, { max:100 });

            assertThat(done)(jaw.promises.reduce([c1, c2, c3], function(acc, data){
                acc.a = acc.a + data.a;
                return acc;
            }, { a:0 }))
                .deepEqual({ a:111 });

        });


        it('can reduce any number of promise producing functions into one value without accumulator', function(done) {

            var c1 = mockApiCall({ a:1 }, { max:100 });
            var c2 = mockApiCall({ a:10 }, { max:100 });
            var c3 = mockApiCall({ a:100 }, { max:100 });

            assertThat(done)(jaw.promises.reduce([c1, c2, c3], function(acc, data) {
                acc.a = acc.a + data.a;
                return acc;
            })).deepEqual({ a:111 });

        });


        it('can reduce any number of promise producing functions into one value and can be partialed', function(done) {

            var c1 = mockApiCall({ a:1 }, { max:100 });
            var c2 = mockApiCall({ a:10 }, { max:100 });
            var c3 = mockApiCall({ a:100 }, { max:100 });

            var apiCall = partialRight(jaw.promises.reduce, function(acc, data) {
                acc.a = acc.a + data.a;
                return acc;
            });

            assertThat(done)(apiCall([c1, c2, c3])).deepEqual({ a:111 });

        });
    });

    describe('timeout can turn a promise producing function into one with a timeout', function() {

        it('rejects with an Error object on timeout', function(done) {
            var apiCall = mockApiCall({ a:100 }, { exact:100 });

            var apiCallWithTimeout = jaw.promises.timeout(apiCall, 50);

            apiCallWithTimeout()
                .catch(function(expectTimeoutError) {
                    try {
                        assert.instanceOf(expectTimeoutError, Error);
                        done();
                    } catch(e) {
                        done(e);                    }

                });
        });


        it('does not affect the call if within timeout', function(done) {
            var expected = { a:100 };
            var apiCall = mockApiCall(expected, { exact:100 });

            var apiCallWithTimeout = jaw.promises.timeout(apiCall, 200);

            assertThat(done)(apiCallWithTimeout()).deepEqual(expected);
        });
    });

    describe('memoized promises', function() {

        it('only executes the call once when successfull', function(done) {
            var expected = { a:100, b:'c' };
            var callCount = 0;
            var spy = function(d) { callCount++; return d; };
            var apiCall = mockApiCall(expected, { max:100, processResult: spy });
            var cachedCall = jaw.promises.memoize(apiCall);
            cachedCall('abc');
            cachedCall('abc');

            function assertDone(result) {
                try {
                    assert.deepEqual(expected, result);
                    assert.strictEqual(1, callCount);
                    done();
                } catch(e) {
                    done(e);
                }
            }
            cachedCall('abc').then(assertDone);

        });

        it('does not cache call results when unsuccessfull', function(done) {
            var expected = { a:100, b:'c' };
            var callCount = 0;
            var spy = function(d) { callCount++; return d; };
            var apiCall = mockApiCall(expected, { successful: false, max:100, processResult: spy });
            var cachedCall = jaw.promises.memoize(apiCall);
            cachedCall('abc');
            cachedCall('abc');

            function assertDone(result) {
                try {
                    assert.instanceOf(result, Error);
                    assert.strictEqual(3, callCount);
                    done();
                } catch(e) {
                    done(e);
                }
            }
            cachedCall('abc').catch(assertDone);
        });


        it('can cache the call even if there are no arguments', function(done) {

            var expected = { a:100, b:'c' };
            var callCount = 0;
            var spy = function(d) { callCount++; return d; };
            var apiCall = mockApiCall(expected, { max:100, processResult: spy });
            var cachedCall = jaw.promises.memoize(apiCall);
            cachedCall();
            cachedCall();

            function assertDone(result) {
                try {
                    assert.deepEqual(expected, result);
                    assert.strictEqual(1, callCount);
                    done();
                } catch(e) {
                    done(e);
                }
            }
            cachedCall().then(assertDone);

        });


        it('different sets of arguments require different calls', function(done) {

            this.timeout(100);
            var expected = { a:100, b:'c' };
            var callCount = 0;
            var spy = function(d) {
                callCount++; return d;
            };
            var apiCall = mockApiCall(expected, { exact:50, processResult: spy });
            var cachedCall = jaw.promises.memoize(apiCall);
            cachedCall('a');
            cachedCall('a', ['b']);

            function assertDone(result) {
                try {
                    assert.deepEqual(expected, result);
                    assert.strictEqual(3, callCount);
                    done();
                } catch(e) {
                    done(e);
                }
            }
            cachedCall(123).then(assertDone);

        });

    });


});