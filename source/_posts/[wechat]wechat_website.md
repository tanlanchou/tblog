---
title: 微信公众号网页踩坑？
date: 2023-09-01 21:00:01
tags: 
    - 微信
    - 公众号
    - 环境
description: 了解和介绍一下 javascript 有哪些编程的方式
---

### 01. 开发者工具提示未关注该测试号？

https://learnku.com/laravel/t/7831/the-developer-tooltip-does-not-pay-attention-to-the-test-number

虽然是五年前的回答, 但是能解决问题

扫码关注即可.

### 02. 如果获取 openId

首先你需要知道 openId 和 unionid 的区别

网上随意一篇文章就能解释清楚

https://blog.csdn.net/naocan10211050/article/details/123865184

一个多应用唯一，一个单应用唯一。

如何获取，流程大致是
1. 用户关注公众号
2. 用户点击网页授权
3. 服务器获取到 code
4. 服务器通过 code 获取 openId

至于具体代码，有很多sdk，不想自己写就用sdk就好。

### 03. 本地调试

首先你需要有 appId 和 appSecret，其次你关注了测试号，是开发者。

然后在

![Alt text](/img/528c7feafa5a997a4d00099ac5926804.png)

这个位置输入你的测试地址，可以是本地地址，在测试的时候。

如果需要调试服务端，比如你已经部署上去了，想调试，但是服务又必须登录。

可以改host或者使用nginx。

我一般用host，然后在微信开发者工具中调试。

### 04. 返回。

很多时候做网页上的东西，不设置返回。

但是手机上必须要，不管是小程序还是网页。

经常找不到返回只能靠手机的返回快捷键，导致小程序或者网页直接退出。

### 05. 总结

目前大概这么多，这方面经验不算丰富。
