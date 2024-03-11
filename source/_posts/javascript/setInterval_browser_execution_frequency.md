---
title: setInterval 浏览器执行频率
date: 2024-03-11 16:36
tags: 
    - web
    - javascript
---

在写一个东西的时候需要在某个时间定时执行一些任务, 在浏览器.

东西很快就写好了.

```tsx
setInterval(() => { 
	console.log(new Date());
	//todo something
}, 1000)
```

结果发现一些问题, `setInterval` 在5分钟后浏览器会降低js定时器的执行频率（1分钟一次）

于是不能准确的执行我想要做的事情, 具体详情可以看下面文章

[从 Chrome 88 开始，系统会对链接的 JS 计时器施加严格的节流限制  |  Blog  |  Chrome for Developers](https://developer.chrome.com/blog/timer-throttling-in-chrome-88?hl=zh-cn)

[Chrome JavaScript timer throttling: Google's tests show it saves up to 2 hours' battery life](https://www.zdnet.com/article/chrome-javascript-timer-throttling-googles-tests-show-it-saves-up-to-2-hours-battery-life/)

经过我查询, 需要解决问题有3个办法.

1. settimeout
2. webworker
3. 浏览器解决

一个一个看. 

### 01. settimeout

`settimeout` 解决就是不通过 `setInterval` 每次执行, 而是 `settimeout` 执行完成, 再启动一个 `settimeout` , 从而避过这个问题

我从一开始就觉得这个方案解决不了, 因为浏览器全局设置导致了这个问题, 不会因为你重新设置避过

```tsx
function startOrder() {
  setTimeout(() => {
      console.log(new Date().toTimeString().substring(0, 8))
      startOrder();
  }, 500)
}
startOrder();
  
14:02:42
14:03:24
14:04:24
14:05:24
14:06:24
```

但是这个可以解决系统过于繁忙导致的加速执行的问题.

比如说原计划 

1. 500毫秒执行一次

但是某一次执行太久, 导致阻塞, 执行了600毫秒. 下一次执行实在1秒处. 实际上两次执行的间隔是400毫秒.

可以使用 `settimeout` 这种方式来保证每次执行都是 500毫秒.

但是他也无法解决整个浏览器的设置问题, 也就是5分钟后 1分钟执行一次的问题

### 02. webworker

webworker 能奏效的原因是因为他不受限制, 也就是浏览器没有给他限制. 所以直接把 setimeout, setInterval 写在 webworker 中. 从而绕过限制.

[使用 Web Workers - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)

这种方式明确有效. 如果不想自己写

https://github.com/ctubio/HackTimer_fork

### 03. 浏览器设置

来源于下面这个链接

[Chrome JavaScript timer throttling: Google's tests show it saves up to 2 hours' battery life](https://www.zdnet.com/article/chrome-javascript-timer-throttling-googles-tests-show-it-saves-up-to-2-hours-battery-life/)

但是我没有测试 因为通过这种方式绕过去实际操作性太小了.

你总不可能让所有客户都这样搞吧.