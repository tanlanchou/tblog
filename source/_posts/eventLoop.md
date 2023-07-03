---
title: 浏览器事件循环
date: 2023-07-03 21:47:01
tags: 
    - web
    - javascript
    - 浏览器
    - 时间循环
    - eventloop
description: 主要讲清楚了 V8引擎简单的执行原理，什么是事件循环，settimeout原理，为什么javascript是单线程，什么事微任务和宏任务
---

### 1. V8引擎

当我们有段 javascript 是如何执行的？

当浏览器解析到一段javascript，会将 javascript 交给 js引擎，引擎去做一系列事情。

词法分析，语法分析，编译，优化之类的，但是如果要关联到我们常用的js，非常重要的就是，堆和栈，下面是堆栈的简单解释。

> 执行栈（Execution Stack）：
> 
> 执行栈是一种后进先出（LIFO）的数据结构，也被称为调用栈（Call Stack）。它用于跟踪函数的调用顺序和执行状态。每当函数被调用时，它的执行上下文（Execution Context）会被添加到执行栈的顶部。执行栈中的顶部始终是当前正在执行的函数。当函数执行完毕后，它的执行上下文会被从执行栈中移除，控制权交回给调用该函数的上下文。
> 堆（Heap）：
> 
> 堆是用于动态分配内存的区域，用于存储复杂的数据结构，如对象和数组。JavaScript中的对象和数组都存储在堆中。

文章中提到了一个概念，就是

> 你给V8一段JS代码，它就从头到尾一口气执行下去，中间不会停止

```js
while (true) {
  console.log("执行中...");
}
```

然后卡住，

### 2. 什么是js线程和渲染线程

> JavaScript线程是用于执行JavaScript代码的线程。它负责解析和执行网页中的JavaScript代码，并处理与之相关的事件和操作。JavaScript线程是单线程的，意味着它一次只能执行一个任务。当浏览器在渲染页面时，JavaScript线程会被占用，执行JavaScript代码可能会阻塞其他任务的执行，包括用户界面的响应。这就是为什么在编写JavaScript代码时需要注意避免长时间运行的操作，以免阻塞用户界面的原因。
> 
> 渲染线程是负责将HTML、CSS和JavaScript转换为可视化页面的线程。它从浏览器的渲染引擎中派生出来，并执行一系列操作，包括解析HTML和CSS、构建DOM树、计算布局和绘制页面等。渲染线程通常是多线程的，它可以将工作分配给不同的子线程来提高性能和响应性。

也就是说一个是执行 javascript 代码，一个是渲染线程

两个都是单线程，只是渲染线程可能会把部分代码交给gpu来做渲染。

### 3. 事件循环是怎么做的？

我最开始使用javascript的时候以为，是一个有时间线的队列，那个时间线必须去执行某个东西。。

1. JavaScript 代码的执行从主线程开始，主线程负责执行同步的 JavaScript 代码。
2. 当遇到异步操作（如定时器、网络请求、事件监听器等）时，异步操作被放置在任务队列（Task Queue）中，而不会立即执行。
3. 当主线程上的同步代码执行完毕时，事件循环进入检查阶段。
4. 事件循环检查任务队列是否有待执行的任务。如果任务队列中有任务，则将任务移出队列，并将其发送到主线程执行。
5. 异步任务在主线程上执行，可能包括回调函数、Promise 的处理函数、定时器的回调等。
6. 执行完异步任务后，事件循环再次进入检查阶段，重复步骤 4 和步骤 5。

也就是说，先执行同步代码，遇到异步代码放进列队，等同步任务执行完成之后检查，发送到主线程，完成以后(继续检查，继续发送到主线程)

这个过程就叫做事件循环。

### 4. setTimeout，网络请求是怎么做的？

我产生了一个疑问，如果进入了任务队列，那么时间到了，需要触发了，怎么做的？网络请求，是立刻发送？

异步任务，需要执行，那么是立刻执行，比如网络请求，比如Promise执行的部分，然后把剩余回调的部分加入任务列队。

通过事件循环检查是否应该执行，比如delay时间，比如异步是否完成。

然后推送到主线程。

这里就会想到一个问题, 也就是一个缺陷

因为目前的单线程做法，明显会导致一个问题。就是主线程阻塞以后，会影响其他异步任务，导致全面的阻塞。

也就是 setTimeout 不准确，异步完成之后并不执行，做一个简单的测试

```js
//event
const startEvent = (new Date()).getTime();
console.log(`startEvent`, startEvent);
setTimeout(function () {
  const endEvent = ((new Date()).getTime());
  console.log(`endEvent`, endEvent - startEvent); //endEvent 27595
}, 2000);
console.log(`finish setTimout:`, (new Date()).getTime());
for (let i = 0; i < 2000000000; i++) {
  let b = i;
}
console.log(`finish for:`, (new Date()).getTime());
```

这个就是有延迟。


### 5. 为什么js是单线程？

在第四个节点，知道了单线程有一个缺点，然而多线程明显会解决这个问题，那么为什么不用多线程呢？


```js
function setText() {
  const myA = document.getElementById('a');
  myA.innerText = (new Date()).getTime();
}

setTimeout(setText(), 1000);
setTimeout(setText(), 2000);
setTimeout(setText(), 3000);
```

这是一个简单的模拟异步，分别1秒，2秒，3秒。 回调中写入新的内容。

我们想一想如果使用多线程会怎么样？

1秒 => 调用回调 => 操作dom
2秒 => 调用回调 => 操作dom
3秒 => 调用回调 => 操作dom

与主线程不相关，几个线程相互无关，看上去很美好。

但是实际上，可能互斥，因为4个线程，都会操作dom，导致页面的回流或者重绘，而且时间不一定会这么泾渭分明，完全可能导致冲突，从而提升页面的复杂度。

而且加锁这种情况下，虽然说是1秒，但是不一定会1秒能解决，从而导致其他线程阻塞。

说白了，之所以单线程，就是要保证操作 web api 的只有一个线程，而不是给线程加锁，导致程序复杂度陡增。

### 6. 微任务，宏任务

刚才在第三条中说到，javascript基本执行的概念，就是一口气执行，然后把异步任务放入任务队列，然后逐条推送到主线程。

> 事件循环中的任务队列可以分为不同的队列，包括宏任务队列（Macro Task Queue）和微任务队列（Micro Task Queue）。

* 宏任务队列包含了一些较为耗时的任务，例如 DOM 操作、网络请求等。每个宏任务在执行完毕后，事件循环才会去检查微任务队列。
* 微任务队列用于处理一些轻量级的任务，例如 Promise 的回调函数、MutationObserver 的回调等。微任务在每个宏任务执行结束后立即执行，确保它们在下一个宏任务之前被处理。

我们首先要知道，哪些是微任务，哪些是宏任务

**微任务**

- Promise 回调函数（then, catch, finally）
- MutationObserver 的回调函数
- process.nextTick（仅限 Node.js 环境）
- queueMicrotask 函数
- Object.observe（已被废弃）

**宏任务**

- setTimeout 和 setInterval 回调函数
- I/O 操作和网络请求（如 AJAX、fetch）
- UI 渲染
- requestAnimationFrame 回调函数
- 页面加载事件（DOMContentLoaded, load）
- 原生事件（如点击事件、键盘事件）
- postMessage 和 MessageChannel
- setImmediate（仅限 Node.js 环境）

这里包含了大多数微任务和宏任务，但是不保证全部，因为我也没找到全部微任务和宏任务的连接。

也就是说，在检查队列任务中，还包含一些细节。

1. 当主线程上的代码执行完成后，事件循环会首先检查微任务队列。
2. 如果微任务队列中有任务，事件循环会按照先进先出的顺序依次执行所有的微任务，直到微任务队列为空。这意味着微任务会在下一个宏任务之前执行。
3. 当微任务队列为空后，事件循环会检查宏任务队列。
4. 如果宏任务队列中有任务，事件循环会选择其中的一个任务，执行该任务的全部代码。
5. 执行完当前选中的宏任务后，如果有必要，事件循环会再次检查微任务队列，重复步骤 2。
6. 重复步骤 3~5，不断地从宏任务队列中选取任务并执行，直到宏任务队列和微任务队列都为空。

也就是说，先检查微任务，在执行一个宏任务，再检查微任务，再执行一个宏任务。

这就是细节。

### 7. 第一题

我去网上找了面试题，来验证一下这一章的学习成果

```js
const promise1 = new Promise((resolve, reject) => {
  console.log('promise1')
})
promise1.then(() => {
  console.log(3);
});
console.log('1', promise1);

const fn = () => (new Promise((resolve, reject) => {
  console.log(2);
  resolve('success')
}))
fn().then(res => {
  console.log(res)
})
console.log('start')
```

* console.log('promise1')
* console.log('1', promise1);
* console.log(2);
* console.log('start')
* console.log(3);
* console.log(res)

理论上是这样的，但是由于 promise1 并没有 resolve, reject，所以 console.log(3); 没有返回。

需要注意的是 Promise 里面的方式只立刻执行的，他不属于异步任务，就是V8引擎在执行的时候顺序执行的代码，比如你发起请求，他会立刻发起请求。

### 8. 第二题

```js
Promise.resolve().then(() => { //微任务
  console.log('promise1');
  const timer2 = setTimeout(() => { //宏任务
    console.log('timer2')
  }, 0)
});
const timer1 = setTimeout(() => { //宏任务
  console.log('timer1')
  Promise.resolve().then(() => { //微任务
    console.log('promise2')
  })
}, 0)
console.log('start'); //直接执行
```

- console.log('start')
- console.log('promise1');
- console.log('timer1')
- console.log('promise2')
- console.log('timer2')

看到没，并不复杂，你明白了原理以后，他的知识点就是不停的在微任务和宏任务之间转换，然后根据作用域，不停的执行。

### 9. 第三题

```js
const promise1 = new Promise((resolve, reject) => { //执行
  setTimeout(() => { //宏任务
    resolve('success')
  }, 1000)
})
const promise2 = promise1.then(() => { //微任务
  throw new Error('error!!!')
})
console.log('promise1', promise1) //执行
console.log('promise2', promise2) //执行
setTimeout(() => { //宏任务
  console.log('promise1', promise1)
  console.log('promise2', promise2)
}, 2000)
```

这道题增加了 `setTimeout` 时间。

* console.log('promise1', promise1)
* console.log('promise2', promise2)
* throw new Error('error!!!')
* console.log('promise1', promise1)
* console.log('promise2', promise2)

如果加入了 setTimout,还需要考虑这个执行的时间顺序

### 9. 第四题

```js
const promise1 = new Promise((resolve, reject) => { //执行
  setTimeout(() => { //宏任务
    resolve("success");
    console.log("timer1");
  }, 1000);
  console.log("promise1里的内容"); //执行
});
const promise2 = promise1.then(() => { //微任务
  throw new Error("error!!!");
});
console.log("promise1", promise1); //执行
console.log("promise2", promise2); //执行
setTimeout(() => { //宏任务
  console.log("timer2"); 
  console.log("promise1", promise1);
  console.log("promise2", promise2);
}, 2000);
```

- console.log("promise1里的内容");
- console.log("promise1", promise1);
- console.log("promise2", promise2);
- throw new Error("error!!!");
- console.log("timer1");
- console.log("timer2"); 
- console.log("promise1", promise1);
- console.log("promise2", promise2);

我这里有一个错误，就是

```js
resolve("success");
console.log("timer1");
```

我第一反应还是顺序执行，其实 `resolve("success");` 需要看做一个微任务。

所以步骤是 

1. 执行完所有的代码后
2. 执行微任务 promise1.then(() => ...) 但是没有需要执行的
3. 执行一个宏任务 promise1 下的 settimeout
4. 优先执行顺序代码 console.log("timer1");
5. 执行微任务 promise1.then(() => {...});
6. 执行宏任务 setTimeout(() => {...}) 最后一个 setTimeout.


### 10. 总结

这里我学到了，浏览器 javascript 执行的机制

顺序执行，遇到异步任务先放在列队中
执行完成以后进入循环 => 查询微任务，执行所有微任务 => 执行一个宏任务 => 执行所有微任务 => 执行一个宏任务(循环)

面试问这个再也没问题了。

### 11. 引用

- [event-loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [异步任务(微任务、宏任务)，你学会了吗？还有4道面试题](https://juejin.cn/post/6844904087163502605)
