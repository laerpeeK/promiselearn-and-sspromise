import SSPromise from './core.js'

SSPromise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

SSPromise.prototype.finally = function (f) {
  return this.then(
    function (value) {
      return new SSPromise((resolve) => {
        resolve(f())
      }).then(function () {
        return value
      })
    },
    function (err) {
      return new SSPromise((resolve) => {
        resolve(f())
      }).then(function () {
        throw err
      })
    }
  )
}

export default SSPromise