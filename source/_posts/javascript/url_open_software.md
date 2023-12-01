---
title: url 通过协议启动应用程序
date: 2023-12-01 11:12
tags: 
    - web
    - javascript
---

# 01. url 如何关联到应用程序?

做过html肯定都知道下面这段代码

```html
<a href="mailto:xxx@xxx.com">发送邮件</a>
```

通过`href`属性，我们可以指定一个url，当用户点击这个链接的时候，浏览器就会打开一个新的浏览器窗口，并且打开一个新的邮件客户端，并将邮件地址填入其中。

那么，url 如何关联到应用程序呢？

# 02. 协议怎么来的?

这里需要区分5个不同的平台, 也就是 windows, mac, linux, android, ios

1. windows 在注册表中注册你的自定义 URL 协议，指定应用程序的处理器
2. mac 在应用程序的 Info.plist 文件中注册自定义 URL 协议，指定应用程序的处理器
3. linux 通过注册 MIME 类型和关联它们的处理程序来实现
4. android AndroidManifest.xml 文件, 注册 <intent-filter>
5. ios 同样Info.plist

也就是说,你的程序在安装的时候,需要注册一个协议,然后在程序中指定这个协议,当用户点击这个协议的时候,就会打开你的程序.

# 03. html 如何知道协议是否打开?

无法知道, 至少没有一个通用的接口

```html
<a href="mailto:xxx@xxx.com">发送邮件</a>
```

是没有返回值的, 网上查询有一个方案.

https://github.com/ismailhabib/custom-protocol-detection

他的方案其实是通过 hack 方式.

> Firefox: try to open the handler in a hidden iframe and catch exception if the custom protocol is not available.
> 
> Chrome: using window onBlur to detect whether the focus is stolen from the browser. When the focus is stolen, it assumes that the custom protocol launches external app and therefore it exists.
> 
> IEs and Edge in Win 8/Win 10: the cleanest solution. IEs and Edge in Windows 8 and Windows 10 does provide an API to check the existence of custom protocol handlers.
> 
> Other IEs: various different implementation. Worth to notice that even the same IE version might have a different behavior (I suspect due to different commit number). It means that for these IEs, the implementation is the least reliable.

他代码最近更新的也是5年前的. 而且更新的是 package.json.

但是我测试了国内使用的大部分浏览器的最新版本, 居然是可用的(包括最新版本chrome). 并不像我查询的其他文章说不可用.

还能说使用风险还是很大.

我也看了百度盘的方案, 方案就是协议里传参数, 都和服务器进行通信.

其实百度盘页面点下载, 打开F12 其实就知道了.

### 04. 总结

最优情况还是使用百度的方案, 最稳定, 有就一定有, 不怕浏览器兼容性问题.

前提是需要软件是你自己的, 如果不是你自己的, 就只能看别人是否实现这一套或者你加一个启动器..