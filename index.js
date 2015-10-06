'use strict';

var tap = module.exports = require('tap')

var Test = tap.Test

var originalTest = Test.prototype.test
Test.prototype.testAsync = testAsync

Object.defineProperty(tap, 'testAsync', {
  value: testAsync.bind(tap),
  enumerable: false,
  configurable: true,
  writable: true
})

function testAsync(name, extra, cb) {
  if (typeof name === 'function') {
    cb = name
    name = ''
    extra = {}
  } else if (typeof extra === 'function') {
    cb = extra
    extra = {}
  }

  function patchedCb(t) {
    var result = cb.call(this, t);
    if (result && typeof result.then === 'function') {
      result
        .then(function() {
          t.end()
        }, function(reason) {
          t.error(reason, reason.message)
          t.end()
        })
    } else {
      return result
    }
  }

  return this.test(name, extra, patchedCb)
}
