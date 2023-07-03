---
title: es6 更新总结
date: 2023-07-03 21:07:01
tags: 
    - web
    - javascript
description: 主要是给我回顾一下 es6 有那些更新
---

1. 字符串
2. 数值
3. 函数
4. 数组
5. 对象(object)
6. 运算符
7. Symbol
8. Set&Map
9. Proxy
10. Reflect
11. Promise
12. Iterator
13. Generator
14. async
15. Class
16. Module

### 001. 字符串

1. 字符的 Unicode 表示法 '\u0061' or '\uD842\uDFB7'
2. 支持 Iterator 遍历
3. 模板字符串 `${name}`
4. 标签模板 alert`welcome to ${name} house`

function alert() {
	console.log(arguments[0]);
    console.log(arguments[1]);
}

// Array ['welcome to', 'home']
// name 

传参方式需要注意

5. String.fromCodePoint() 用于从 Unicode 码点返回对应字符，但是这个方法不能识别码点大于0xFFFF的字符。
6. String.raw`\a` = `\\a` 转义，用于模板转义，已经转义还是要再转
7. String.codePointAt() 码点在U+10000到U+10FFFF之间的字符 '𠮷'.length === 2, 所以这个其实是需要处理的。
8. String.repeat "abc".repeat(2);
9. padStart,patEnd 补全，

```
a.padStart(10, '1234567891011') "123456789a"
a.padStart(10, '12') "121212121a"
```

10. trimLeft, trimEnd
11. matchAll
12. replaceAll 不用写正则了 replace(/a/g, '_'), 第二个参数可以有一些特殊字符来匹配，你会正则也可以无视
13. at()方法接受一个整数作为参数，返回参数指定位置的字符，支持负索引（即倒数的位置）

### 02. 数值

1. 表示二进制 0b || 0B
2. 表示八进制 0o || 0O
3. 数值分割 1000000 可以使用下划线来分割 1_000_000
4. Number.isFinite() https://baike.baidu.com/item/infinity/18702999?fr=aladdin 正无穷和负无穷，javascript `1.7976931348623157e+308` 超过正负值
5. Number.isNaN() 是数值类型但是非数字。 Number.isNaN("a" * 2) === true
6. Number.isInteger() 是否值整数, 正负都为 true
7. parseInt & parseFloat 从 window移植到 Number 下
8. Number.EPSILON 二进制的问题就不复述了，主要是可以检测两个数字
9. Number.MAX_SAFE_INTEGER 
10. Number.MIN_SAFE_INTEGER
11. Number.isSafeInteger() 9,10,11 都是围绕着是否超过精度估算范围是否是安全数字
12. BigInt 后缀必须 + n， 比如3n, 细节没看，但是不能有小数点。

需要精确计算数字我用的比较少，需要的时候再学习吧。

### 03. 函数 function

1. 默认参数 function(x, y=1) ... ,需要注意的是这里有一个独立的作用域，并且每次执行都会计算

```
let x = 99
function a(p = x + 1)
a() // 100
x = 100
a() // 101
```

内部的作用域可以做很多事情

2. function.length 返回参数个数 默认值和默认值后面的参数都不认。
3. name, 返回 function name
4. => 函数，主要注意 this 的引用。
5. rest 类似扩展运算符 function(...values) a { //values数组 }

### 04. 数组

1. ...
2. Array.from 类数组转换为数组
3. Array.of() 创建数组
4. Array.copyWith(target(需要复制的位置), start(开始复制位置), end(停止复制的位置))
5. find()，findIndex()，findLast()，findLastIndex() 
6. fill
7. entries()，keys() 和 values()
8. includes()
9. flat()，flatMap() 多维数组转一维
10. at() 支持负索引

### 05. Object

1. 支持简写，也就是

var o = 1
var b = { o, a() {} }

2. 可以使用变量作为 Object Key
3. Object.getOwnPropertyDescriptor 获取属性描述，就是可写，可读，值，之类的值
4. for...in //enumerable无效
5. Object.keys(obj) //enumerable无效
6. Object.getOwnPropertyNames(obj) //enumerable无效
7. Object.getOwnPropertySymbols(obj) //enumerable无效
8. Reflect.ownKeys(obj) //enumerable无效
9. AggregateError 合并多个错误 `AggregateError(errors[, message])`
10. Object.is 基本等于 === ，差别在 Object.is(NaN, NaN) == true, +0 -0对比为false
11. Object.assign 就是合并object, 需要注意的 Object.assign是浅拷贝，并且同名属性是替换，不是合并
12. Object.getOwnPropertyDescriptors() 
13. __proto__ 用来读取或设置当前对象的原型对象. 
14. Object.setPrototypeOf

```
function setPrototypeOf(target, proto) {
	target.__proto__ = proto;
	return target
}
```

15. Object.setPrototypeOf

获取和设置 __proto__ , 建议不要直接使用 Object.set or Object.get 方式，__proto__ 直接使用的方式兼容性不太好，因为说不定可能取消。

16. Object.keys()，Object.values()，Object.entries() enumerable = true 就意味着可以遍历。
17. Object.fromEntrise 将键值对转换为object，map转object
18. Object.hasOwn, 和Object.hasOwnProperty 类似。

### 06. 运算符

1. **  有点像位运算， 平方
2. ? message.user.name 如果需要判断，需要判断3次， message?.user?.name

有几点需要注意

> 一. 短路，本质上，?.运算符相当于一种短路机制 ，只要不满足条件，就不再往下执行。
> 二. 别用括号，因为短路的原因

3. ?? 判断 null || undefined , 但是不判断0, false之类的
4. x ||= y, x &&= y, x ??= y.

### 07. Symbol

唯一不会重复的值，是一种基础类型，所以也不能 `new`

```
let a = Symbol()
let b = Symbol()
a === b false
```

可以有 description，Symbol('a'), `toString` or `Symbol.description`

如果以 `Symbol` 作为方法或者属性的 `key`, 普通方法是无法遍历的

比如 `for...in`, `Object.keys`, `for of`, `Object.getOwnPropertyName`, `JSON.stringfly` 之类的。

只能从 Object.getOwnPropertySymbol(), Reflect.ownKeys 可以获取。

他还有一些内置的值，主要是 Object 或者 Class 用于指向一个内部方法。

1. Symbol.hasInstance 可以重写 instanceof
2. Symbol.isConcatSpreadable 
3. Symbol.species 改变衍生对象 instanceof 指向
4. Symbol.replace
5. Symbol.search
6. Symbol.split
7. Symbol.iterator
8. Symbol.toPrimitive
9. Symbol.toStringTag
10. Symbol.unscopables
11. Symbol.toPrimitive //指向一个方法。该对象被转为原始类型的值时，会调用这个方法，返回该对象对应的原始类型值
12. Symbol.toStringTag

### 08. set map

Set, 本身是一个构造函数，初始化一个Set数据结构，可以传入数组或者支持iterable接口的数据.
本身是一个集合，内部不能有重复值

- add
- size
- delete
- get
- has
- clear

遍历
```
Set.prototype[Symbol.iterator] === Set.prototype.values
```
所以 `for of` ok, 还可以使用 `forEach, set.keys(), set.values, set.entries` 去遍历
使用 Set 主要使用他去重的功能来进行操作。

WeakSet 和 Set 类似，但是他方法少了。

- add
- delete
- has

区别主要在于 WeakSet 只能存对象，并且是一个弱引用。
弱引用需要先知道回收的机制，简单是就是如果一个对象还被引用，就不会回收，比如必包中的变量。
那么存放在 WeakSet 当中的对象无需考虑在里面，不计入在引用当中。
所以可以用来存放一些临时对象，也不用去管他的释放。

Map

Map和Object类似，都是属于Hash结构，就是键值对。
> 事实上，不仅仅是数组，任何具有 Iterator 接口、且每个成员都是一个双元素的数组的数据结构（详见《Iterator》一章）都可以当作Map构造函数的参数

所以 Map的创建可以 add 和可以构造函数传入

> terator 接口、且每个成员都是一个双元素的数组的数据结构

Map 后面的值会覆盖前面的，Key相同的话，只要两个值严格相等，Map 将其视为一个键, 比如 +0 和 -0, 但是NaN虽然 NaN === NaN == false， 但是也视为相同健。

map的顺序就是插入的顺序，并且没有提供排序的方法。

- set
- size
- get
- delete
- clear
- ...

遍历， 本身支持 Iterator, 所以 `Map.keys(), Map.values(), Map.entries ` 以及本身的 `Map.forEach` 都可以，也可以直接 `for of`.

整体看下来，在不看底层代码的情况下，Map优势不明显。
只能说多了一层封装。

**WeakMap**.

- set
- delete
- has
- get

WeakMap 也是弱引用，不过只值 key 是弱引用，并且key 只能对对象。
作用和 WeakSet 一样，只是结构不同
他们两都不能遍历，因为弱引用导致对象随时可能消失，在遍历的时候，会导致错误。
保存以后去验证一个对象是否还存在，是否还有引用。

**WeakRef**

WeakSet 和 WeakMap 都是在创建, add, set(key) 的时候才是弱引用。
WeakRef 可以把他包装一下，变成一个弱引用。

在做弱引用的测试的时候，我产生了极大的疑惑，后来还 `chrome` 核心测试成功

```
let john = { name: "John" };
let weakMap = new WeakMap();
weakMap.set(john, "...");
john = null; 

weakMap //无属性
```

但是在 firefox 下不是这样的

```
john = null
weakMap依然保持引用。
```

### 09. proxy

**Proxy** 代理，可以理解为把原有对象包裹在里面，访问真实的对象需要先经过这个代理。

1. get(target, propKey, receiver)：拦截对象属性的读取，比如proxy.foo和proxy['foo']。
2. set(target, propKey, value, receiver)：拦截对象属性的设置，比如proxy.foo = v或proxy['foo'] = v，返回一个布尔值。
3. has(target, propKey)：拦截propKey in proxy的操作，返回一个布尔值。
4. deleteProperty(target, propKey)：拦截delete proxy[propKey]的操作，返回一个布尔值。
5. ownKeys(target)：拦截Object.getOwnPropertyNames(proxy)、Object.getOwnPropertySymbols(proxy)、Object.keys(proxy)、for...in循环，返回一个数组。该方法返回目标对象所有自身的属性的属性名，而Object.keys()的返回结果仅包括目标对象自身的可遍历属性。
6. getOwnPropertyDescriptor(target, propKey)：拦截Object.getOwnPropertyDescriptor(proxy, propKey)，返回属性的描述对象。
7. defineProperty(target, propKey, propDesc)：拦截Object.defineProperty(proxy, propKey, propDesc）、Object.defineProperties(proxy, propDescs)，返回一个布尔值。
8. preventExtensions(target)：拦截Object.preventExtensions(proxy)，返回一个布尔值。
9. getPrototypeOf(target)：拦截Object.getPrototypeOf(proxy)，返回一个对象。
10. isExtensible(target)：拦截Object.isExtensible(proxy)，返回一个布尔值。
11. setPrototypeOf(target, proto)：拦截Object.setPrototypeOf(proxy, proto)，返回一个布尔值。如果目标对象是函数，那么还有两种额外操作可以拦截。
12. apply(target, object, args)：拦截 Proxy 实例作为函数调用的操作，比如proxy(...args)、proxy.call(object, ...args)、proxy.apply(...)。
13. construct(target, args)：拦截 Proxy 实例作为构造函数调用的操作，比如new proxy(...args)。

**Proxy** 可以拦截以上操作, 可以做很多事情。

比如 Es6 没有提供 Set 数据结构, 我们要实现一个数组添加不能有重复

1. 通过 Class 重写一个对象。
2. 或者通过统一的 handler，去代理一个 Array对象去实现特性

```
var proxy = new Proxy(arr, {
    set: function(target, propkey, value, receiver) {
        if(!target.includes(value)) {
            return Reflect.set(target, propkey, value, receiver);    
        }
		return true;
    }
})
```

比如 Array.push 是无法链式 [].push(1).push(2), Proxy get 就可以实现，还可以防止调用内部方法，形成私有变量。

Proxy 需要有几点注意的。

1. receiver 这个参数如果在继承，原型链, __proto__ 赋值以后，是指向当前Object，不一定是指向你在绑定 proxy 时候的 Object.
2. this 指向和 receiver 有相同的问题，最好不要以 this.xx 可能会出现问题。


### 10. Reflect

> 1. 将Object对象的一些明显属于语言内部的方法（比如Object.defineProperty），放到Reflect对象上。现阶段，某些方法同时在Object和Reflect对象上部署，未来的新方法将只部署在Reflect对象上。也就是说，从Reflect对象上可以拿到语言内部的方法。
> 2. 修改某些Object方法的返回结果，让其变得更合理。比如，Object.defineProperty(obj, name, desc)在无法定义属性时，会抛出一个错误，而Reflect.defineProperty(obj, name, desc)则会返回false
> 3. 让Object操作都变成函数行为。某些Object操作是命令式，比如name in obj和delete obj[name]，而Reflect.has(obj, name)和Reflect.deleteProperty(obj, name)让它们变成了函数行为。
> 4. Reflect对象的方法与Proxy对象的方法一一对应，只要是Proxy对象的方法，就能在Reflect对象上找到对应的方法。这就让Proxy对象可以方便地调用对应的Reflect方法，完成默认行为，作为修改行为的基础。也就是说，不管Proxy怎么修改默认行为，你总可以在Reflect上获取默认行为。

### 11. Promise

promise 如果只是说语法的话，其实挺简单的。
首先需要明确的是 Promise 是语法糖，你通过JS可以自己写一个出来。
3种状态，pendding, fulfilled, rejected
当你调用一个 promise，就已经在 pendding 状态下。
then(fulfilled, rejected), 处理其他两种状态。
这就是最基本的语法。

链式调用
```
promise.then(result => deep(result)).then(tree => todo)
```
其实就是包装前一个 promise 结果返回一个新的 promise

.catch 
```
promise.then(fulfilled, rejected)
```

.finally 

.all 全部成功才算成功fulfilled
.race 只要有一个成功状态就是fulfilled
.allSettled 全部返回就算成功，不管里面状态
.any 只要有一个是 fulfilled，全部rejected rejected


### 12. Generator

语法就是

```
function* a() {
	yield 1
	yield 2
}
```

会返回一个 iterator 对象，可以进行遍历，或者自己调用 next
next 对象包含 

```
{ value: any, done: boolean }
```

done 表示是否完结

Generator 的一个特性就是，阻止代码运行。

```
function* a() {
	yield b();
	yield c();
	yield d();
}

var o = a(); //不执行，只是传参
o.next(); //执行b()
o.next(); //执行c()
o.next(); //执行d()
```

还有一个例子说明返回和参数

```
function a(s) {
    console.log("a");
    return "ar" + s;
}

function b(s) {
    console.log("b");
    return "br" + s;
}

function c(s) {
    console.log("c");
    return "cr" + s;
}

function* g(s) {
    let av = yield a(s);
    let bv = yield b(av);
    let cv = yield c(bv);
    return cv
}
```

这个说明了传参和返回值。

```
var o = g("haha") //s = haha
o.next() //不用传参
o.next("h") //av = h
o.next("hh") //bv = hh
```

Generator.throw 可以在外部抛出错误，Generator 内部捕获错误
Generator.return 可以直接将 iterable 指针指向最后一个
yield* 表达式可以调用另外的表达式或者方法
this 可以在 prototype 中设置，但是不能在 function 中使用 this, 也不能 new

`yield` 最牛逼的地方在于可以暂停，因此他可以有非常多扫操作

1. 状态机
2. 异步操作同步进行
3. 以iterable接口输出
4. 当作一种数据结构
5. 流程管理之类的事情

```
function get(url) { ... } //异步获取数据 promise

function* a(urls) {
	for(let i=0; i<urls.length;i++) {
		let result = yield get(url);
		console.log(result);
	}
}
```

这个result 可以做挺多事情的，实现了一个看起来同步的操作。


### link

https://es6.ruanyifeng.com/#docs/number
https://zhuanlan.zhihu.com/p/467585782