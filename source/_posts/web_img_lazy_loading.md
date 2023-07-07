---
title: 图片懒加载方案
date: 2023-07-06 16:00:01
tags: 
    - lazyloading
    - 懒加载
    - web
    - javascript
    - 方案
---

虽然这里只说图片懒加载，还是得知道什么是懒加载

> 延迟加载（懒加载）是一种将资源标识为非阻塞（非关键）资源并仅在需要时加载它们的策略。这是一种缩短关键渲染路径长度的方法，可以缩短页面加载时间。

如果只局限到图片这一个点上，就是延后加载非必须的图片。

```html
<img src=`` />
```

### 01. 位置计算 + 滚动事件 (Scroll) + DataSet API

就是说，我知道图片位置，我能监听滚动事件，当图片位置和滚动事件重合的时候，获取图片的 data-src, 渲染图片.

有些网站方案细节不一样，比如提前多少距离加载。

这种方案有点儿类似于移动端分页，划到某些位置自动加载下面的。

在这个思路之下，写了一点代码 [方案一 Demo](https://codesandbox.io/s/polished-resonance-fw3hfy?file=/index.html)

url 可以换，这个方案最大的问题是什么？


这里还可以有什么优化的点？比如 ImgClass 完成以后需要删除监听。其他就是优化判断是否在里面。

### 02. 方案2 getBoundingClientRect 

> getBoundingClientRect 是一个 DOM 元素的方法，它返回一个包含该元素位置和尺寸信息的 DOMRect 对象。DOMRect 对象包含以下属性：
> 
> top：元素上边界相对于视口顶部的距离。
> right：元素右边界相对于视口左边的距离。
> bottom：元素下边界相对于视口顶部的距离。
> left：元素左边界相对于视口左边的距离。
> width：元素的宽度。
> height：元素的高度。

他的 top 是基于滚动的位置, 是基于 document.documentElement.scrollTop 再做运算的。

```js
isInViewport() {
    return this.element.getBoundingClientRect().top < document.documentElement.clientHeight + 100;
}
```

https://caniuse.com/?search=getBoundingClientRect 兼容性ok.

### 03. 方案3 Intersection_Observer_API

> Intersection Observer API 是一个用于观察元素在视口中可见性变化的 JavaScript API。它提供了一种异步方式来监听一个或多个元素与其祖先元素或整个文档视口的交叉状态。通过使用 Intersection Observer API，开发者可以有效地检测元素是否进入或离开视口，或者与其他元素相交的程度。

```ts
<div class="box"></div> * 10
<script>
    // 创建 Intersection Observer 对象
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 元素进入视口时添加 CSS 类名
                entry.target.classList.add('visible');
            } else {
                // 元素离开视口时移除 CSS 类名
                entry.target.classList.remove('visible');
            }
        });
    });

    // 监听所有具有 ".box" 类名的元素
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        observer.observe(box);
    });
</script>
```

这是一个简单例子，如果用在之前的例子中应用 [demo](https://codesandbox.io/s/polished-resonance-fw3hfy?file=/intersectionObserver.html)

https://caniuse.com/?search=IntersectionObserver

### 04. 方案4 

https://caniuse.com/?search=loading

这个方案最简单直接，而且浏览器直支持，现在来看还行。


> loading 属性是 HTML <img> 元素的一个属性，用于指定图像的加载行为。该属性可帮助开发者优化图像的加载性能和用户体验。loading 属性在 HTML5.2 规范中被引入，支持现代浏览器。

loading 属性有以下几个可选值：

- auto：默认值，浏览器自动选择加载方式，根据网络条件和用户体验来决定。
- lazy：图像延迟加载，只有当图像进入视口附近时才开始加载。这可以提高页面的加载速度和性能。
- eager：图像立即加载，优先级高于页面其他内容的加载。适用于需要尽快展示图像的情况。


### 总结

第一种方案兼容性最好，所有浏览器都能支持，因为他就是靠位置计算。

第二种方法，getBoundingClientRect，可以根据当前浏览的窗口来计算 top。

第三种方法，IntersectionObserver，他避免了对于 scoll 事件的监控，很平滑。

第四种方法，loading = lazy 其实简单有效，但是原理目前不是很清楚。


https://addyosmani.com/blog/lazy-loading/
https://developer.mozilla.org/zh-CN/docs/Web/API/DOMRect
https://developer.mozilla.org/zh-CN/docs/Web/Performance/Lazy_loading
https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API