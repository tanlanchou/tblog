---
title: javascript this 指向
date: 2023-09-03 21:00:01
tags: 
    - javascript
    - this
    
description: 明确 this 指向, this 在各种环境下是如何运作的.
---

### 01. this 指向

首先都知道的, function 中 this 指向基于调用者, 谁调用你 this 指向谁.

```js
function a() {
    this.a = 1;
}

a();
console.log(this.a)
```

做一个最简单的测试, 输出

```
1
```

### 02. bind, call, apply 改变 this

如果全是正常 fucntion 那么肯定 this 全部指向 window.

但是你一颗使用 bind, call, apply 改变 this 指向.

```js
function a() {
    this.a = 1;
}

a();
console.log(this.a)

var b = a.bind({});

b();
console.log(this.a)

var c = a.call({}, 1, 2, 3);

console.log(this.a)

var d = a.apply({}, [1, 2, 3]);

console.log(this.a)
```

详细语法看下面链接

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call

### 03. new

new 关键字, 创建一个对象, 并且让这个对象继承构造函数的原型, 详情可见 [javascript new 做了什么？](/tblog/2023/07/03/js_new/)

```js
function d() {
    this.d_v = 4;
}

const d1 = new d();
console.log(`const d1 = new d();`);
console.log("window this.d_v:", this.d_v);
console.log("window d1.d_v:", d1.d_v);

function _new(func, ...params) {

    //创建新的对象，并且把原型链副浅拷贝到新的对象中
    //func.prototype 
    const obj = Object.create(func.prototype);
    //调用 func, 并且以 obj为this.
    const result = func.apply(obj, params);

    const o = result || obj;
    return o;
}

const d2 = _new(d);
console.log(`const d2 = _new(d);`)
console.log("window this.d_v:", this.d_v);
console.log("window d1.d_v:", d1.d_v);
```

### 04. 嵌套 function 

```js
function f() {
    this.f_v = 5;
}

function g() {
    f();
    const e = () => {
        this.e_v = 7;
    }

    const h = function() {
        this.h_v = 8;
    }

    e();
    h();
    console.log('g this.f_v:', this.f_v);
    console.log('g this.e_v:', this.e_v);
    console.log('g this.h_v:', this.h_v);
}

const g1 = new g();
console.log('window this.f_v:', this.f_v);
console.log('window this.e_v:', this.e_v);
console.log('window this.h_v:', this.h_v);
```

输出结果

```
g this.f_v: undefined
g this.e_v: 7
g this.h_v: undefined
window this.f_v: 5
window this.e_v: undefined
window this.h_v: 8
```

1. new g() 将 function g 内部 this 只想 g 的原型链
2. f() 内部 this 指向 window
3. e() 箭头函数指向 g 原型链
4. h() 函数 this 指向 window

也就是说函数嵌套下层函数 this 指向是 window

### 05. 箭头函数

上面的例子已经说明了 this 指向的规则,

```js
() => {}
```

里面 this 指向上层.

### 06. object

```js
const i = {
    a: 1,
    b: 2,
    getB: function () {
        console.log(`getB`, this.b);
    },
    getA: function () {
        console.log(`getA`, this.a);
        this.getB();
    },
    getB1: () => {
        console.log(`getB1`, this.b);
    }
}

i.getA();
i.getB1();
```

输出结果

```
1
2
undefined
```

### 07. 简单总结.

this 你用 function 大都指向 window.

除非你使用 object 或者 使用 apply, new 之类的方式改变 this 指向.

但是如果你改变指向的下层, 你继续使用function 他还是会指向 window.

这个使用使用箭头函数, 指向上层.