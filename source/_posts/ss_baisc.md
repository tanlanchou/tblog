---
title: 微信小程序入门
date: 2023-07-13 13:40:51
tags: 
    - 微信小程序
---


小程序入门。


### 真入门

小程序 [开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/) ，[工具下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

最好还是跟着他的工具来。

![alt text](\img\2023-07-10-164309.png)

[全局配置 app.json](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)，
[sitemap](https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html)

js，wxml，wxss，json。他主要的四个文件。

[wxs文档](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/)
[WXML 语法参考 ](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/)
[小程序框架 /视图层 /WXML]https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/)

很疑惑, 有点类似于 Vue 模版语法，但是介绍的又很不全。

比如我想写一个标题，h1. 试了下似乎没有效果。

在看文档的过程中 

> 往往写 HTML 的时候，经常会用到的标签是 div, p, span，开发者在写一个页面的时候可以根据这些基础的标签组合出不一样的组件，例如日历、弹窗等等。换个思路，既然大家都需要这些组件，为什么我们不能把这些常用的组件包装起来，大大提高我们的开发效率。

不知道我是否可以理解为，他们这些都作为组件提供？后面试了一试大概是这样。

https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/

脚本介绍也不是很全，查询了一下，他其实只支持es5，能写es6，因为用 babel  转了。

最开始看的时候，我连他是否支持 settimeout 都不知道。

[配置](https://developers.weixin.qq.com/miniprogram/dev/framework/config.html)

- 全局配置 小程序根目录下的 app.json 文件用来对微信小程序进行全局配置，决定页面文件的路径、窗口表现、设置网络超时时间、设置多 tab 等。
- 页面配置 每一个小程序页面也可以使用同名 .json 文件来对本页面的窗口表现进行配置，页面中配置项会覆盖 app.json 的 window 中相同的配置项。
- sitemap 配置

sitemap 配置类似于以前网页seo用的东西

### 02. 双向绑定？

在介绍里面说了一个东西, [介绍](https://developers.weixin.qq.com/miniprogram/dev/framework/MINA.html)

> 框架的核心是一个响应的数据绑定系统，可以让数据与视图非常简单地保持同步。当做数据修改的时候，只需要在逻辑层修改数据，视图层就会做相应的更新。

这里我就开始好奇了，他的分层是直接从 webview => (逻辑层，视图层)？ 还是中间还有一层？是原生就实现了？

也就是说 **微信小程序是如何实现双向绑定的?**

我查了半天也没有查到小程序框架源码在哪里，有分析的也是逆向出来的, 这个也太麻烦了。


### 03. 场景值

https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html

在页面中你能拿到的东西

> 场景值用来描述用户进入小程序的路径

### 04. 逻辑层


https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/

微信代码分为视图层和逻辑层。

> 逻辑层将数据进行处理后发送给视图层，同时接受视图层的事件反馈。
> 
> 开发者写的所有代码最终将会打包成一份 JavaScript 文件，并在小程序启动的时候运行，直到小程序销毁。这一行为类似 ServiceWorker，所以逻辑层也称之为 App Service。

他这里讲了很多关于生命周期上的东西。

![alt text](\img\page-lifecycle.2e646c86.png)

- [api](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [app 钩子](https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html)
- [page 钩子](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)
- [路由](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html)


### 05. 视图层 View

> 框架的视图层由 WXML 与 WXSS 编写，由组件来进行展示。
> 将逻辑层的数据反映成视图，同时将视图层的事件发送给逻辑层。
> WXML(WeiXin Markup language) 用于描述页面的结构。
> WXS(WeiXin Script) 是小程序的一套脚本语言，结合 WXML，可以构建出页面的结构。
> WXSS(WeiXin Style Sheet) 用于描述页面的样式。
> 组件(Component)是视图的基本组成单元。

[WXML基本语法](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/)
[WXSS基本语法](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html)
[WXS基本语法](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxs/)

**WXSS** 中提到了一个概念，是做移动端开发必须要知道的。

> rpx（responsive pixel）: 可以根据屏幕宽度进行自适应。规定屏幕宽为750rpx。如在 iPhone6 上，屏幕宽度为375px，共有750个物理像素，则750rpx = 375px = 750物理像素，1rpx = 0.5px = 1物理像素。

我比较少参与移动端开发，对于这个的理解就是。

屏幕的大小以及分辨率，不同设备是完全不一样的。屏幕大像素小，屏幕小像素大，都可能造成极端情况。所以这个是需要做自适应处理的。

但是平板和手机，或者说电脑端差异过大，简单的使用百分比自适应可能不能达到理想的效果，还是需要更特殊的处理。

比如不同分辨率下的完全不同的样式，b站在平板就推出了完全不同的客户端来解决问题。

当然 微信小程序可能使用场景大都在手机端，是否要考虑折叠屏也是一个问题。

其他的和css差不多，导入，内联，class之类，只是希望他优先级还有一些其他东西差异不要太大。

**wxs** 就是行内脚本

```js
<wxs module="m1">
var msg = "hello world";

module.exports.message = msg;
</wxs>

<view> {{m1.message}} </view>
```

[事件系统](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html)

说了一大堆，其实说了5件事

1. bindtap 绑定方法
2. bindtap 可以动态绑定方法 {{ name }}
3. 事件循环和浏览器类似，可以支持冒泡和捕获(我没有测试有没有自身那个阶段，应该有吧。。)
4. 支持事件类型，以及事件中有哪些参数，参数具体作用。
5. dataset，mark(数据冒泡，这个获取父节点)

[组件](https://developers.weixin.qq.com/miniprogram/dev/component/)

[响应显示区域变化](https://developers.weixin.qq.com/miniprogram/dev/framework/view/resizable.html)

这里提到了旋转这个概念，这个是需要考虑的，并且提供 Media Query 这个解决方案来解决自适应问题，就是css中 `@media`. 以及屏幕旋转的钩子事件。

手机中的屏幕大小问题，我想了一下存在3个方面

1. 屏幕旋转
2. 双屏切换，比如折叠机。
3. 小窗显示(这个要看微信是否支持)

[分栏模式](https://developers.weixin.qq.com/miniprogram/dev/framework/view/frameset.html)

这里完全不懂，需要测试，当然前期可以完全不管，我大概知道他什么意思。类似于手机直的时候，一种显示，旋转以后另一种显示模式。只是这种是在代码层面，然而为什么在他的描述中似乎只要设置就可以了。



### 06. 运行时环境

[运行时环境](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/env.html)
[JavaScript 支持情况](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/js-support.html)
[小程序运行机制](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html)

这里说说了几点
1. 运行时究竟在什么环境下运行代码
2. javascript 可能有哪些问题，比如说 promise 时序问题，以及某些可能不能使用的语法
3. 什么是冷启动，什么是热启动，以及小程序销毁的机制


### 07. Skyline 渲染引擎

https://www.zhihu.com/question/546709238

这个可以后面看，主要告诉你使用这个引擎以后对于组件，wxss支持。

详情可以看一下这个知乎回答

[如何评价微信小程序新渲染引擎skyline?](https://www.zhihu.com/question/546709238)

> 小程序基于 Webview 的渲染架构
> 
> 优点:
> 大量复用 Web 基建，包括 DOM 、CSS 等。
> 
> 缺点是：
> 内存占用大：每个 Page() 实例对应一个独立的 Webview （相当于 MPA），那么用户打开的每个小程序都对应 n+1 个 Webview。
> 渲染初始化流水线长：需要加载一个 page-frame.html ，该 page-frame.html 包含所在 bundle 的所有 app + page + component 的渲染函数、样式、WXS，甚至可能会达到 MB 级别。
> 原生组件融合困难：通过所谓 “同层渲染” 的 hack 手段尝试解决原生组件的渲染融合问题，但 bug 巨多，稳定性差。
> 无法在页面之间共享元素：都是不同的渲染实例了，那当然共享元素就做不了。
> 页面跳转呆板：半屏渲染不好做，导航动画比较死板。
> jsbridge 传递数据效率低。


> Skyline
> 好处是：
> 
> 节约内存占用。
> flutter 渲染流水线比较精简和可控，可以很好解决局部渲染、原生组件融合等问题。
> 可以在页面间共享显示元素。
> 可以灵活控制页面导航行为和动画。
> context 之间可以通过结构化克隆交换数据，性能比 jsbridge 高。
> 缺点是：
> 
> 需要自己实现 CSS 子集，兼容性较差。
> flutter 控件与 Webview 控件的行为差异。
> 框架失控风险：
> 微信小程序框架本来就是补丁之上打补丁，不成体系且 BUG 巨多。
> 现在又新增一个渲染上下文和渲染层，侵入业务代码和 BUG 膨胀是不可避免的。
> 微信能否保证在新旧架构下各功能的兼容性和体验？个人表示怀疑。很有可能开发者不得不同时使用 Webview / Skyline ，并且同时应对来自两种架构的 BUG 。

并且介绍了支持哪些组件，哪些css。

以及 Skyline 一些新特性，自定义路由，Worklet 动画，手势，共享元素动画。

### 08. 自定义组件

[组件基础](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)

包含了怎么写组件，数据如何绑定，solt，样式隔离，如何引入外部样式，如何引入外部样式，虚化组件...

[组件间通信与事件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/events.html)

讲了组件如何通过事件触发和page的通信，应该也能和父组件的通信，如何获取组件实例

[组件生命周期](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html)

这里需要知道，`lifetimes` 是组件生命周期，`pageLifetimes` 是页面生命周期

**组件生命周期**

![alt text](\img\2023-07-11-155309.png)

**和组件相关的 page 生命周期**

![alt text](\img\2023-07-11-155339.png)

[behaviors](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/behaviors.html)

其实就是 mixins, 算是一种继承的方法

> my-behavior 结构为：
> 属性：myBehaviorProperty
> 数据字段：myBehaviorData
> 方法：myBehaviorMethod
> 生命周期函数：attached、created、ready

覆盖规则和Vue没区别，只是有 [内置behavior](https://developers.weixin.qq.com/miniprogram/dev/component/form.html#wx-form-field)

其实他还是没给源码... 

[relations](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/relations.html)

> 定义和使用组件间关系

这个不建议使用，强关联了.. 除非真的是强关联。

[数据监听器](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/observer.html) 当 this.setData 以后触发 observers

[纯数据字段](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/pure-data.html) 提供一种不能被渲染只是用于 flag 之类的数据。

[抽象组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/generics.html) 看得我头疼。


### 总结

文档我没有完全看完，后续还有插件，域名管理(只能向审核过的域名发起请求)，worker，存储，文件系统，消息推送等等，不过先了解这些暂时不影响我进行我的第一次开发了。

扫完整个文档，给我一种感觉，不舒服。

整个文档没有建议的开发方式，这个ok，但是要给源码啊。。。

不知道你大概实现，你怎么玩的，怎么去好好开发呢？

而且文档例子不够多，只能自己查资料，自己试，完全是体力活。
