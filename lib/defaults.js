
// built-in functions

function map(fn) {
    return function (next) {
        return function (data, done) {
            return next(done ? data : fn(data), done)
        }
    }
}
exports.map = map

function each(fn) {
    return function (next) {
        return function (data, done) {
            if (!done) {
                fn(data)
            }
            return next(data, done)
        }
    }
}
exports.each = each

// called when done
function done(fn) {
    return function (next) {
        return function (data, done) {
            if (done) {
                fn(data)
            }
            return next(data, done)
        }
    }
}
exports.done = done

function filter(fn) {
    return function (next) {
        return function (data, done) {
            if (done || fn(data)) {
                return next(data, done)
            }
            return false // not stopped
        }
    }
}
exports.filter = filter

function reverse() {
    return function (next) {
        var list = [];
        return function (data, done) {
            if (done) {
                while (list.length > 0) {
                    if (next(list.pop())) {
                        list = null
                        return true
                    }
                }
                return next(data, done)
            } else {
                list.push(data)
                return false
            }
        }
    }
}
exports.reverse = reverse

function compose() {
    var fns = arguments
    return function (next) {
        for (var i = fns.length-1; i >= 0; i--) {
            next = fns[i](next)
        }
        return next
    }
}
exports.compose = compose

function take(n) {
    return function (next) {
        var count = n
        return function (data, done) {
            if (done || n > 0) {
                n--
                return next(data, done)
            }
            return next(null, true)
        }
    }
}
exports.take = take

function takeWhile(fn) {
    return function (next) {
        return function (data, done) {
            if (done) {
                return next(data, done)
            }

            if (fn(data)) {
                // continue
                return next(data)
            } else {
                // stop
                next(null, true)
                return true
            }
        }
    }
}
exports.takeWhile = takeWhile

function drop(n) {
    return function (next) {
        var count = n
        return function (data, done) {
            if (data) {
                return next(data, done)
            }

            if (n > 0) {
                // drop
                n--
                return false
            } else {
                return next(data)
            }
        }
    }
}
exports.drop = drop;

function dropWhile(fn) {
    return function (next) {
        var ok = false
        return function (data, done) {
            if (done) {
                return next(data, done)
            }

            if (ok) {
                return next(data)
            } else {
                ok = !fn(data)
                return false // not stop
            }
        }
    }
}
exports.dropWhile = dropWhile

// after `next(null)` is called,
// `next(x)` has no more effect (just like noop)
function safe() {
    return function (next) {
        var terminated = false;
        return function (data, done) {
            if (!terminated) {
                if (done) {
                    terminated = true
                    next(data, done)
                } else {
                    if (next(data)) {
                        terminated = true
                    }
                }
            }
            return terminated
        }
    }
}

function split(matcher) {
    return function (next) {
        var left = ''
        return function (data, done) {
            if (done) {
                if (!next(left)) {
                    next(data, done)
                }
                return true
            } else {
                var l = data.split(matcher)
                next(left + l[0])
                for (var i = 1; i < l.length-1; i++) {
                    if (next(l[i])) {
                        return true
                    }
                }
                left = l[i]
            }
        }
    }
}
exports.split = split

// var xform = chain(c => c
//     .map()
//     .filter()
//     .map()
//     .take()
//     .drop()
//     .chain(c => c
//         .map()
//         .filter()
//     )
//     .filter()
// )

function chain(fn) {
    var ch = new Chain()
    fn(ch)

    var fns = ch._stack
    ch._stack = null

    return compose.apply(null, fns)
}
exports.chain = chain

function Chain() {
    this._stack = []
}

// at the end
Object.keys(exports).forEach(function (name) {
    var fn = exports[name]
    Chain.prototype[name] = function () {
        if (!this._stack) {
            throw new Error('cannot append outside of init function')
        }
        this._stack.push(fn.apply(this, arguments))
        return this
    }
})
