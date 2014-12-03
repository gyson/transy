'use strict';

var thunk = require('gocsp-thunk')
var methods = require('./methods')

var compose = methods.compose
var slice = Array.prototype.slice

function noop() {}

function pass()  {
    return true
}

function check(isDone) {
    if (!isDone) {
        throw new Error('')
    }
}

// export all methods
Object.keys(methods).forEach(function (name) {
    exports[name] = methods[name]
})
exports.methods = methods

// src is array-like or iterator
function sync(xform, src) {
    var result, isDone = false

    // var [next, close]
    var pair = xform(pass, function onFlush(value) {
        isDone = true
        result = value
    })
    var next = pair[0], close = pair[1]

    // src is array-like (array, arguments)
    var len = src.length
    if (len === +len) {
        for (var i = 0; i < len; i++) {
            if (next(src[i]) === false) {
                check(isDone)
                return result // early terimination
            }
        }
        close(void 0)
        check(isDone)
        return result
    }

    // iterator, has .next property
    if (typeof src.next === 'function') {
        var ret
        while (ret = src.next(), !ret.done) {
            if (next(ret.value) === false) {
                check(isDone)
                return result // early termination
            }
        }
        close(ret.value)
        check(isDone)
        return result
    }

    throw new TypeError('from transy.sync: '
                + src + ' is not array or iterator')
}
exports.sync = sync

// src is channel, stream
function async(xform, src) {
    return thunk(function (done) {
        var isDone = false
        var isError = false

        var pair = xform(pass, function onFlush(value) {
            if (isDone || isError) { return }
            isDone = true
            done(null, value)
        })
        var next = pair[0], close = pair[1]

        // readable stream
        if (src.readable && typeof src.on === 'function') {
            src.on('data', function onData(data) {
                if (isDone || isError) { return }
                try {
                    if (next(data) === false) {
                        check(isDone)
                    }
                } catch (e) {
                    isError = true
                    done(e)
                }
            })
            src.on('error', function onError(err) {
                if (isDone || isError) { return }
                isError = true
                done(err)
            })
            src.on('end', function onEnd() {
                if (isDone || isError) { return }
                try {
                    close(void 0)
                } catch (e) {
                    isError = true
                    done(e)
                }
            })
            return
        }

        // if it's channel / async iterator protocol
        if (src && typeof src.nextAsync === 'function') {
            // is nextAsync return a thunk
            // also support nextAsync return a promise ???
            src.nextAsync()(function next(err, val) {
                if (isError || isDone) { return }
                if (err) {
                    isError = true
                    done(err)
                    return
                }
                try {
                    if (val.done) {
                        close(val.value)
                        check(isDone)
                        return
                    }
                    if (next(val.value) === false) {
                        check(isDone) // early termination
                        if (typeof src.cancel === 'function') {
                            src.cancel()
                        }
                    } else {
                        src.nextAsync()(next)
                    }
                } catch (e) {
                    isError = true
                    if (typeof src.cancel === 'function') {
                        src.cancel()
                    }
                    done(e)
                }
            })
        }

        throw new TypeError('from transy.async: '
                    + src + ' is not readable stream or channel')
    })
}
exports.async = async

// T.pipey(T.compose(
//     T.map(),
//     T.map(),
//     T.filter()
// ))
// function pipey(xform, opts) {
//     return function (input, output, cb) {
//         var last = null
//
//         var pair = xform(function (value) {
//             last = output.put(value)
//         }, function onFlush(value) {
//             output.close(value)
//         })
//         var next = pair[0], close = pari[1]
//
//         input.take()(function take(err, res) {
//             if (err) {
//                 cb(err)
//                 return
//             }
//             try {
//                 last = null
//                 if (produce(res.done, res.value)) {
//                     // early terimination
//                     // assert(finish)
//                     return
//                 }
//                 if (last === null) {
//                     // zero ...
//                     input.take()(take)
//                 } else {
//                     last(function (err, ok) {
//                         if (err) {
//                             cb(err)
//                         } else {
//                             input.take()(take)
//                         }
//                     })
//                 }
//             } catch (e) {
//                 cb(e)
//             }
//         })
//     }
// }
// exports.pipey = pipey
