
var T = require('..')
var fast = require('fast.js')
var jt = require('transducers.js')
var ct = require('transducers-js')
var Benchmark = require('benchmark')

var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]

for (var i = 0; i < 100; i++) {
    arr.push(i);
}

var inc = function (x) { return ~~(x + Math.random() * 2 + Math.random() * 2) }

var isEven = function (x) { return x % 2 === 0 }

var composed = T.compose(
    T.map(inc),
    T.map(inc),
    T.filter(isEven),
    T.map(inc),
    T.map(inc),
    T.filter(isEven),
    T.concat()
)

var jtForm = jt.compose(
    jt.map(inc),
    jt.map(inc),
    jt.filter(isEven),
    jt.map(inc),
    jt.map(inc),
    jt.filter(isEven)
)

var ctForm = ct.comp(
    ct.map(inc),
    ct.map(inc),
    ct.filter(isEven),
    ct.map(inc),
    ct.map(inc),
    ct.filter(isEven)
)

// var check = console.log
// var check = function noop() {}

new Benchmark.Suite()

.add('transy', function () {
    return T.sync(composed, arr)
})

.add('jlongster-transducer.js', function () {
    return jt.into([], jtForm, arr)
})

.add('Cognitect-transducers-js', function () {
    return ct.into([], ctForm, arr)
})

.add('fast.js', function () {
    return fast.filter(fast.map(fast.map(fast.filter(fast.map(fast.map(arr, inc), inc), isEven), inc), inc), isEven)
})

.add('native', function () {
    return arr.map(inc).map(inc).filter(isEven).map(inc).map(inc).filter(isEven)
})

.on('cycle', function(event) {
    console.log(String(event.target));
})

.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

.run()
// .run({ async: true });
