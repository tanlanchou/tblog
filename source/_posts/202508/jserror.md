---
title: javascript 错误
date: 2025-08-11 23:30:22
tags: 
    - 前端
    - error
    - javascript
---

# javascript 错误

### 01. 基本的捕获

    // 同步异常
    window.addEventListener('error',(error)=>{ // 分析错误->上报 
    })
    // 异步异常
    window.addEventListener('unhandledrejection',(rejection)=>{
    // 分析错误->上报
    })

> error => ErrorEvent

[ErrorEvent - Web API | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/ErrorEvent)

> rejection

https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent

首先就是
    window.addEventListener('error',(error)=>{})

他主要捕获什么？

1. 同步运行的错误, 就是同步运行的所有错误，只要你没有 `try/catch`

2. 异步任务回调中的异常, settimeout 之类的的，那种回调函数都是，`document.body.addEventListener('click', ()=> {}` 这种也是。

3. `<img>`、`<script>`、`<link>`、`<video>`、`<audio>`、`<iframe>` 等资源加载失败，也会触发 `error`。

4. 跨域脚本运行时错误

    window.addEventListener('unhandledrejection',(rejection)=>{})

`unhandledrejection` 他其实是专门去捕获 `Promise` 的错误，比如你们有 `catch` 的情况。或者 `await` 之类的没有 `try/catch` 的情况

他主要是给异步错误进行兜底的。

### 02. 他们不能干什么？

1. 当用户自行 try/catch 就不能捕获, 或者 `Promise.catch` 也是一样

2. Web Worker 是不能捕获的

3. iframe 的错误无法捕获

4. 如果是语法错误，也是无法捕获

5. 部分网络错误

这里分很多种情况，可能需要代码进行约定

##### 02.01 当用户自行 try/catch 就不能捕获, 或者 `Promise.catch` 也是一样

这个因为错误已经捕获了，所以认为你已经处理了。

所以是不会冒泡到
        window.addEventListener('error',(error)=>{})

如果想要继续给统一的 `error` 处理, 需要重新抛出事件
    try {
        ...
    }
    catch(ex) {
        throw ex;
        throw new Exp...
    }

这样就能统一的做记录了

在 `Promise` 种也是一样，在 `catch` 以后要重新抛出。

在这种思路之下，`catch` 中是不能右返回值的，只能处理异常的提示信息

##### 02.02 Web Worker 是不能捕获的

他需要自己去捕获。
    const worker = new Worker('worker.js');

    worker.addEventListener('error', (event) => {
      console.error('主线程捕获 Worker 错误:', event.message, event.filename, event.lineno);
    });

    worker.addEventListener('messageerror', (event) => {
      console.error('主线程收到无法反序列化的消息:', event.data);
    });

`webworker` 的内部同理，如果自行 `catch`, 就不会冒泡。这种情况最好是封装一层 `worker`. 统一调用后就自己有日志了。

##### 02.03 iframe 的错误无法捕获

理论上其实可以捕获，只是要专门写代码，前提是同源页面
    const iframe = document.querySelector('iframe');

    iframe.contentWindow.addEventListener('error', (event) => {
      console.log('iframe 同源错误:', event.message, event.filename, event.lineno);
    });

    iframe.contentWindow.addEventListener('unhandledrejection', (event) => {
      console.log('iframe 同源 Promise 错误:', event.reason);
    });

或者通过 `postmessage`
    window.addEventListener('error', e => {
      parent.postMessage({ type: 'iframe-error', message: e.message, filename: e.filename, lineno: e.lineno }, '*');
    });
    window.addEventListener('unhandledrejection', e => {
      parent.postMessage({ type: 'iframe-unhandledrejection', reason: e.reason }, '*');
    });

类似这种。不同源的就不要想了。

##### 02.04 语法解析错误

这个目前不知道怎么捕获。。估计要特殊的写法，js引擎会直接报错。

##### 02.05 fetch，XHR

`XHR `是肯定不会报错的，在`onError`里面自己写吧，或者你非得用 `XHR`，那建议自己封装一层。

`fetch` 和 `Promise` 一样，在没`catch` 的情况下，会触发 `unhandledrejection` 但是 `unhandledrejection` 是集中处理错的地方。还是自己封装吧，或者用第三方的。

### 03. 分类

| 分类             | 典型来源                            | 区分方法                                                      |
| -------------- | ------------------------------- | --------------------------------------------------------- |
| **JS运行时错误**    | `ReferenceError`, `TypeError` 等 | 来自 `window.onerror`，`event.error` 是 Error 对象              |
| **资源加载错误**     | 图片、CSS、JS 404                   | 来自 `window.onerror` 且 `event.target` 是 DOM 元素（非 `window`） |
| **Promise 异常** | async/await 报错、fetch 无网络等       | 来自 `unhandledrejection`，`event.reason` 是 Error 或其他类型      |
| **网络请求错误**     | fetch、XHR 超时、4xx/5xx            | 在请求封装里 `.catch()`，或根据响应码判断                                |
| **业务逻辑异常**     | 后端返回业务错误码                       | 接口响应成功但 `code != 0`，业务层判断                                 |
| **跨域/安全错误**    | CORS 拒绝、Mixed Content           | fetch 报错 reason 含 `TypeError` 且 message 提示跨域              |

错误也需要分级

| 等级         | 特征        | 影响范围         | 处理优先级       | 举例                                  |
| ---------- | --------- | ------------ | ----------- | ----------------------------------- |
| **P0（致命）** | 核心功能完全不可用 | 所有用户 / 大部分用户 | 立即上报 & 立即处理 | JS语法错误导致页面空白、主入口文件 404、fetch 核心接口失败 |
| **P1（高）**  | 核心功能部分不可用 | 较多用户         | 快速修复 & 优先上报 | 支付流程异常、重要按钮点击无反应                    |
| **P2（中）**  | 非核心功能不可用  | 部分用户         | 正常排期修复      | 评论区加载失败、个人头像上传失败                    |
| **P3（低）**  | 体验问题、兼容问题 | 少数用户 / 特定环境  | 低优先级处理      | 样式错位、低版本浏览器兼容警告                     |

这种具体要怎么判断就需要去细分了。

### 04. 上报

去重 / 合并

* **去重**：相同 `message + file + line + col + stack` 的错误只记录一次（可加上出现次数计数）。

* **合并**：比如一分钟内的相同错误只上报一次，并统计重复次数。

本地暂存（LocalStorage / IndexedDB）

* 避免用户刷新或关闭页面时丢失错误数据。

* 在网络恢复或下次启动时再批量上报

延迟上报。收集到一定条数，并且还可以判断网络状况，离线也可以收集错误。PWA之类的

比如P0的致命错误，可能就需要立刻上报。
