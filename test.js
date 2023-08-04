const promisesAplusTests = require('promises-aplus-tests')
const adpater = require('./adapter')

promisesAplusTests(adpater, function (err) {
  if (err) {
    console.error('Promise/A+ 测试失败')
    console.error(err)
  } else {
    console.log('Promise/A+ 测试通过')
  }
})