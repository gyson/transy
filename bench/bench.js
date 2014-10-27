
var ty = require('../lib/index')
//var Benchmark = require('benchmark')

var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]

for (var i = 0; i < 10; i++) {
    arr.push(i);
}

var inc = function (x) { return x * x }

var isEven = function (x) { return x % 2 === 0 }

var composed = ty.chain(function (chain) { chain
    .map(inc)
    .map(inc)
    .filter(isEven)
    .map(inc)
    .map(inc)
})

exports['transy'] = function () {
    return ty.array(composed, arr)
}

var jt = require('transducers.js')
var jtForm = jt.compose(
    jt.map(inc),
    jt.map(inc),
    jt.filter(isEven),
    jt.map(inc),
    jt.map(inc)
)

exports['jlongster-transducer.js'] = function () {
    return jt.into([], jtForm, arr)
}

var ct = require('transducers-js')
var ctForm = ct.comp(
    ct.map(inc),
    ct.map(inc),
    ct.filter(isEven),
    ct.map(inc),
    ct.map(inc)
)
exports['Cognitect-transducers-js'] = function () {
    return ct.into([], ctForm, arr)
}

var fast = require('fast.js')

exports['fast.js'] = function () {
    return fast.map(fast.map(fast.filter(fast.map(fast.map(arr, inc), inc), isEven), inc), inc)
}

exports['native'] = function () {
    return arr.map(inc).map(inc).filter(isEven).map(inc).map(inc)
}
