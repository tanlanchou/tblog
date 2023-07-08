



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

### 02. DOM事件模型和事件流

这里有两个概念，一个叫做事件捕获，一个叫做事件冒泡

也就是说事件是一个传递的过程, 我这里举个例子