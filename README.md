# promiselearn-and-sspromise

## promise的实现
出自这个库：[promise](https://github.com/then/promise)。
看了几个满足 Promise/A+规范的实现，这个库的实现方式是个人觉得是最容易理解的，也比较全面。

## 区别

1. 根据[PromiseA+](https://promisesaplus.com/)规范，此仓库对代码具体位置进行标记。
2. 添加了部分个人觉得便于理解该实现有用的中文注释。
3. 只保留了源码部分，更好的结合源码分析。更改了 promise/A+测试集的调用方式。具体实现参照另一个库[promises-tests](https://github.com/promises-aplus/promises-tests)。
4. 只考虑前端会涉及的 Promise 使用。
5. 添加了 SSPromise 的实现。
6. 重写了Promise.all/Promise.allSetteled方法。(此仓库的实现上通过调用Promise.resolve使方法实现比较容易理解，但原先版本的实现手段更详细，在方法本身就体现了resolve的规范要求)。

## 比较重要的观念

1. promise 这个库的作用：在不支持**Promise**的环境下允许你使用 Promise 的写法。而具体事件队列的功能是通过**asap**这个库提供的。
   如果你想要知道 Promise/A+规范，以及 Promise 这种承诺式写法的实现。[promise](https://github.com/then/promise)这个库可以帮助到你。但如果你的疑问在于
   浏览器/Nodejs 的事件队列如何良好的处理。你应该在 github 上寻找更适合你的库。比如看看[asap](https://github.com/kriskowal/asap)这个库的实现。
2. Promise是优雅地书写异步代码的一种方案，而非异步本身。
3. 此仓库 sspromise 目录是一个同步版本的 Promise 实现。 出发点是为了解决个人在开发 vue + vuex 项目的遇到的问题。 把处理过程放在 vuex。 把处理结果后续操作放在组件这样的一个需求。
4. 这只是一个模拟，远远没有浏览器实现的Promise优秀，Promise静态方法实现存在一些边界条件问题。

### sspromise 说明

1. 个人在开发 vue + vuex 项目时实现的一个方法。通过该方法可以在 store.mutations 中进行数据处理，然后决定 sspromise 的状态。在具体组件中通过 sspromise.then/ .catch / .finally 进行组件内部或全局提示框的唤起。

2. 如果你对 ES6-Promise 或 Promise/A+ 比较熟悉。 相信很容易理解两者的区别。反之，该 sspromise 目录会影响你对于 promise/A+的学习，不建议参考。

### 使用

1. npm run test: Promise/A+测试 跟 promise 这个库的代码一样，所以自然就是全部 pass 的
2. npm run ssp-test: SSPromise 使用的简单测试
