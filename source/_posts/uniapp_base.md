---
title: uni-app 简介
date: 2023-07-18 22:02:01
tags: 
    - vue
    - 多端
    - uniapp
---

### 过文档

[页面简介](https://uniapp.dcloud.net.cn/tutorial/page.html#%E8%B7%AF%E7%94%B1%E8%B7%B3%E8%BD%AC) 主要介绍了

- 页面生命周期，包含 **uni-app** 生命周期和 **Vue** 生命周期
- 页面调用接口 主要获取页面实例
- 页面通讯 主要是通过事件通信
- 路由跳转的方法

在最后说了一下 **nvue 开发与 vue 开发的常见区别**

https://uniapp.dcloud.net.cn/tutorial/nvue-outline.html
https://www.zhihu.com/question/405786306

[引用](https://uniapp.dcloud.net.cn/tutorial/page-component.html)

这一章节主要告诉你如何引用组件，js，css，以及插件，建议按照原生方式去写。

[js 语法](https://uniapp.dcloud.net.cn/tutorial/syntax-js.html) 

可以理解为支持 ES6 标准

[CSS 支持](https://uniapp.dcloud.net.cn/tutorial/syntax-css.html) 

[UTS介绍](https://uniapp.dcloud.net.cn/tutorial/syntax-uts.html) 

这个还不了解，大意是 uts 可以编译成原生的app源码，比如说安卓 Kotlin，iso swift，效率高

[编译器](https://uniapp.dcloud.net.cn/tutorial/compiler.html)

编译器主要是想要讲，如果根据环境变量，以及 **#ifdef** 来有条件的变异，来支持某些平台的特性。

[跨域](https://uniapp.dcloud.net.cn/tutorial/CORS.html)

[宽屏适配](https://uniapp.dcloud.net.cn/tutorial/adapt.html)

> 以目前手机屏幕为主window，在左右上，可新扩展 leftWindow、rightWindow、topWindow，这些区域可设定在一定屏幕宽度范围自动出现或消失。这些区域各自独立，切换页面支持在各自的window内刷新，而不是整屏刷新。

这个还不是很明白

[pages.json 页面路由](https://uniapp.dcloud.net.cn/collocation/pages.html)

> pages.json 文件用来对 uni-app 进行全局配置，决定页面文件的路径、窗口样式、原生的导航栏、底部的原生tabbar 等。

[manifest.json 应用配置](https://uniapp.dcloud.net.cn/collocation/manifest.html#)

其他用到再看。


