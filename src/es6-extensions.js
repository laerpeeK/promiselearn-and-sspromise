'use strict'

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js')

module.exports = Promise

/* Static Functions */

var TRUE = valuePromise(true)
var FALSE = valuePromise(false)
var NULL = valuePromise(null)
var UNDEFINED = valuePromise(undefined)
var ZERO = valuePromise(0)
var EMPTYSTRING = valuePromise('')

function valuePromise(value) {
  var p = new Promise(Promise._noop) // 得到一个pending状态的Promise
  p._state = 1
  p._value = value
  return p // resolved
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
Promise.resolve = function (value) {
  // 跟resolve的最大区别在于 1)
  // 1) 如果该值本身就是一个 Promise，那么该 Promise 将被直接返回 (状态不一定是resolved)
  if (value instanceof Promise) return value

  // 2) 以该值fulfilled的promise实例
  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  // 3) thenable对象的情况
  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value)) // then方法执行时的this为value, arguments为 resolve, reject, _state为new Promise返回实例的状态
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return valuePromise(value)
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value)
  })
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol
var iterableToArray = function (iterable) {
  if (typeof Array.from === 'function') {
    // ES2015+ iterables exist
    iterableToArray = Array.from
    return Array.from(iterable)
  }

  // ES5, only arrays and array-likes exist
  iterableToArray = function (x) {
    return Array.prototype.slice.call(x)
  }
  return Array.prototype.slice.call(iterable)
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
// resolve 本身的实现是通过done 标志让无法多次触发。
Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    iterableToArray(values).forEach(function (value) {
      Promise.resolve(value).then(resolve, reject)
    })
  })
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/AggregateError
// AggregateError为浏览器内置函数
function getAggregateError(errors) {
  if (typeof AggregateError === 'function') {
    return new AggregateError(errors, 'All promises were rejected')
  }

  var error = new Error('All promises were rejected')

  error.name = 'AggregateError'
  error.errors = errors

  return error
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/any
// 再次体现Promise.resolve(value)在value为promise实例时直接抛出的好处
Promise.any = function (values) {
  return new Promise(function (resolve, reject) {
    var promises = iterableToArray(values)
    var hasResolved = false
    var rejectionReasons = []

    function resolveOnce(value) {
      if (!hasResolved) {
        hasResolved = true
        // asynchronously rejected
        resolve(value)
      }
    }

    function rejectionCheck(reason) {
      rejectionReasons.push(reason)

      if (rejectionReasons.length === promises.length) {
        // asynchronously filfilled
        reject(getAggregateError(rejectionReasons))
      }
    }

    if (promises.length === 0) {
      // already rejected
      reject(getAggregateError(rejectionReasons))
    } else {
      promises.forEach(function (value) {
        Promise.resolve(value).then(resolveOnce, rejectionCheck)
      })
    }
  })
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
// 修改了实现方式，在理解Promise/A+ 规范的前提下这个版本的实现更好理解
Promise.all = function (values) {
  return new Promise(function (resolve, reject) {
    var promises = iterableToArray(values)
    var result = []
    var resultLength = 0

    if (promises.length === 0) {
      resolve([])
    } else {
      promises.forEach(function (value, idx) {
        Promise.resolve(value).then(
          function (value) {
            result[idx] = value
            resultLength++
            if (resultLength === promises.length) {
              resolve(result)
            }
          },
          function (reason) {
            reject(reason)
          }
        )
      })
    }
  })
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
// 修改了实现方式，在理解Promise/A+ 规范的前提下这个版本的实现更好理解
Promise.allSettled = function (values) {
  return new Promise(function (resolve, reject) {
    var promises = iterableToArray(values)
    var result = []
    var resultLength = 0
    if (promises.length === 0) {
      resolve([
        {
          status: 'fulfilled',
          value: [],
        },
      ])
    } else {
      promises.forEach(function (value, idx) {
        Promise.resolve(value).then(
          function (value) {
            result[idx] = {
              status: 'fulfilled',
              value,
            }
            resultLength++
            if (resultLength === promises.length) {
              resolve(result)
            }
          },
          function (reason) {
            result[idx] = {
              status: 'rejected',
              reason,
            }
            resultLength++
            if (resultLength === promises.length) {
              resolve(result)
            }
          }
        )
      })
    }
  })
}

/* Prototype Methods */
Promise.prototype['catch'] = function (onRejected) {
  // 根据规范 如果promise1 then没有调用 onRejected, 错误原因会传给promise2 进行reject。
  // catch 方法就是利用了这个特性实现的
  return this.then(null, onRejected)
}
