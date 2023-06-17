---
title: async & defer
date: 2023-6-15 17:58:59
tags: 
    - web
    - javascript
    - async
    - defer
    - 浏览器性能优化
description: 
---

# async & defer

### 1. 基础知识

从之前我学习的浏览器解析过程中我们知道，浏览器顺序解析，遇到javascript，就会阻塞，并且会执行 javascript, 也会阻塞

我们做一个简单的测试

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
  <script src="https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&ved=2ahUKEwjBkb65gsX_AhXnQPUHHasODVkQFnoECBYQAQ&url=https%3A%2F%2Fcloud.google.com%2Fcdn%3Fhl%3Dzh-cn&usg=AOvVaw3iWKHtZqUXGJwR-4dEGXk8"></script>
</head>

<body>
...
```

我加入了一段 google 的连接, :)

肯定不能访问，所以说，浏览器在超时之前下面的所有代码都没有执行，所以我们一般将 script 放在 </body> 之前。


```html
...
<script src="https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&ved=2ahUKEwjBkb65gsX_AhXnQPUHHasODVkQFnoECBYQAQ&url=https%3A%2F%2Fcloud.google.com%2Fcdn%3Fhl%3Dzh-cn&usg=AOvVaw3iWKHtZqUXGJwR-4dEGXk8"></script>
</body>
...
```

好处是可以有2点

1. 预解析器可以提前加载，虽然 script 不是异步的，但是实际就是异步的。
2. 就算阻塞了，至少前面的代码 css，html 是可以加载的

### 2. async

1. 当 script 元素使用 async 属性时，脚本的加载和执行将是异步的。
2. 异步加载的脚本不会阻塞 HTML 页面的解析和渲染过程。
3. 脚本的加载和执行顺序与它们在 HTML 中的顺序无关，哪个脚本先加载完成就先执行。
4. 异步脚本加载完成后会立即执行，不管 HTML 页面的加载状态。
5. 如果多个异步脚本相互依赖，执行顺序可能会受到影响。

看了这个描述，就开始疑惑, 我们知道加载是异步的，这个我可以理解，那么执行为什么是异步的？

因为在之前的学习当中，主线程解析html，遇到 script 开始加载和执行(交给js引擎)，这个过程中是同步的，并且会停止渲染页面。

原因是因为 js引擎和渲染线程是互斥的，js中任何操作dom，css的代码，都可能导致回流或者重绘。

于是我在一段我测试的html中加入了一段代码

```javascript
<script src="./javascript/test.js" async></script>

let b = 0;
let d = (new Date()).getTime();
for(let i=0;i<200000000;i++) {
     b += i;
}
console.log(b);
console.log((new Date()).getTime() - d);
```

得出了一个结论，加载是异步的，执行是同步的(chatgpt害人啊...)

因为加载的时候并没有影响其他js的执行，然而加载完成立刻开始执行，

```
19999999867108864 test.js:7
6647 test.js:8
```

中间这6秒并没有执行其他js代码，于是说明了一切。

再测试一下，是不是先到先得

```js
<script src="./javascript/test.js" async></script>
<script src="./javascript/test1.js" async></script>

console.log(`-------------test start---------------`)
let b = 0;
let d = (new Date()).getTime();
for(let i=0;i<200000000;i++) {
     b += i;
}
console.log(b);
console.log((new Date()).getTime() - d);
console.log(`-------------test end---------------`)
```

复制了一份 **test.js** 代码, 并且新增了输出，但是一直是 **test.js** 先执行, 又给 **test.js** 增加了大量注释，导致他加载速度变慢

```
-------------test1 start--------------- test1.js:8 1 
19999999867108864 test1.js:9 1 
6677 test1.js:10 
-------------test1 end--------------- test.js:1 
-------------test start--------------- test.js:7 
19999999867108864 test.js:8 
7001 test.js:9 
-------------test end---------------
```

也就是说，网速决定一切，加载完成后立刻执行，先到先得，加载异步，执行同步。

### 3. defer

* 当 <script> 元素使用 defer 属性时，脚本的加载和执行同步。
* 延迟加载的脚本不会阻塞 HTML 页面的解析，但会在 HTML 页面解析完毕后按照它们在 HTML 中的顺序依次执行。
* 延迟脚本在 DOMContentLoaded 事件触发之前完成加载和执行，即在文档解析期间执行。
* 如果多个延迟脚本相互依赖，执行顺序会按照它们在 HTML 中的顺序来执行。


> HTML 页面解析完毕后

于是我第一反应是加入一个事件

```js
document.addEventListener('DOMContentLoaded', function() {
  // 在这里执行初始化操作和操作 DOM 的代码
});
```

可惜的是，两个js在这个事件之前已经执行了, 一时半会儿想不出有什么能够测试，于是我在最后的部分加入了输出代码

```js
<body>
  <script>
    console.log(`end`);
  </script>
</body>
```

输出结果是 

```
console.log(`end`);
javascript defer 输出
console.log(`trigger DOMContentLoaded`)
```

基本确定了是在解析完成以后解析，然后又试了试 `async`, 会在 `DOMContentLoaded` 之前触发，顺便测试了一下是否会加载完成之后中断解析，立刻执行。

于是加入了

```js
<h1>这是一个需要很长时间加载的HTML页面</h1>
<p>下面是一个非常大的文本区域：</p>
<textarea rows="100" cols="100">
  ...大量文字
</textarea>
```

果然优先执行了 `async` 的 **js**.

### 3. 总结

async 和 defer 都是异步加载，async 加载完成之后立刻执行，中断主线程解析。 defer 等待主线程解析完成之后，按顺序解析。

这就是他们的作用和最大的区别，需要注意的是 `<scrip asycn></script>` 这样是不支持的，需要引入外部脚本.


### 4. 资料

[脚本：async，defer](https://zh.javascript.info/script-async-defer)

defer 属性：

当 <script> 元素使用 defer 属性时，脚本的加载和执行也是异步的。
延迟加载的脚本不会阻塞 HTML 页面的解析，但会在 HTML 页面解析完毕后按照它们在 HTML 中的顺序依次执行。
延迟脚本在 DOMContentLoaded 事件触发之前完成加载和执行，即在文档解析期间执行。
如果多个延迟脚本相互依赖，执行顺序会按照它们在 HTML 中的顺序来执行。
示例：

html
Copy code
<script src="script1.js" defer></script>
<script src="script2.js" defer></script>
区别：

async 属性表示脚本的加载和执行都是异步的，不会阻塞页面的渲染。脚本加载完成后立即执行，不考虑它们在 HTML 中的顺序，可能会导致脚本之间的依赖关系问题。
defer 属性表示脚本的加载是异步的，不会阻塞页面的渲染，但脚本的执行会在 HTML 页面解析完毕后按顺序执行，可以保持脚本之间的依赖关系。