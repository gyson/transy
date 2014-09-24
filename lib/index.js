
'use strict';

var util = require('util')
var assert = require('assert')
var through2 = require('through2')
var defaults = require('./defaults')

// add defaults functions
Object.keys(defaults).forEach(function (name) {
    exports[name] = defaults[name]
})

exports._defaults = defaults

function array(xform, src) {

    var list = []

    var produce = xform(function (data, done) {
        if (!done) {
            list.push(data)
        }
        return done
    })

    // src is array-like (array, arguments)
    var len = src.length
    if (len === +len) {
        for (var i = 0; i < len; i++) {
            if (produce(src[i])) {
                return list
            }
        }
        produce(null, true)
        return list
    }

    // iterator, has .next property
    if (typeof src.next === 'function') {
        var result;
        while (result = src.next(), !result.done) {
            if (produce(result.value)) {
                return list
            }
        }
        produce(null, true)
        return list
    }

    throw new TypeError('invalid src')
}
exports.array = array

// to transform stream
// TODO: error forwarding ?
function stream(xform, opt) {

    var done = false

    var produce = xform(function (data, done) {
        if (done) return;

        if (data === null) {
            done = true
        } else {
            stream.push(data)
        }
    })

    var stream = through2.obj(opt, onData, onFlush)

    function onData(data, enc, cb) {
        produce(data)
        cb()
    }

    function onFlush(data, enc, cb) {
        produce(null, true)
        cb()
    }

    return stream
}
exports.stream = stream


/*
test(map(function (num) {
    return num + 1;
}))
([], [])
([0, 1, 2, 3], [1, 2, 3, 4])
([1, 2, 3, 4], [2, 3, 4, 5])
*/
function test(xform) {
    return function check(src, expected) {

        // test correctness
        var result = array(xform, src)

        assert(result.length === expected.length)

        for (var i = 0; i < expected.length; i++) {
            assert(expected[i] === result[i])
        }

        // test early termination
        // var produce = xform(function (data, done) {
        //     return true
        // })
        // if (src.length > 0) {
        //     assert(produce(src[0]))
        // } else {
        //     assert(produce(null, true))
        // }

        // test early termination
        // based on expected length ?

        return check
    }
}
exports.test = test
