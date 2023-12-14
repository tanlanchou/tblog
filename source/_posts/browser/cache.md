---
title: 浏览器缓存大赏.
date: 2023-12-14 14:35:00
tags: 
  - browser
  - cache
  - Cache-Control
  - Expires
---



### 01. 强制缓存

https://blog.csdn.net/weixin_44765930/article/details/129819711

这篇文章详细解释了什么是强制缓存.

> Cache-Control
> 
> Cache-Control是HTTP/1.1中定义的缓存控制字段，常见的取值如下：
> public：响应可以被任意缓存（包括客户端和代理服务器）缓存。
> private：响应只能被客户端缓存，不能被代理服务器缓存。
> max-age：指定缓存的有效期，单位为秒。
> no-cache：表示需要协商缓存，浏览器每次都需要向服务器发送请求，确认资源是否有更新。
> no-store：禁止缓存，每次都需要向服务器发送请求获取最新资源。
> 
> Expires
> 
> Expires是HTTP/1.0中定义的缓存控制字段，它表示资源的过期时间，是一个GMT格式的日期字符串。当浏览器发送请求时，会比较当前时间和Expires字段的值，如果当前时间在过期时间之前，就直接从缓存中获取资源。

这里说一下他没说到的点.

max-age 设置为0, 也表示不缓存.

强制缓存优先级 > 协商缓存, 但是强制缓存内部也是有优先级的

```
Cache-Control: max-age=3600
Expires: Wed, 14 Dec 2023 12:00:00 GMT
```

`Cache-Control` 中的 max-age 指令将优先于 `Expires`

在向下兼容的这种考虑下, 是需要使用 `Expires` 的.

### 02. 破坏缓存

当设置了强制缓存, 但是文件更新了, 怎么办?

本地测试, **ctrl + f5** 或者直接清理浏览器缓存, **f12** 强制不用缓存

开发端, 老办法是用版本号

```html
<link rel="stylesheet" href="/path/to/your/resource/style.css?version=123456">
```

变化就会强制更新, 现代的框架, vue, react, ag 每次更新其实都是会重新打包, 都有完全不同的hash, 自然也就不存在缓存问题了.

### 03. 协商缓存

协商缓存的好处在于可以实时获取最新的资源, 降低了服务器压力(没有强制缓存多), 又没有缓存的压力.

> Last-Modified: 服务器通过 Last-Modified 头部返回资源的最后修改时间。浏览器在后续请求中可以使用 If-Modified-Since 头部将上一次收到的最后修改时间发送给服务器。服务器根据这个时间判断资源是否有更新。
>
> ETag 是服务器生成的唯一标识符，用于表示资源的版本。浏览器在后续请求中可以使用 If-None-Match 头部将上一次收到的 ETag 发送给服务器。服务器根据这个标识判断资源是否有更新。
>

换句话说, 如果服务器资源没有变化, 就发一次请求, 但是这次请求只是做一个对比, 减少了请求的压力.

如果服务器资源有变化, 就发两次请求, 第一次请求返回304, 第二次请求返回最新资源.

```
Cache-Control: no-cache
Last-Modified: Wed, 14 Dec 2023 12:00:00 GMT
```
根据 Last-Modified 或者 ETag 和服务器做对比

### 04. 我们应该怎么设置缓存.

这里就要区分 API 还是静态资源.

API 一般是不缓存的, 因为它是有状态的, 所以每次请求都需要重新获取数据.

静态资源缓存, 现在也和后端无关, 因为前端是一个独立项目.

只有某些特殊的资源, 比如 CDN, 一些特殊的固定 css, js 这些资源是由后端主动缓存

拿 express 举例子

https://stackoverflow.com/questions/42418503/how-do-i-return-304-unmodified-status-with-express-js

```javascript
app.use('/static/styles.css', (req, res, next) => {
  // 设置 Cache-Control 头，表示缓存有效时间为1小时
  res.setHeader('Cache-Control', 'max-age=3600');

  // 设置 Expires 头，表示资源过期时间为当前时间 + 1小时
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  res.setHeader('Expires', expires.toUTCString());
});
```

然后每次再检查. 简单的方式是些中间件.

现在正常大部分情况其实都是现代js框架, 一般都是用 docker 内部就是 nginx 做服务, 那么就需要前端在 ngixn.conf 中设置.

```nginx
location ~* \.css$ {
    add_header Cache-Control "max-age=3600";
    add_header Expires "Thu, 01 Jan 1970 00:00:01 GMT";

    if ($uri ~* /special\.css) {
        add_header Cache-Control "no-store";
    }
}
```

下面是其他人的设置

```nginx
map $sent_http_content_type $expires {
    default                    off;
    #text/html                  epoch; # 不缓存
    text/css                   30d; # 缓存30天，长时缓存可以设置为max
    application/javascript     30d;
    ~image/                    30d;  
}
```

来实现这些设置.

### 05. Web Storage

这个其实就是 localstorage, sessionstorage 这两种东西.

可以简单的存一点儿东西, 比如 token, 虽然他比 cookie 大. 但是大的不多, 一般不超过 5M.

存点关键信息ok, 但是如果要存大量数据, 就不合适了.

他的好处在于浏览器支持广泛, 设置IE8都支持. 使用和设置简单

https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

两者区别在于, sessionStorage 浏览器关闭的时候会清除. localStorage 则是永久存储, 除非手动删除.

### 06. indexDB

之前我写过一个 

https://tanlanchou.github.io/tblog/2023/11/02/%5BQ103%5DIndexDB_Base/

https://github.com/tanlanchou/indexdb_book_store

现代浏览器基本上都支持了, 兼容性我没有所有都试过, 如果有要么自己封装, 别人封装应该也有.

好处是大, 根据你硬盘来算的, 基本不用考虑大小.

但是操作是真的不舒服, 不支持sql. 写个分页真的给我累瘫了..

总体没什么毛病.

### 07. service worker

> Service Worker 是一个在 Web 应用程序背后运行的脚本，它可以拦截和处理网络请求、管理缓存以及推送通知。Service Worker 被设计为一个独立的线程，与网页主线程分离，因此可以在后台执行任务而不阻塞用户界面。
> 
> 1. 不能访问／操作dom
> 2. 会自动休眠，不会随浏览器关闭所失效(必须手动卸载)
> 3. 离线缓存内容开发者可控
> 4. 必须在https或者localhost下使用
> 5. 所有的api都基于promise

https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

他可以拦截请求, 并且设置缓存.

serviceWorker 我了解的比较少, 反正要搞 pwa, 后面学习一下

### 08. 总结

木有.