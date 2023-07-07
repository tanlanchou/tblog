---
title: fetch 简单介绍
date: 2023-07-07 12:27:01
tags: 
    - fetch
    - web
    - javascript
---


### 01. 什么是 fetch

https://developer.mozilla.org/zh-CN/docs/Web/API/fetch

https://www.ruanyifeng.com/blog/2020/12/fetch-tutorial.html

> fetch()是 XMLHttpRequest 的升级版，用于在 JavaScript 脚本里面发出 HTTP 请求。浏览器原生提供这个对象

https://caniuse.com/?search=fetch 现代浏览器都支持.

>（1）fetch()使用 Promise，不使用回调函数，因此大大简化了写法，写起来更简洁。
>
>（2）fetch()采用模块化设计，API 分散在多个对象上（Response 对象、Request 对象、Headers 对象），更合理一些；相比之下，XMLHttpRequest 的 API 设计并不是很好，输入、输出、状态都在同一个接口管理，容易写出非常混乱的代码。
>
>（3）fetch()通过数据流（Stream 对象）处理数据，可以分块读取，有利于提高网站性能表现，减少内存占用，对于请求大文件或者网速慢的场景相当有用。XMLHTTPRequest 对象不支持数据流，所有的数据必须放在缓存里，不支持分块读取，必须等待全部拿到后，再一次性吐出来


原生支持 promise.

```js
return fetch(myUrl)
    .then(res => {
        if (res.status === 200) {
            return res.blob();
        }
        else return Promise.reject();
    })
    .then(blob => {
        if (/image/.test(blob.type)) return URL.createObjectURL(blob);
        else return Promise.reject();
    })
    .then((url) => {
        target.blob = url;
    })
    .catch(() => {
        target.showError();
        this.active = false;
        throw new Error("URL不正确或MIME类型不正确");
    });
```

这是我之前获取图片的一个例子，是通过 res获取二进制文件的例子。

理论上到这里就可以开始基本的使用了，剩下的就是大概的知道有什么属性，api，用的时候查。

### 02. Response 

https://developer.mozilla.org/zh-CN/docs/Web/API/Response

**数据类型**

```js
Response.arrayBuffer()  //二进制 流媒体
Response.blob()  //二进制 blob，图片之类
Response.formData() //表单
Response.json()
Response.text()
Response.clone()
```

这里需要注意的是 

```js
let result = Response.text()
let result = Response.json() //error
```

所以需要先 `clone()`

**状态码和基本属性**

```js
Response.ok 200 < Response.status < 299
Response.status
Response.statusText //字符串，ok
Response.type //请求类型
Response.url
Response.redirected //请求是否发生过跳转
Response.redirect() //跳转
```

**body**

```js
Response.body //ReadableStream
Response.bodyUsed //bodyUsed 是 Response mixin 中的一个只读属性。用以表示该 body 是否被使用过。
```

https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStream

```js
fetch('https://api.example.com/data') // 发起网络请求
  .then(response => {
    const reader = response.body.getReader(); // 获取 ReadableStreamDefaultReader 对象

    function readStream() {
      return reader.read() // 逐块读取数据
        .then(({ done, value }) => {
          if (done) {
            console.log('数据读取完毕');
            return;
          }

          // 处理读取的数据
          console.log('读取数据块:', value);

          // 继续读取下一个数据块
          return readStream();
        })
        .catch(error => {
          console.error('读取数据时发生错误:', error);
        });
    }

    return readStream(); // 开始读取数据流
  })
  .catch(error => {
    console.error('请求数据时发生错误:', error);
  });
```

**Response.headers**

https://developer.mozilla.org/zh-CN/docs/Web/API/Headers


以上就是 response 大概参数，重点其实是类型获取和body

### 03. options

https://developer.mozilla.org/zh-CN/docs/Web/API/fetch

- method: 请求使用的方法，如 GET、POST。
- headers: 请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
- body: 请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
- mode: 请求的模式，如 cors、no-cors 或者 same-origin。
- credentials: 请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie，必须提供这个选项，从 Chrome 50 开始，这个属性也可以接受 FederatedCredential (en-US) 实例或是一个 PasswordCredential (en-US) 实例。
- cache: 请求的 cache 模式：default、 no-store、 reload 、 no-cache、 force-cache 或者 only-if-cached。
- redirect: 可用的 redirect 模式：follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误），或者 manual (手动处理重定向)。在 Chrome 中默认使用 follow（Chrome 47 之前的默认值是 manual）。
- referrer: 一个 USVString 可以是 no-referrer、client 或一个 URL。默认是 client。
- referrerPolicy: 指定了 HTTP 头部 referer 字段的值。可能为以下值之一：no-referrer、 no-referrer-when-downgrade、origin、origin-when-cross-origin、 unsafe-url。
- integrity: 包括请求的 subresource integrity 值（例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
- signal: AbortController
- keepalive



### 04. 终止 fetch

https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController

他不仅仅可以终止 fetch，还可以终止 xmlHttpRequest.

```js
let controller = new AbortController();
let signal = controller.signal;

fetch(url, {
  signal: controller.signal
});

signal.addEventListener('abort',
  () => console.log('abort!')
);

controller.abort(); // 取消

console.log(signal.aborted); // true
```

**fetch**

```js
let controller = new AbortController();
setTimeout(() => controller.abort(), 1000);

try {
  let response = await fetch('/long-operation', {
    signal: controller.signal
  });
} catch(err) {
  if (err.name == 'AbortError') {
    console.log('Aborted!');
  } else {
    throw err;
  }
}
```

### 总结。

其实差不多，主要语法和用法上的差别。fetch原生 原生Promise 链式语法，其他更大区别，在于流式数据处理，response.body
