'use strict'
var asap = require('asap/raw')

function noop() {}

// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null
var IS_ERROR = {}

function getThen(obj) {
  try {
    return obj.then
  } catch (ex) {
    LAST_ERROR = ex
    return IS_ERROR
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a)
  } catch (ex) {
    LAST_ERROR = ex
    return IS_ERROR
  }
}

function tryCallTwo(fn, a, b) {
  try {
    return fn(a, b)
  } catch (ex) {
    LAST_ERROR = ex
    return IS_ERROR
  }
}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.
module.exports = Promise
function Promise(fn) {
  // 必须通过new 调用
  // Promise/A+ 1.1 “promise” is an object or function with a then method whose behavior conforms to this specification.
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new')
  }

  // fn必须是一个函数
  if (typeof fn !== 'function') {
    throw new TypeError("Promise constructor's argument is not a function")
  }

  this._deferredState = 0 // 不为0时说明在该Promise还未转化状态时就调用了then，为1时说明有一个then调用 为2时说明有多个then调用
  // Promise/A+ 2.1.1 When pending, a promise: may transition to either the fulfilled or rejected state
  this._state = 0
  this._value = null
  this._deferreds = null  // 具体的then调用后返回then结果的存储，可以是单个promise也可以是[若干个promise]。
  if (fn === noop) return // 如果fn是noop，是不会执行到resolve, reject后面这些的。等于是new Promise(noop)返回一个pending状态的promise实例
  doResolve(fn, this)
}
Promise._onReject = null
Promise._onHandle = null
Promise._noop = noop

// Promise/A+ 1.2 “thenable” is an object or function that defines a then method.
Promise.prototype.then = function (onFulfilled, onRejected) {
  // 保证是通过Promise实例调用then方法
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected)
  }

  var res = new Promise(noop)
  handle(this, new Handler(onFulfilled, onRejected, res))
  // Promise/A+ 2.2.7 then must return a promise
  return res
}

function finale(self) {
  // Promise/A+  2.2.2 & 2.2.3
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

function handleResolved(self, deferred) {
  // Promie/A+ 2.2.4 onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
  asap(function () {
    debugger
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected
    if (cb === null) {
      // Promise/A+ 2.2.7.3 If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1
      if (self._state === 1) {
        resolve(deferred.promise, self._value)
        // Promise/A+ 2.2.7.4 If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1.
      } else {
        reject(deferred.promise, self._value)
      }
      return
    }

    // Promise/A+ 2.2.5 onFulfilled and onRejected must be called as functions (i.e. with no this value).
    var ret = tryCallOne(cb, self._value)
    if (ret === IS_ERROR) {
      // Promise/A+ 2.2.7.2 If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
      reject(deferred.promise, LAST_ERROR)
      // Promise/A+ 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
    } else {
      resolve(deferred.promise, ret)
    }
  })
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value // 针对 new Promise((resolve, reject) => { resolve(promise实例) }) 这种状况。直接让外部promise实例取用其resolve实例的结果
  }

  if (Promise._onHandle) {
    Promise._onHandle(self)
  }

  // Promise/A+ 2.2.6 then may be called multiple times on the same promise.
  // 如果self._state为pending时，以队列形式存储调用then返回的Promise实例，如果已经处于fulfilled或者rejected 则直接按多个then的调用顺序调用
  // pending
  if (self._state === 0) {
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

  // 执行到这个方法说明promise的状态已经确定为fulfilled / rejected
  handleResolved(self, deferred)
}

function Handler(onFulfilled, onRejected, promise) {
  // Promise/A+ 2.2.1 Both onFulfilled and onRejected are optional arguments
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.promise = promise
}

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new promise(noop)
    res.then(resolve, reject)
    handle(self, new Handler(onFulfilled, onRejected, res))
  })
}

function doResolve(fn, promise) {
  var done = false
  var res = tryCallTwo(
    fn,
    function (value) {
      /**
       * Promise/A+ 2.1.2
       *  1) must not transition to any other state.
       *  2) must have a value, which must not change.
       *
       * 这个就是在new Promise((resolve, reject) => {})中实际上的resolve实现
       *  1) 通过done防止多次调用resolve(value)
       *  2) 实际改变promise状态为 resolve(promise, value)
       */
      if (done) return
      done = true
      resolve(promise, value)
    },
    function (reason) {
      /**
       * Promise/A+ 2.1.3
       *  1) must not transition to any other state.
       *  2) must have a reason, which must not change.
       *
       * 这个就是在new Promise((resolve, reject) => {})中实际上的reject实现
       *  1) 通过done防止多次调用reject(reason)
       *  2) 实际改变promise状态为 reject(promise, value)
       */
      if (done) return
      done = true
      reject(promise, reason)
    }
  )

  if (!done && res === IS_ERROR) {
    // 调用到此处说明fn在执行时，还未到resolve(value) / reject(err) 就已经出错了。通过此处的reject改变promise的状态为rejected以及保存错误原因LAST_ERROR
    done = true
    reject(promise, LAST_ERROR)
  }
}

function resolve(self, newValue) {
  // [[Resolve]](promise, x)

  // Promise/A+ 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    )
  }

  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    // Promise/A+ 2.3.3.1 Let then be x.then.
    var then = getThen(newValue)
    if (then === IS_ERROR) {
      // Promise/A+ 2.3.3.2 If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
      return reject(self, LAST_ERROR)
    }

    if (then === self.then && newValue instanceof Promise) {
      // Promise/A+ 2.3.2 If x is a promise, adopt its state
      self._state = 3
      self._value = newValue
      finale(self)
      return
    } else if (typeof then === 'function') {
      // Promise/A+ 2.3.3.3 If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise
      doResolve(then.bind(newValue), self)
      return
    }
  }

  // Promise/A+ 2.3.4
  self._state = 1 // fulfilled
  self._value = newValue
  finale(self)
}

function reject(self, newValue) {
  self._state = 2 // rejected
  self._value = newValue
  if (Promise._onReject) {
    // 这个方法是为了方便Promise xx方法的实现，跟PromiseA+规范无关
    Promise._onReject(self, newValue)
  }

  finale(self)
}
