'use strict';
var tap = module.exports = require('tap')
var stack = require('tap/lib/stack.js')

var Test = tap.Test

Test.prototype.test = test

// Rebind!
Object.defineProperty(tap, 'test', {
  value: test.bind(tap),
  enumerable: false,
  configurable: true,
  writable: true
})

function promiseHack(child, cb) {
  var cbReturn = child._domain.bind(cb)(child)
  if (cbReturn && typeof cbReturn.then === 'function') {
    cbReturn
      .then(function() {
        child.end()
      }, function(reason) {
        child.error(reason, reason.message)
        child.end()
      })
  }
}

function hasOwn (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function pruneFailures (res) {
  if (res.failures) {
    res.failures = res.failures.filter(function (f) {
      return f.tapError
    })
    if (!res.failures.length)
      delete res.failures
  }
  return res
}

function childStream (self, child) {
  var bailedOut = false
  var linebuf = ''
  child.on('data', function (c) {
    if (bailedOut)
      return
    linebuf += c
    var lines = linebuf.split('\n')
    linebuf = lines.pop()
    lines.forEach(function (line) {
      if (bailedOut)
        return
      if (line.match(/^\s*Bail out!/))
        bailedOut = true
      if (line.match(/^\s*TAP version \d+$/))
        return
      if (line.trim())
        line = '    ' + line
      self.push(line + '\n')
    })
  })
  child.on('end', function () {
    if (bailedOut)
      return
    if (linebuf)
      self.push('    ' + linebuf + '\n')
  })
}

function test (name, extra, cb) {
  if (this._bailedOut)
    return

  if (this._autoendTimer)
    clearTimeout(this._autoendTimer)

  if (typeof name === 'function') {
    cb = name
    name = ''
    extra = {}
  } else if (typeof extra === 'function') {
    cb = extra
    extra = {}
  }

  if (!cb) {
    extra = extra || {}
    extra.todo = true
  } else if (typeof cb !== 'function')
    throw new Error('test() requires a callback')

  if (extra.skip || extra.todo)
    return this.pass(name, extra)

  // will want this captured now in case child fails.
  if (!hasOwn(extra, 'at'))
    extra.at = stack.at(test)

  if (this._currentChild) {
    this._queue.push(['test', name, extra, cb])
    return
  }

  var child = new Test(extra)
  name = name || '(unnamed test)'

  child._name = name
  child._parent = this
  if (this._bail)
    child._bail = this._bail

  this._currentChild = child
  var self = this
  childStream(self, child)
  var results
  child.on('complete', function (res) {
    results = pruneFailures(res)
  })
  child.on('end', function () {
    if (child._threw && child._ok) {
      child._ok = false
      extra.error = child._threw
      if (extra.error.stack)
        extra.error.stack = stack.clean(extra.error.stack)
    }
    extra.results = results
    self._currentChild = null
    if (results)
      name += ' # time=' + results.time + 'ms'
    self.ok(child._ok, name, extra)
    if (!self._ended)
      self.push('\n')
    self._processQueue()
  })
  child.on('bailout', function (message) {
    rootBail(self, message)
  })

  // still need try/catch for synchronous errors
  self._level = child
  child.comment('Subtest: ' + name)
  try {
    // START HACK
    // Original Code:
    // child._domain.bind(cb)(child)
    promiseHack(child, cb)
    // END HACK
  } catch (er) {
    child.threw(er)
  }
  self._level = self
}
