
# transy

Composable transform functions which could be reused for Array, Event, Stream, Channel, etc.

## Inspiration

It's based on clojure's [transduce](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming).
Some awesome posts explained it in Javascript worth reading:

* [CSP and transducers in JavaScript](http://phuu.net/2014/08/31/csp-and-transducers.html)
* [Transducers.js: A JavaScript Library for Transformation of Data](http://jlongster.com/Transducers.js--A-JavaScript-Library-for-Transformation-of-Data)

## Install

```
npm install transy
```

## Example

```js
var ty = require('transy')

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
```

## Note

To be frankly, the transy is kind of a subset of transducer since
it used less info than tranduce, therefore, you should
be able to convert any transy function to transducer.

## API Document

### compose

```js
var ty = require('transy')

ty.compose(
    ty.map(),
    ty.filter(),
    ty.map()
)
```

### stack

```js
transy.stack(function () {
    this
    .map()
    .filter()
    .map()
})
```

with arrow function:

```js
var ty = require('transy')

ty.stack(c => c
    .map()
    .filter()
    .map()
)
```

with coffee-script:

```coffee
ty = require 'transy'

ty.stack ->
  @map (x) -> x + 1
  @filter (x) -> x > 10
  @map (x) -> x.toString()
```
