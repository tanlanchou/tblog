---
title: 为什么要用 void 0 代替 undefined
date: 2023-07-03 22:02:01
tags: 
    - web
    - javascript
    - undefined
    - void 0
description: 其实核心愿意就在于，undefined 是可以当做变量名的，如果出现失误，会污染所有的 undefined
---

# 为什么要用 void 0 代替 undefined

在看 Vue3.x 源码的时候，发现关于 undefined 赋值都是使用 Void 0，觉得很奇怪，于是学习了一下。

### 01. 什么是 globalThis?

> globalThis 是一个全局对象，它提供了在任何执行上下文中都可用的标准全局对象的访问方式。在 Web 浏览器中，全局对象可能有多种不同的名称，比如在浏览器窗口中，全局对象通常是 window，而在 Web Worker 中，全局对象是 self。而在 Node.js 中，全局对象是 global。globalThis 提供了一种跨平台的方式来访问全局对象，它可以在任何平台上使用，而不需要考虑全局对象的名称。

### 02. undefined 是什么？

> undefined 是全局对象的属性——即全局作用域的变量。

它的语义表示，未被定义的值，它是一种原始数据类型。

> 表示 no value（无值）——也无对象也无值

也就是说, undefined 是一种数据类型，我们平时的使用方式

```js
var a;
var b = undefined;
```

就是将 undefined 原始值赋值给变量。

我们直接调用 `undefined` 或者不赋值，其实等于

```js
var a = globalThis.undefined;
var b = globalThis.undefined;
```

也就是全局对象的属性

```js
globalThis.undefined === undefined;
```

总结一下就是，`undefined` 表示一种原始值，直接在 `javascript` 写 `undefined` 就是表示 `globalThis.undefined`, 同时 `undefined` 也可以作为变量名.

### 03. undefined 有什么问题？

问题就在于 `undefined` 也可以作为变量名，因为我们平时完全是把 `undefined` 当作字面量来使用的，拿 `null` 来说， `null` 就是字面量

```js
let null = 0;
```

他会直接告诉你

> Variable declaration not allowed at this location.ts(1440)

然而 `undefined` 不会.

```js
let undefined = 0;
```

他娘的是可以通过的...

所以问题就在这里了，你无法确定 `undefined` 中是否是 `undefined` 的原始值, 

它可能是原始对象，可能是局部变量。

```js
let [undefined, cat = undefined] = ['test'];
console.log(undefined); //test
console.log(cat); //test
console.log(globalThis.undefined) //undefined
```

还好它不能直接赋值 

```js
undefined = 0;
console.log(undefined) //undefined
let desc = Reflect.getOwnPropertyDescriptor(globalThis, `undefined`)
console.log(desc) // {value: undefined, writable: false, enumerable: false, configurable: false}
```

但是也不会报错。

### 04. void 关键字

> void 是 JavaScript 中的一个关键字，用于执行一个表达式，但不返回任何值。在语法上，它通常被用于在一个链接或按钮的 href 或 onclick 属性中，以避免浏览器在执行链接或按钮操作时跳转到新的页面或刷新当前页面。
>
> 在使用 void 时，可以将其后面跟一个 JavaScript 表达式。该表达式将被执行，但返回值将被忽略，并且 void 运算符的结果将始终是 undefined。

也就是说，不管你右边是什么，返回什么，加 `void` 就返回 `undefined` 原始值。

### 05. 为什么要用 void 0 代替 undefined

基于上面说的，现在就明白了为什么要用 `void 0` 代替 `undefined`, 就是因为 `undefined` 可以是变量名。

使用 `void 0` 可以保证是 `undefined` 原始值。

另外，使用 `globalThis.undefined` 也可以获取原始值，只是它要稍微长一点，本质上没区别。