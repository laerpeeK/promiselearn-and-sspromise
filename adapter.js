const Promise = require('./src')

module.exports = {
  resolved: Promise.resolve,
  rejected: Promise.reject,
  deferred() {
    const result = {}
    result.promise = new Promise((resolve, reject) => {
      result.resolve = resolve
      result.reject = reject
    })
    return result
  }
}