---
title: javascript 异步编程有哪些方式？
date: 2023-07-03 21:00:01
tags: 
    - web
    - javascript
description: 了解和介绍一下 javascript 有哪些编程的方式
---

这里是讨论编程方式。

javascript 实现异步，本质上还是依靠

1. setTimeout
2. Promise
3. async/await
4. XMLHttpRequest
5. Web Workers
6. EventListener

这几种方式去异步。

### 01, 回调

回调是一种最基础的方式。

```js
setTimtOut(fn, time)
```

EventListener 也是靠回调解决

```js
button.addEventListener('click', handleClick);

function handleClick(event) {
  console.log('点击了按钮');
}
```

### 02. Thunk

可以理解为回调的变种，或者工厂, 闭包

```js
function thunk(url) {
    return function(cb) {
        //请求
        //cb
    }
}
```

这种方式的好处在于，分割参数

```js
let requestA = thunk(url);
requestA(() => {})
```

你可以直接调用 `requestA`, 相当于封装了一层。

### 03. 事件驱动

就是开头提到的 EventListener。

这个涉及到 javascript 一个基础概念， JavaScript 是一种事件驱动的语言。

> 它通过事件机制来响应用户的操作和系统的变化。
> 事件可以是用户操作，如鼠标点击、键盘输入、窗口滚动等，也可以是系统变化，如网页加载完成、定时器到期等。

DOM 事件和自定义事件，它们都是异步执行的。

```js
const button = document.getElementById('myButton');
button.addEventListener('click', function(event) {
  console.log('按钮被点击了！', event);
});

const myEvent = new Event('myEvent');
document.dispatchEvent(myEvent);
```

但是如果是有我们自己去触发，就是同步执行，比如通过 `dispatchEvent` 触发。

### 04. 观察者模式

```js
// 定义观察者对象
var observer = {
  subscribers: [],
  subscribe: function(callback) {
    this.subscribers.push(callback);
  },
  unsubscribe: function(callback) {
    var index = this.subscribers.indexOf(callback);
    if (index !== -1) {
      this.subscribers.splice(index, 1);
    }
  },
  notify: function(data) {
    this.subscribers.forEach(function(subscriber) {
      setTimeout(function() {
        subscriber(data);
      }, 0);
    });
  }
};

// 定义事件
var event = {
  name: 'dataUpdated',
  data: { message: 'Hello world!' }
};

// 订阅事件
observer.subscribe(function(data) {
  console.log('Received data:', data);
});

// 触发事件
observer.notify(event.data);
```

例子中这个异步其实没有意义，主要是应该在 notify 通知之前来异步，比如接收到消息之类的

但是模式是这么一个模式

### 05. promise

异步编程前端目前来说最佳解决方案。

### 06. async/await

也是 Prmoise，只是语法糖。

### 07. yield

因为可以暂停的机制，可以很好的批量触发异步任务

```js
function* reuslts(urls) {
    for(let url of urls) {
        yield return await request(url);
    }
}

for(let r of results) {
    console.log(r);
}
```

这里需要知道一个概念协程

> 协程（Coroutine）是一种计算机程序组件，它可以在执行过程中暂停、恢复和传递控制权，从而支持多任务协作并发编程。简单来说，协程是一种更轻量级的线程，它可以像线程一样并发执行，但相比线程占用更少的资源，并且可以更方便地实现协作式多任务处理。
>
> 与线程不同，协程并不是由操作系统内核管理的，而是由应用程序自行管理。协程通常由一个生成器函数（Generator Function）和一个调度器（Scheduler）组成，生成器函数用于定义协程的执行流程，调度器用于控制协程的调度和协作。
> 
> 协程通常具有以下特点：
> 
> 1. 协程可以在执行过程中暂停和恢复执行，这种操作通常称为挂起和恢复。
> 2. 协程可以保存和恢复自己的状态，包括变量、指令指针和调用栈等。
> 3. 协程通常使用协作式调度，即协程之间协作执行，不需要像线程那样通过操作系统内核进行调度。
> 4. 协程通常可以实现轻量级的多任务处理，支持更高效的并发编程。

