
var ty = require('../lib/index')

function inc(x) {
    return x + 1
}

function isEven(x) {
    return x % 2 === 0
}

var xform = ty.compose(
    ty.take(5),
    ty.map(inc),
    ty.filter(isEven),
    ty.reverse()
)

console.log(ty.array(xform, [1, 2, 3, 4, 5, 6, 7]))

// => [ 6, 4, 2 ]
