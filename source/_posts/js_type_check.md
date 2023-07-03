---
title: javascript 类型判断方法总结
date: 2023-07-03 21:58:01
tags: 
    - web
    - javascript
    - instanceof
    - Object.is
    - isArray
    - toString.call
description: typeof, instanceof, Object.prototype.toString.call
---


常用的判断类型的方式如下

* typeof
* instanceof
* Object.prototype.toString.call
* Array.isArray
* ==
* ===
* Object.is

### 1. == 

== 有一个类型转换的过程

```javascript
1 == '1';  // true，进行类型转换后，字符串 '1' 被转换为数字 1，然后比较相等性
true == 1;  // true，布尔值 true 被转换为数字 1，然后比较相等性
null == undefined;  // true，因为它们被视为相等的特殊值
```

就是隐式转换，所以可能会有意想不到的结果。

转换以后对比两个值是否相等，这个是最不推荐的，首先特殊情况很多，还会进行类型转换再来对比，而且只能处理基础类型.

### 2. ===

它比 `==` 好一点的是，他不会进行类型转换，也就是类型相同且值相同的情况下，返回 `true`.

但是他的缺点依然，就是只能处理基础类型，但是他也有用出。

### 3. Object.is

上面 `===` 有一个问题

```
+0 === -0 //true
NaN === NaN //false
```

然而在 Object.is 中相反

```
Object.is(+0, -0); //false
Object.is(NaN, NaN); //false
```

其他结果一致。

### 4. typeof

typeof 能做的很明确，迅速确定基础类型，比如这里我就是需要 string or number，直接用就好了。

缺点就是可以区分的类型太少了，

> typeof 运算符通过检查变量的内部标签来确定其类型。不同类型的变量在内部被赋予了不同的标签

但是这个标签又不对外暴露。

他不能判断复杂类型，比如 new String(), Date, Null 等等，他都返回 `object`, 而且会混淆 function 和 正则。

所以只能用他判断基础类型，甚至连 function 都不行.

还有很多问题，[typeof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof)

```
typeof null === "object";
typeof undeclaredVariable; // "undefined"
typeof document.all === 'undefined';
```

除了判断某些确定的基础类型，不建议使用

### 5. instanceof

他的逻辑本质上是不停的网上寻找匹配的原型或者构造函数

```javascript
object instanceof constructor
```

按照这个思路，基础类型是无法匹配的

```javascript
1 instanceof Number //false
(new Number(1)) instanceof Number //true
```

依照这个思路，我们还可以这样写

```javascript
function Person() {}
var person = new Person(); 
console.log(person instanceof Person); 
```

### 6. 自己写一个 instanceof

核心就是不停的往上查，写一个递归.

```javascript
function myInstanceof(obj, type) {
	const prototype = Object.getPrototypeOf(obj);
	if(prototype === null) return false;
	if(prototype.constructor === type) {
		return true;
	}
	return myInstanceof(prototype, type);
}
```

### 7. Object.prototype.toString.call

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString

> Object.prototype.toString 是 Object 类原型上的一个方法，用于返回一个表示对象类型的字符串。当我们调用 Object.prototype.toString 方法时，它会检查调用者的内部标签，并返回相应的字符串表示对象类型。

这个就很奇怪了，既然 typeof 也是调用内部的标签，为什么 typeof 不行。

```javascript
const toString = Object.prototype.toString;

toString.call(new Date()); // [object Date]
toString.call(new String()); // [object String]
// Math has its Symbol.toStringTag
toString.call(Math); // [object Math]

toString.call(undefined); // [object Undefined]
toString.call(null); // [object Null]
```

需要提出的是

```
Object.prototype.toString.call('1') //[object String]
Object.prototype.toString.call(new String('1')) //[object String]
```

这个是没有区分的，但是实际上是有区别的。

还有一个问题是

> 以这种方式使用 toString() 是不可靠的；对象可以通过定义 Symbol.toStringTag 属性来更改 Object.prototype.toString() 的行为，从而导致意想不到的结果

```
const myDate = new Date();
Object.prototype.toString.call(myDate); // [object Date]

myDate[Symbol.toStringTag] = "myDate";
Object.prototype.toString.call(myDate); // [object myDate]

Date.prototype[Symbol.toStringTag] = "prototype polluted";
Object.prototype.toString.call(new Date()); // [object prototype polluted]
```

### 8. Array.isArray

* 首先，它会使用 Object.prototype.toString 方法来获取值的内部标签。
* 然后，它会将内部标签与字符串 "[object Array]" 进行比较。
* 如果内部标签与 "[object Array]" 匹配，即表示该值为数组，返回 true。
* 如果内部标签与 "[object Array]" 不匹配，即表示该值不是数组，返回 false。

原理上应该和 Object.prototype.toString.call 一样。

### 9. 总结

还是要 typoef 和 Object.prototype.toString.call 联合使用才能真正很好的解决问题。

instanceof 真的可以退休了。

### 10. 资料

[Object.prototype.toString()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)
[typeof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof)
