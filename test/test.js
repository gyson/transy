
var ty = require('../lib/index')

ty.test(ty.map(function (x) {
    return x + 1;
}))
([], [])
([0, 1, 2], [1, 2, 3])
([-1, -2, -3], [0, -1, -2])

ty.test(ty.filter(function (x) {
    return x % 2 === 0
}))
([], [])
([1, 3, 5, 7], [])
([0, 1, 2, 3], [0, 2])

// test array
// test stream
