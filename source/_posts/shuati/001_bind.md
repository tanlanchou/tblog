---
title: 自己实现一个 bind
date: 2023-12-7 14:14:00
tags: 
    - javascript
---

## 前言

在 JavaScript 中，`bind` 方法是用来改变函数的 `this` 指向的。

## 实现

```javascript
Function.prototype.myBind = function(context) {
    return function(...args) {
        return this.apply(context, args)
    }
}
```

如果你直接写

```js
function myBind(context) {
    return function(...args) {
        return this.apply(context, args)
    }
}
```
