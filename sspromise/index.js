import SSPromise from './static.js'

const state = {
  count: 0,
  addCount(num, resolve, reject) {
    if (num && typeof num !== 'number') {
      return reject({
        status: 'fail',
        message: 'num 必须为数字！',
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

// 4) more then
const d = new SSPromise((resolve, reject) => {
  state.addCount(1, resolve, reject)
})

d.then((res) => {
  console.log('success: 1then', res)
})

d.then((res) => {
  console.log('success: 2then', res)
})

// 5) setTimeout to resolve
const e = new SSPromise((resolve, reject) => {
  setTimeout(() => {
    state.addCount(1, resolve, reject)
  }, 2000)
})

e.then(
  (res) => {
    console.log('e-success: ', res)
  },
  (err) => {
    console.log('e-fail: ', err)
  }
)

SSPromise.resolve(1).then((res) => {
  console.log('SSPromise.resolve: ', res)
})

SSPromise.resolve(
  new SSPromise((resolve) => {
    resolve(2)
  })
).then((res) => {
  console.log('SSPromise.resolve: ', res)
})

SSPromise.reject(3).catch((err) => {
  console.log('SSPromise.reject: ', err)
})

SSPromise.all([
  SSPromise.resolve(1),
  2,
  new SSPromise((resolve) => {
    resolve(3)
  }),
]).then(
  (res) => {
    console.log('SSPromise.all resolve: ', res)
  },
  (err) => {
    console.log('SSPromise.all reject', err)
  }
)

SSPromise.all([
  1,
  2,
  new SSPromise((resolve, reject) => {
    reject(3)
  }),
]).then(
  (res) => {
    console.log('SSPromise.all resolve: ', res)
  },
  (err) => {
    console.log('SSPromise.all reject', err)
  }
)
