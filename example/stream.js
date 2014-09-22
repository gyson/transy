
var ty = require('../lib/index')

// a simple repl

var xform = ty.compose(
    ty.map(function (buf) {
        return buf.toString()
    }),

    ty.map(function (exp) {
        try {
            return eval(exp)
        } catch (err) {
            return err
        }
    }),

    ty.map(function (result) {
        return '==> ' + result + '\n\n'
    })
)

process.stdin
    .pipe(ty.stream(xform))
    .pipe(process.stdout)

// 1 + 1 + 2
// ==> 4
//
// 'hello' + ', world!'
// ==> hello, world!
//
// [1, 2, 3].map(function (x) { return x + 1 })
// ==> 2,3,4
