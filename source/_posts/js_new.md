---
title: javascript new 做了什么？
date: 2023-07-03 21:55:01
tags: 
    - web
    - javascript
    - new
description: 浅拷贝原型链，然后通过原型链绑定 this，执行 call, bind, apply 之类的操作，然后返回，搞定
---

# new 做了什么？


经常使用 new

```js
function Person(name, sex) {
	this.name = name;
	this.sex = sex;
}
const person = new Person('tommy', 'male');
console.log(person.name);

new Array();
new Date();
```

那么 new 关键字做了什么 ?

1. 创建一个空对象：使用 new 关键字创建一个新的空对象，该对象将成为实例化的对象。
2. 设置原型链连接：将新创建的对象的原型链接到构造函数的原型对象（Constructor.prototype）上。这样，实例对象就可以访问构造函数原型对象上定义的属性和方法。
3. 绑定 this 上下文：将构造函数的 this 上下文绑定到新创建的对象上，使构造函数内部的代码可以访问和操作新对象。
4. 执行构造函数代码：执行构造函数的代码块，将属性和方法添加到新创建的对象上。在构造函数中可以使用 this 关键字引用新对象，并对其进行初始化。
5. 返回新对象：如果构造函数没有显式返回其他对象，那么 new 表达式将隐式返回新创建的对象实例。这样，通过 new 创建的对象就可以在代码中使用，并引用该实例。

按照这个逻辑，我们自己写一个函数。

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

这样也就说明了原理。


