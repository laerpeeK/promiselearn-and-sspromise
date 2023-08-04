'use strict'

var Promise = require('./core.js')

module.exports = Promise
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
Promise.prototype.finally = function (f) {
  return this.then(
    function (value) {
      return Promise.resolve(f()).then(function () {
        return value
      })
    },
    function (err) {
      return Promise.resolve(f()).then(function () {
        throw err
      })
    }
  )
}
