
---
title: 浏览器事件流
date: 2023-07-09 12:16:01
tags: 
    - web
    - javascript
    - event
---

### 01. dom 事件级别

> DOM 0级事件处理，DOM 2级事件处理和DOM 3级事件处理

DOM 0 

> 用于处理基本的用户交互，如鼠标点击、键盘输入和表单提交等。一些常见的第一级事件包括click、keydown、submit等。

DOM 2

> 例如，mouseenter和mouseleave事件在第二级事件中引入，用于检测鼠标进入和离开元素的区域, addEventListener

DOM 3

> UI事件，当用户与页面上的元素交互时触发，如：load、scroll
> 焦点事件，当元素获得或失去焦点时触发，如：blur、focus
> 鼠标事件，当用户通过鼠标在页面执行操作时触发如：dblclick、mouseup
> 滚轮事件，当使用鼠标滚轮或类似设备时触发，如：mousewheel
> 文本事件，当在文档中输入文本时触发，如：textInput
> 键盘事件，当用户通过键盘在页面上执行操作时触发，如：keydown、keypress
> 合成事件，当为IME（输入法编辑器）输入字符时触发，如：compositionstart
> 变动事件，当底层DOM结构发生变化时触发，如：DOMsubtreeModified
> 同时DOM3级事件也允许使用者自定义一些事件。

为什么要这样区分呢？

其实就是一个不断演进的过程，所以不用纠结这个区分，类似于， ES4，ES5，ES6，ES7一样，现在怕是没有只支持 DOM0 的浏览器了。

### 02. 什么是事件冒泡和捕获

> 事件冒泡（Event Bubbling）是指在DOM中，当一个元素上的事件被触发后，事件将向父元素逐级传播，直至传播到DOM树的根节点或被阻止
> 
> 事件捕获（Event Capturing）是指在DOM中，当一个元素上的事件被触发时，事件将从DOM树的根节点开始，逐级向下传播至目标元素。换句话说，事件从最外层的元素开始传播，依次经过父元素、子元素，直到传播到目标元素。

在事件流里面，其实就是 **捕获 => 自身 => 冒泡**

这里写了一个简单的例子，代码在 https://codesandbox.io/s/hardcore-glitter-h9v8kq?file=/browser_event.html

```html
<!DOCTYPE html>
<html>
  <head>
    <title>多层嵌套的事件捕获和冒泡示例</title>
  </head>
  <style>
    #outer {
      width: 350px;
      height: 350px;
      background-color: black;
    }

    #middle {
      width: 300px;
      height: 300px;
      background-color: blue;
    }

    #inner {
      width: 250px;
      height: 250px;
      background-color: yellow;
    }
  </style>

  <body>
    <div id="outer">
      <div id="middle">
        <div id="inner">
          <button id="btn">click</button>
        </div>
      </div>
    </div>

    <script>
      // 获取元素
      var outer = document.getElementById("outer");
      var middle = document.getElementById("middle");
      var inner = document.getElementById("inner");
      var btn = document.getElementById("btn");

      function f(name) {
        return function (event) {
          console.log(
            `${event.target.id} 触发了, 现在处于的阶段是 ${event.eventPhase}, 在传递到了${name}`
          );
        };
      }

      // 添加事件处理程序
      outer.addEventListener("click", f(`outer`), true); // 事件捕获阶段
      middle.addEventListener("click", f(`middle`), true); // 事件捕获阶段
      inner.addEventListener("click", f(`inner`), true); // 事件捕获阶段
      btn.addEventListener("click", f(`btn`), true); // 事件捕获阶段

      outer.addEventListener("click", f(`outer`), false); // 事件冒泡阶段
      middle.addEventListener("click", f(`middle`), false); // 事件冒泡阶段
      inner.addEventListener("click", f(`inner`), false); // 事件冒泡阶段
      btn.addEventListener("click", f(`btn`), false); // 事件冒泡阶段
    </script>
  </body>
</html>
```


- browser_event.html:50 btn 触发了, 现在处于的阶段是 1, 在传递到了outer
- browser_event.html:50 btn 触发了, 现在处于的阶段是 1, 在传递到了middle
- browser_event.html:50 btn 触发了, 现在处于的阶段是 1, 在传递到了inner
- browser_event.html:50 btn 触发了, 现在处于的阶段是 2, 在传递到了btn
- browser_event.html:50 btn 触发了, 现在处于的阶段是 2, 在传递到了btn
- browser_event.html:50 btn 触发了, 现在处于的阶段是 3, 在传递到了inner
- browser_event.html:50 btn 触发了, 现在处于的阶段是 3, 在传递到了middle
- browser_event.html:50 btn 触发了, 现在处于的阶段是 3, 在传递到了outer

首先不会执行两次，我这里是捕获了2次。 

event.eventPhase 表示冒泡执行的阶段， https://developer.mozilla.org/zh-CN/docs/Web/API/Event/eventPhase

- Event.CAPTURING_PHASE (1)：表示事件处于捕获阶段。
- Event.AT_TARGET (2)：表示事件处于目标元素阶段。
- Event.BUBBLING_PHASE (3)：表示事件处于冒泡阶段。

这里就验证了这个流 **捕获 => 自身 => 冒泡**

### 03. addEventListener

https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener

```js
addEventListener(type, listener); //不传默认为false, 也就是冒泡
addEventListener(type, listener, options);
addEventListener(type, listener, useCapture);
```

主要还是要说一说 `options`

- capture 可选, 一个布尔值，表示 listener 会在该类型的事件捕获阶段传播到该 EventTarget 时触发。
- once 可选, 一个布尔值，表示 listener 在添加之后最多只调用一次。如果为 true，listener 会在其被调用之后自动移除。
- passive 可选, 一个布尔值，设置为 true 时，表示 listener 永远不会调用 preventDefault()。如果 listener 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告。查看使用 passive 改善滚屏性能以了解更多。
- signal 可选,  AbortSignal，该 AbortSignal 的 abort() 方法被调用时，监听器会被移除。

前两个很好理解。

preventDefault https://developer.mozilla.org/zh-CN/docs/Web/API/Event/preventDefault 取消默认行为.

signal 

```ts
const controller = new AbortController();
const signal = controller.signal;

function eventListener(event) {
  console.log('事件被触发');
}

document.addEventListener('click', eventListener, { signal });

// 在某个条件满足时中止事件监听器
controller.abort();
```

### 04. onclick 

只能冒泡，不能捕获。

只能一次，不能像 addEventListener 多次，也不能取消。