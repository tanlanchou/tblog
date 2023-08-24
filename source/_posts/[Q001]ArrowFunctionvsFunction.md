---
title: 箭头函数有prototype吗？为什么？
date: 2023-08-20 22:47:01
tags: 
    - web
    - javascript
---

### 01. () => 有没有原型链

这个我居然真不知道，真没有注意到这个问题

首先我知道箭头函数是直接绑定父级别 this 的, 也就类似于

```js
const _this = this
function a() {
    _this.
}
```

但是他确实没原型链

```js
const a = () => {}
const b = function() {}
console.log(a.prototype) //undefined
console.log(b.prototype) //{constructor: ƒ}
```

因为this指向上层的原因, 所以他不能作为构造函数

- 箭头函数没有自己的 this，而是继承父作用域的 this
- 不支持 call bind，改变 this 指向。
- 不绑定 arguments
- 没有 prototype 属性

### 02. 为什么不能 new

首先需要知道 new 做了什么, [new 做了什么？](/tblog/2023/07/03/js_new/)

```js
function _new(func, ...params) {
	
	//创建新的对象，并且把原型链副浅拷贝到新的对象中
	//func.prototype 
	const obj = Object.create(func.prototype);
	//调用 func, 并且以 obj为this.
	const result = func.apply(obj, params);
	
	const o = result || obj;
	return o;
}
```

也就是说 new 其实就是复制原型链，到func当中执行，然后返回那个对象。

但是你 箭头函数，没有 prototype，你怎么复制？

如果你要强行 new 也不是不行，自己写 new 函数，以作用域当原型链..

只是没什么意义