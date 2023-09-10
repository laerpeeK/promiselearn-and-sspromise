'use strict'

import SSPromise from './prototype.js'

function valueSSPromise(value) {
  var p = new SSPromise(SSPromise._noop) // 得到一个pending状态的Promise
  p._state = 1
  p._value = value
  return p // resolved
}

const TRUE = valueSSPromise(true)
const FALSE = valueSSPromise(false)
const NULL = valueSSPromise(null)
const UNDEFINED = valueSSPromise(undefined)
const ZERO = valueSSPromise(0)
const EMPTYSTRING = valueSSPromise('')

SSPromise.resolve = function (value) {
  if (value instanceof SSPromise) return value

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
        return new SSPromise(then.bind(value)) // then方法执行时的this为value, arguments为 resolve, reject, _state为new Promise返回实例的状态
      }
    } catch (ex) {
      return new SSPromise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return valueSSPromise(value)
}

SSPromise.reject = function (value) {
  return new SSPromise(function (resolve, reject) {
    reject(value)
  })
}

let iterableToArray = function (iterable) {
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

SSPromise.all = function (values) {
  return new SSPromise(function (resolve, reject) {
    var promises = iterableToArray(values)
    var result = []
    var resultLength = 0

    if (promises.length === 0) {
      resolve([])
    } else {
      promises.forEach(function (value, idx) {
        SSPromise.resolve(value).then(
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

export default SSPromise