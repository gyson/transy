'use strict';

// all built-in methods:

// compose
// concat
// done
// drop
// dropWhile
// each
// every
// expand
// filter
// find
// join
// map
// reduce
// some
// slice
// split
// take
// takeWhile
// chain

// early termination by explicitly returning `false`

function compose() {
    var fns = _flatten([], arguments)
    return function init(next, close) {
        var pair = [next, close]
        for (var i = fns.length-1; i >= 0; i--) {
            pair = fns[i](pair[0], pair[1])
        }
        return pair
    }
}
exports.compose = compose

function _flatten(list, args) {
    for (var i = 0; i < args.length; i++) {
        var obj = args[i]
        if (typeof obj === 'function') {
            list.push(obj)
            continue
        }
        if (obj && obj.length === +obj.length) {
            _flatten(list, obj)
            continue
        }
        throw new TypeError('from transy.compose: '
                    + obj + ' is not function or array')
    }
    return list
}

// concat to array
function concat() {
    return function init(next, close) {
        var arr = []
        return [
            function onData(value) {
                arr.push(value)
                return true
            },
            function onFlush() {
                close(arr)
            }
        ]
    }
}
exports.concat = concat

function done(fn) {
    return function init(next, close) {
        return [
            next,
            function onFlush(value) {
                fn(value)
                close(value)
            }
        ]
    }
}
exports.done = done

function drop(num) {
    if (num !== ~~num || num < 0) {
        throw new TypeError('from transy.drop: '
                    + num + ' is not non-negative integer')
    }
    return function init(next, close) {
        var n = num
        return [
            function onData(value) {
                if (n <= 0) {
                    return next(value)
                }
                n -= 1
                return true // drop
            },
            close
        ]
    }
}
exports.drop = drop

function dropWhile(fn) {
    return function init(next, close) {
        var pass = false
        return [
            function onData(value) {
                if (pass || (pass = !fn(value))) {
                    return next(value)
                } else {
                    return true // ok
                }
            },
            close
        ]
    }
}
exports.dropWhile = dropWhile

function each(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                fn(value)
                return next(value)
            },
            close
        ]
    }
}
exports.each = each
exports.forEach = each

// based on Array.prototype.every
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
function every(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                if (!fn(value)) {
                    close(false)
                    return false
                }
                return true
            },
            function onFlush() {
                close(true) // all test passed
            }
        ]
    }
}
exports.every = every

// iterator protocol
// it.expand(function* (data) {
//     yield abc
//     yield okk
// })
function expand(fn) {
    if (typeof fn !== 'function') {
        throw new TypeError('from transy.expand: '
                    + fn + ' is not generator function or equovalent')
    }
    return function init(next, close) {
        return [
            function onData(value) {
                var res, iterator = fn(value)
                while (res = iterator.next(), !res.done) {
                    if (next(res.value) === false) {
                        // early termination
                        return false
                    }
                }
                return true
            },
            close
        ]
    }
}
exports.expand = expand

function filter(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                return fn(value) ? next(value) : true
            },
            close
        ]
    }
}
exports.filter = filter

// based on Array.prototype.find
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
function find(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                return fn(value) ? (close(value), false) : true
            },
            function onFlush(value) {
                // not found
                close(void 0)
            }
        ]
    }
}
exports.find = find

function join(separator) {
    return function init(next, close) {
        var arr = []
        return [
            function onData(value) {
                arr.push(value)
                return true
            },
            function onFlush() {
                close(arr.join(separator))
            }
        ]
    }
}
exports.join = join

function map(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                return next(fn(value))
            },
            close
        ]
    }
}
exports.map = map


// based on Array.prototype.reduce
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
function reduce(fn, first) {
    if (arguments.length === 1) {
        // without init value
        return function init(next, close) {
            var prev, isEmpty = true
            return [
                function onData(value) {
                    if (isEmpty) {
                        isEmpty = false
                        prev = value
                    } else {
                        prev = fn(prev, value)
                    }
                    return true
                },
                function onFlush(value) {
                    if (isEmpty) {
                        // reduce of empty sequence without init function
                        close(value)
                    } else {
                        close(prev)
                    }
                }
            ]
        }
    }
    if (typeof first !== 'function') {
        throw new TypeError('from transy.reduce: '
                    + first + ' is not a function, require init function')
    }
    return function init(next, close) {
        var prev = first()
        return [
            function onData(value) {
                prev = fn(prev, value)
                return true
            },
            function onFlush() {
                close(prev)
            }
        ]
    }
}
exports.reduce = reduce

function some(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                if (fn(value)) {
                    close(true)
                    return false
                }
                return true
            },
            function onFlush() {
                close(false)
            }
        ]
    }
}
exports.some = some

// based on Array.prototype.slice
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
// function slice(start, end) {
//     switch (arguments.length) {
//     case 0:
//         // noop
//         return function init(next, close) {
//             return [next, close]
//         }
//
//     case 1:
//         if (start !== ~~start) {
//             throw new TypeError('from transy.slice: '
//                         + start + ' is not integer')
//         }
//         // return drop(start)
//
//     case 2:
//         if (start !== ~~start || end !== ~~end) {
//             throw new TypeError('from transy.slice: '
//                         + start + ' and ' + end + ' is not integer')
//         }
//         return something...
//
//     default:
//         throw new Error('from transy.slice: '
//                     + 'invalid number of arguments')
//     }
//     // return function init(next, close) {
//     //     var count = 0
//     //     // var container = new Array(size)
//     //     // if start >= 0, end < 0
//     //     // if end < 0... kind of hard...
//     //     return [
//     //         function onData(value) {
//     //             count += 1
//     //             if (count <= start) {
//     //                 // drop
//     //                 return true
//     //             }
//     //             if (count > end) {
//     //                 // close
//     //                 close(void 0)
//     //                 return false
//     //             } else {
//     //                 return next(value)
//     //             }
//     //         },
//     //         close
//     //     ]
//     // }
// }
// exports.slice = slice

function split(matcher) {
    return function init(next, close) {
        var left = ''
        return [
            function onData(value) {
                if (typeof value !== 'string') {
                    throw new TypeError('from transy.split: '
                                + value + ' is not string')
                }
                var list = (left + value).split(matcher)
                for (var i = 0; i < list.length-1; i++) {
                    if (next(list[i]) === false) {
                        return false
                    }
                }
                left = list[i]
                return true
            },
            function onFlush(value) {
                if (next(left) !== false) {
                    close(value)
                }
            }
        ]
    }
}
exports.split = split

function take(num) {
    if (num !== ~~num || num < 0) {
        throw new TypeError('from transy.take: '
                    + num + ' is not positive integer')
    }
    return function init(next, close) {
        var n = num
        return [
            function onData(value) {
                if (n > 0) {
                    n -= 1
                    return next(value)
                }
                close(void 0)
                return false // early termination
            },
            close
        ]
    }
}
exports.take = take

function takeWhile(fn) {
    return function init(next, close) {
        return [
            function onData(value) {
                if (fn(value)) {
                    // take it
                    return next(value)
                }
                close(void 0) // end
                return false
            },
            close
        ]
    }
}
exports.takeWhile = takeWhile

//
// ---
// ### `.chain( fn )`
//
// Similar to `.compose`, but with chain.
//
// Example:
// ```js
// T.chain(c => c
//     .map(function () {
//
//     })
//     .filter(function () {
//
//     })
//     .reduce(function () {
//
//     })
// )
// ```
// function chain(fn) {
//     var c = new Chain()
//     fn.call(c, c)
//
//     var fns = c._chain
//     c._chain = null
//
//     return compose(fns)
// }
// exports.chain = chain
//
// function Chain() {
//     this._chain = []
// }
//
// Object.keys(exports).forEach(function (name) {
//     var fn = exports[name]
//     Chain.prototype[name] = function () {
//         if (!this._chain) {
//             throw new Error('from transy.chain: '
//                         + 'can only chain within function')
//         }
//         this._chain.push(fn.apply(this, arguments))
//         return this
//     }
// })
