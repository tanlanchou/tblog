---
title: sse EventSource 空格
date: 2024-12-04 22:47:01
tags:
    - eventsource
    - javascript
---

不知道基本的信息的可以看 https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html

本质上是一种长链接，所以是服务器单向浏览器（或者说客户端）的一种方式

但是这次我纠结的是 `EventSource`

## 基本情况

写了一个超简单的接收

```javascript
        const fullUrl = `${myUrl}?${params.toString()}`;
        let eventSource = new EventSource(fullUrl);
        eventSource.onopen = () => {};
        eventSource.onmessage = async (event) => {
          if (event.data === "[DONE]") {
            this.aiReturnDataLoading = false;
            eventSource.close();
            eventSource = null;
          } else {
            this.aiReturnData += event.data;
            this.getBottom();
          }
        };
        eventSource.onerror = (error) => {

        };
```

传的是markdown，但是发现markdown是乱的，就是有些不解析。

打出来以后发现是后端没传空格

```markdown
-aaaa
```

没有空格就没法解析。

后端直接用了curl给我打出来了，有空格

```markdown
data: \n
```

`\n` 前面确实有空格，但是为什么我这里只能收到一个空字符串？

于是查了下文档也就是阮一峰的哪个

```markdown
data:  message\n\n
```

也就是说 `message` 前面是有空格的, 于是自己写了一个 **sse** 的服务

```javascript
app.get("/stream", (req, res) => {
  // 设置响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const message =
    "djslkadjlaksjdlkasjdlkasjdlkasjdlkasjdlsajlkjdlakjsdlajldkjaslkd";
  let index = 0;

  const interval = setInterval(() => {
    if (index < message.length) {
      const char = message.charAt(index);
      res.write(`data: ${char} \n\n`);
      res.write(`data:  \n\n`);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 100);

  req.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});
```

反复修改了 res.write 的空格，然后前端调用

```javascript
    const eventSource = new EventSource('/stream');
    eventSource.onmessage = function(event) {
      console.log(event.data)
      console.log(event.data.length)
    };
    eventSource.onerror = function(err) {
      console.error('EventSource failed:', err);
    };
```

证明了一个事实

```javascript
data:空格message\n\n
```

必须要有空格，后端给我看了下 **java** 源码，确实没有 `append` 空格, 不是很理解，不过可以手动了空格以后问题解决

为了严谨我还是查了下官方文档

https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events

在 **9.2.6 Interpreting an event stream 中**

> Collect the characters on the line after the first U+003A COLON character (:), and let be that string. If starts with a U+0020 SPACE character, remove it from .valuevaluevalue
> 

也就是说前面凭借经验的判断还是有问题。

也就是说，规则是第一个空格会删除，恰好这边后端传过来一个空格，那么就被删除了，就少了一个空格

## 最后的解决方案

因为直接硬加空格可能导致其他问题，所以最后改成传base64搞定。

不过base64转中文GBK编码，最简单还是用