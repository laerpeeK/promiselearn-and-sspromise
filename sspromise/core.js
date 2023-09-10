/**
 * SSPromise - Simple Synchronous Promise
 * 不符合Promise/A+规范 单纯采用“promise”这种方式书写同步代码的做法。
 * 仅供参考
 */
function noop() {}

// to avoid using try/catch inside critical functions, we
// extract them to here.
let LAST_ERROR = null
const IS_ERROR = {}

function tryCallArgs(fn, ...args) {
  try {
    return fn(...args)
  } catch (ex) {
    LAST_ERROR = ex
    return IS_ERROR
  }
}

function getThen(obj) {
  try {
    return obj.then
  } catch (ex) {
    LAST_ERROR = ex
    return IS_ERROR
  }
}

function SSPromise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('SSPromise 必须通过new调用！')
  }

  if (typeof fn !== 'function') {
    throw new TypeError('SSPromise构造函数的参数必须为函数类型!')
  }

  this._state = 0
  this._value = null
  this._deferredState = 0
  this._deferreds = null
  if (fn === noop) return
  doResolve(fn, this)
}
SSPromise._noop = noop

SSPromise.prototype.then = function (onFulfilled, onRejected) {
  if (this.constructor !== SSPromise) {
    throw new Error(
      `请通过SSPromise实例调用then方法，不要通过call, apply此类方法进行调用！`
    )
  }

  const res = new SSPromise(noop)
  handle(this, new Handler(onFulfilled, onRejected, res))
  return res
}

function handle(self, deferred) {
  if (self._state == 0) {
    if (self._deferredState === 0) {
      self._deferredState = 1
      self._deferreds = deferred
      return
    }

    if (self._deferredState === 1) {
      self._deferredState = 2
      self._deferreds = [self._deferreds, deferred]
      return
    }

    self._deferreds.push(deferred)
    return
  }

  handleResolved(self, deferred)
}

function handleResolved(self, deferred) {
  ;(function () {
    const cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected
    if (cb === null) {
      if (self._state === 1) {
        resolve(deferred.sspromise, self._value)
      } else {
        reject(deferred.sspromise, self._value)
      }
      return
    }

    const ret = tryCallArgs(cb, self._value)
    if (ret === IS_ERROR) {
      reject(deferred.sspromise, LAST_ERROR)
    } else {
      resolve(deferred.sspromise, ret)
    }
  })()
}

function Handler(onFulfilled, onRejected, sspromise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.sspromise = sspromise
}

function finale(self) {
  if (self._deferredState === 1) {
    handle(self, self._deferreds)
    self._deferreds = null
  }

  if (self._deferredState === 2) {
    for (var i = 0; i < self._deferreds.length; i++) {
      handle(self, self._deferreds[i])
    }
    self._deferreds = null
  }
}

function resolve(self, newValue) {
  if (newValue === self || newValue instanceof SSPromise) {
    return reject(
      self,
      new TypeError(
        'SSPromise实例 resolve value 不能为本身或其他SSPromise实例！'
      )
    )
  }

  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    const then = getThen(newValue)
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR)
    } else if (then) {
      return reject(
        self,
        new TypeError('SSPromise实例 resolve value 不能为thenable！')
      )
    }
  }

  self._state = 1
  self._value = newValue

  finale(self)
}

function reject(self, newValue) {
  self._state = 2
  self._value = newValue

  finale(self)
}

function doResolve(fn, sspromise) {
  let done = this
  const res = tryCallArgs(
    fn,
    function (value) {
      if (done) return
      done = true
      resolve(sspromise, value)
    },
    function (reason) {
      if (done) return
      done = true
      reject(sspromise, reason)
    }
  )

  if (!done && res === IS_ERROR) {
    done = true
    reject(sspromise, LAST_ERROR)
  }
}

SSPromise.version = '0.0.1'
SSPromise.install = function () {
  if (!window.SSPromise) {
    window.SSPromise = SSPromise
  }
}

export default SSPromise
