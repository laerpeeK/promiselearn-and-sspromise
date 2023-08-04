const SSPromise = require('./core')

const state = {
  count: 0,
  addCount(num, resolve, reject) {
    if (num && typeof num !== 'number') {
      return reject({
        status: 'fail',
        message: 'num 必须为数字！'
      })
    }

    this.count += num
    resolve({
      status: 'success',
      message: `state.count ${state.count}`,
    })
  },
}

// 1) then
const a = new SSPromise((resolve, reject) => {
  state.addCount(1, resolve, reject)
})

a.then(
  (res) => {
    console.log(res)
  },
  (err) => {
    console.log(err)
  }
)

// 2) catch
const b = new SSPromise((resolve, reject) => {
  state.addCount('SSPromise', resolve, reject)
})

b.catch((err) => {
  console.log(err)
})

// 3) finally
const c = new SSPromise((resolve, reject) => {
  state.addCount(1, resolve, reject)
})

c.then((res) => {
  console.log(res)
}).finally(() => {
  console.log('finally')
})