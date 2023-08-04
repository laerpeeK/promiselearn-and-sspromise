# promiselearn-and-sspromise

## 这个仓库源码地址为：[promise](https://github.com/then/promise)。

看了几个满足 Promise/A+规范的实现，这个源码的实现方式是个人觉得是最容易理解的。

## 区别

1. 根据[PromiseA+](https://promisesaplus.com/)规范，此仓库对代码具体位置进行标记。
2. 添加了部分个人觉得便于理解该实现有用的中文注释。
3. 只保留了源码部分，专注于阅读源码本身。更改了 promise/A+测试集的调用方式。具体实现参照另一个库[promises-tests](https://github.com/promises-aplus/promises-tests)。
4. 只考虑前端会涉及的 Promise 使用。
5. 添加了SSPromise的实现。

## 比较重要的观念

1. promise 这个库的作用：在不支持**Promise**的环境下允许你使用 Promise 的写法。而具体事件队列的功能是通过**asap**这个库提供的。
   分清楚你的需求，如果你想要知道 Promise/A+规范，以及 Promise 这种“承诺式”写法的实现。[promise](https://github.com/then/promise)这个库可以帮助到你。但如果你的疑问在于
   浏览器/Nodejs 的事件队列如何实现。你应该在 github 上寻找更适合你的库。比如看看[asap](https://github.com/kriskowal/asap)这个库的实现。
2. Promise 这种写法并非依赖于异步，而是能够让异步代码更加优雅。
3. 此仓库 sync 目录是一个同步版本的 Promise 实现。 为的是解决个人在开发 vue + vuex 项目的遇到的问题。 把处理过程放在 vuex。 把处理结果后续操作放在组件这样的一个需求。

### sspromise 说明

1. 个人在开发 vue + vuex 项目时实现的一个方法。通过该方法可以在 store.mutations 中进行数据处理，然后决定 sspromise 的状态。在具体组件中通过 sspromise.then/ .catch / .finally 进行组件内部或全局提示框的唤起。

2. 如果你对ES6-Promise 或 Promise/A+ 比较熟悉。 相信很容易理解两者的区别。反之，该sspromise目录会影响你对于promise/A+的学习，不建议参考。


### 使用
1. npm run test: Promise/A+测试 跟promise这个库的代码一样，所以自然就是全部pass的
2. npm run ssp-test: SSPromise使用的简单测试

