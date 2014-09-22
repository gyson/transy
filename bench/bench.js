
var fast = require('fast.js')
var ty = require('../lib/index')
var Benchmark = require('benchmark')


var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]

for (var i = 0; i < 1000000; i++) {
    arr.push(i);
}

var inc = function (x) { return x * x + Math.random() }

var isEven = function (x) { return x % 2 === 0 }

var composed = ty.chain(function (chain) { chain
    .map(inc)
    .map(inc)
    .filter(isEven)
    .map(inc)
    .map(inc)
})

function max() {
    var result = []
    for (var i = 0, len = arr.length; i < len; i++) {
        var x = arr[i];
        x = inc(x)
        x = inc(x)
        if (!isEven(x)) { continue }
        x = inc(x)
        x = inc(x)
        result.push(x)
    }
    return result
}

function fastjs() {
    return fast.map(fast.map(fast.filter(fast.map(fast.map(arr, inc), inc), isEven), inc), inc)
}

// transy
function transy() {
    return ty.array(composed, arr)
}
//
// console.log(transy())
// console.log(array())
// console.log(fastjs())


function array() {
    return arr.map(inc).map(inc).filter(isEven).map(inc).map(inc)
}

new Benchmark.Suite()

.add('transy', transy)

.add('array', array)

.add('fastjs', fastjs)

.add('max', max)

.on('cycle', function(event) {
  console.log(String(event.target));
})

.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})

.run({ 'async': true });
