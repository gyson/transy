'use strict';

var assert = require('assert')
var thunk = require('gocsp-thunk')
var methods = require('./methods')

var compose = methods.compose
var slice = Array.prototype.slice

// export all methods
Object.keys(methods).forEach(function (name) {
    exports[name] = methods[name]
})
exports.methods = methods

// src is array-like or iterator
function sync(src /* xform... */) {
    var xform = compose(slice.call(arguments, 1))
    var result = void 0
    var isDone = false
    var isError = false

    var produce = xform(function (done, value) {
        if (done) {
            isDone = true
            result = value
        }
        return done
    })

    // src is array-like (array, arguments)
    var len = src.length
    if (len === +len) {
        for (var i = 0; i < len; i++) {
            if (produce(false, src[i])) {
                assert(isDone)
                return result // early terimination
            }
        }
        produce(true, void 0)
        assert(isDone)
        return result
    }

    // iterator, has .next property
    if (src && typeof src.next === 'function') {
        var result
        while (result = src.next(), !result.done) {
            if (produce(false, result.value)) {
                assert(isDone)
                return result // early termination
            }
        }
        produce(true, result.value)
        assert(isDone)
        return result
    }

    throw new TypeError('from transy.sync: '
                + src + ' is not array or iterator')
}
exports.sync = sync

// src is channel, stream
function async(src /* xform... */) {
    var args = arguments
    return thunk(function (cb) {
        var xform = compose(slice.call(args, 1))
        var result = void 0
        var isDone = false
        var isError = false

        var produce = xform(function (done, value) {
            if (done) {
                cb(null, value)
            }
            return done
        })

        // readable stream
        if (src && src.readable && typeof src.on === 'function') {
            src.on('data', function (data) {
                // if (!isDone) {
                    try {
                        produce(false, data)
                    } catch (e) {
                        isDone = true
                        isError = true
                        result = e
                    }
                // }
            })

            src.on('error', function (err) {
                // throw error
                // cleanup
                done(err)
            })

            src.on('end', function () {
                try {
                    produce(true, void 0)
                } catch (e) {
                    // to error state
                }
            })
            // clean up
            return
        }

        // if it's channel / async iterator protocol
        if (src && typeof src.nextAsync === 'function') {
            src.nextAsync()(function next(err, val) {
                if (err) {
                    done(err)
                    return
                }
                try {
                    if (produce(false, val)) {
                        // finish, should close / throw channel ?
                        done(null, result)
                    } else {
                        // continue, for promise, callback
                        src.nextAsync()(next)
                    }
                } catch (e) {
                    done(e)
                }
            })
        }

        throw new TypeError('from transy.async: '
                    + src + ' is not readable stream or channel')
    })
}
exports.async = async

// new Socket(T.pipey(
//     T.map(...),
//     T.doSomething(...),
//     T.doSomething()
// ))
function pipey(/* xform... */) {
    var args = arguments
    return function (input, output, cb) {
        var xform = compose(args)

        var last = null

        var produce = xform(function (done, value) {
            if (done) {
                output.close(value)
            } else {
                last = output.put(value)
            }
        })

        input.take()(function take(err, res) {
            if (err) {
                cb(err)
                return
            }
            try {
                last = null
                if (produce(res.done, res.value)) {
                    // early terimination
                    // assert(finish)
                    return
                }
                if (last === null) {
                    // zero ...
                    input.take()(take)
                } else {
                    last(function (err, ok) {
                        if (err) {
                            cb(err)
                        } else {
                            input.take()(take)
                        }
                    })
                }
            } catch (e) {
                cb(e)
            }
        })
    }
}
exports.pipey = pipey
