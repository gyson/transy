
var T = require('./index')
var test = require('tape')
var PassThrough = require('stream').PassThrough

function isEven(num) {
    return num % 2 === 0
}

function inc(num) {
    return num + 1
}

function sum(prev, curr) {
    return prev + curr
}

test('async', function (t) {
    t.plan(1)
    var stream = new PassThrough({ objectMode: true })

    var f = T.async.bind(0, T.compose(
        T.map(inc),
        T.reduce(sum)
    ))

    f(stream)(function (_, res) {
        t.equal(res, 9)
    })

    stream.write(1)
    stream.write(2)
    stream.write(3)
    stream.end()
})

test('sync', function (t) {
    var f = T.sync.bind(0, T.compose(
        T.map(function (x) {
            return x + 1
        }),
        T.reduce(function sum(prev, curr) {
            return prev + curr
        })
    ))
    t.equal(f([1, 2, 3]), 9)
    t.end()
})


test('compose', function (t) {
    function* gen() {
        yield 1
        yield 2
        yield 3
        return 4
    }
    // compose nothing
    var nothing = T.compose()
    t.equal(T.sync(nothing, gen()), 4)

    // one
    var one = T.compose(T.compose(T.compose(
        T.reduce(function (curr, next) {
            return curr + next
        })
    )))
    t.equal(T.sync(one, gen()), 6)

    // compose multiple
    var multiple = T.compose(
        T.map(inc),
        T.reduce(function (curr, next) {
            return curr + next
        })
    )
    t.equal(T.sync(multiple, gen()), 9)
    t.end()
})

test('concat', function (t) {
    // to array
    function* gen() {
        yield 1
        yield 2
        yield 3
    }
    t.deepEqual(T.sync(T.concat(), gen()), [1, 2, 3])

    t.end()
})

test('done', function (t) {
    var count = 0
    var check = T.sync.bind(0, T.done(function () {
        count += 1
    }))

    check([])
    t.equal(count, 1)

    check([1])
    t.equal(count, 2)

    check([1, 2])
    t.equal(count, 3)

    t.end()
})

test('drop', function (t) {
    var f = T.sync.bind(0, T.compose(
        T.drop(2),
        T.concat()
    ))
    t.deepEqual(f([]), [])
    t.deepEqual(f([1, 2, 3, 4]), [3, 4])
    t.deepEqual(f([1, 2, 3, 4, 5]), [3, 4, 5])
    t.end()
})

test('dropWhile', function (t) {
    var f = T.sync.bind(0, T.compose(
        T.dropWhile(isEven),
        T.concat()
    ))
    t.deepEqual(f([2, 4, 2, 6, 8]), [])
    t.deepEqual(f([2, 4, 1, 2, 3]), [1, 2, 3])
    t.end()
})


test('each', function (t) {
    var sum = 0
    var f = T.sync.bind(0, T.each(function (val) {
        sum += val
    }))

    f([1])
    t.equal(sum, 1)

    f([1, 2])
    t.equal(sum, 4)

    f([1, 2, 3])
    t.equal(sum, 10)

    t.end()
})


test('every', function (t) {
    var f = T.sync.bind(0, T.every(isEven))

    t.equal(f([2, 4, 6]), true)
    t.equal(f([2, 3, 4]), false)
    t.end()
})

test('expand', function (t) {
    function* fn(val) {
        yield val
        yield val
    }
    var f = T.sync.bind(0, T.compose(
        T.expand(fn),
        T.concat()
    ))
    t.deepEqual(f([]), [])
    t.deepEqual(f([1, 2, 3]), [1, 1, 2, 2, 3, 3])
    t.end()
})

test('filter', function (t) {
    var f = T.sync.bind(0, T.compose(
        T.filter(isEven),
        T.concat()
    ))
    t.deepEqual(f([]), [])
    t.deepEqual(f([1, 2, 3]), [2])
    t.deepEqual(f([1, 2, 3, 4, 5]), [2, 4])
    t.end()
})

test('find', function (t) {
    var f = T.sync.bind(0, T.find(isEven))

    t.equal(f([]), void 0)
    t.equal(f([1, 3]), void 0)
    t.equal(f([1, 2, 3, 4]), 2)

    t.end()
})

test('join', function (t) {

    t.equal(T.sync(T.join(), ['a', 'b', 'c']), 'a,b,c')

    t.equal(T.sync( T.join(''), ['a', 'b', 'c']), 'abc')

    t.end()
})

test('map', function (t) {
    var f = T.sync.bind(0, T.compose(
        T.map(inc),
        T.concat()
    ))
    t.deepEqual(f([]), [])
    t.deepEqual(f([1]), [2])
    t.deepEqual(f([1, 2, 3]), [2, 3, 4])
    t.end()
})

test('reduce', function (t) {
    var f = T.sync.bind(0, T.reduce(function (prev, curr) {
        return prev + curr
    }, function init() {
        return 0
    }))
    t.equal(f([]), 0)
    t.equal(f([1, 2, 3, 4, 5]), 15)
    t.end()
})


test('some', function (t) {
    var x = T.some(isEven)
    t.equal(T.sync(x, [1, 3, 5]), false)
    t.equal(T.sync(x, [1, 3, 2]), true)
    t.end()
})

// test('slice', function (t) {
//     var x = T.slice(1, 2)
//
//     // t.equal(T.sync(x, [1, 2, 3]), )
//
//     t.end()
// })

test('split', function (t) {
    var x = T.compose(
        T.split('x'),
        T.concat()
    )
    t.deepEqual(T.sync(x, ['ax', 'bc', 'dxf']), ['a', 'bcd', 'f'])
    t.end()
})

test('take', function (t) {
    var x = T.compose(
        T.take(3),
        T.concat()
    )
    t.deepEqual(T.sync(x, []), [])
    t.deepEqual(T.sync(x, [1, 2, 3]), [1, 2, 3])
    t.deepEqual(T.sync(x, [1, 2, 3, 4, 5, 6]), [1, 2, 3])
    t.end()
})

test('takeWhile', function (t) {
    var x = T.compose(
        T.takeWhile(isEven),
        T.concat()
    )
    t.deepEqual(T.sync(x, []), [])
    t.deepEqual(T.sync(x, [2, 4]), [2, 4])
    t.deepEqual(T.sync(x, [1, 2, 4]), [])
    t.deepEqual(T.sync(x, [2, 4, 1, 4]), [2, 4])
    t.deepEqual(T.sync(x, [2, 4, 6, 8]), [2, 4, 6, 8])
    t.end()
})
//
// test('chain', function (t) {
//     var x = T.chain(function(){this
//         .map(inc) // add 1
//         .reduce(function (prev, curr) {
//             return prev + curr
//         })
//     })
//     t.equal(T.sync([1, 2, 3], x), 9)
//     t.equal(T.sync([1, 2, 3, 4], x), 14)
//     t.end()
// })
