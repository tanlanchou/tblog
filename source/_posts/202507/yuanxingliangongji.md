---
title: 原型链攻击
date: 2025-07-26 11:24:03
tags: 
    - Javascript
    - prototype
    - 攻击
---

# 原型链攻击


这个事儿的起因是因为在看别人代码的时候

```javascript
let o = Object.create(null)
```



其实我大概知道这个就是创建一个纯粹的`json`对象, 但是没有细究。

于是这次稍微查了下, 一查查到了原型链污染。这个就真不太懂了，于是有了这篇文章



### 01. Object.create



> Object.create(proto[, propertiesObject])



其实就是创建一个对象，并且传原型链进去。

如果没有原型链，也就是



```javascript
Object.create(null)
```



那么他就是一个没有原型链的对象。

干净也就会有干净的问题



对于 `{}` 和 `new Object` , 他是默认有 `Object.prototype` 的



```javascript
constructor: ƒ Object()
hasOwnProperty: ƒ hasOwnProperty()
isPrototypeOf: ƒ isPrototypeOf()
propertyIsEnumerable: ƒ propertyIsEnumerable()
toLocaleString: ƒ toLocaleString()
toString: ƒ toString()
valueOf: ƒ valueOf()
__defineGetter__: ƒ __defineGetter__()
__defineSetter__: ƒ __defineSetter__()
__lookupGetter__: ƒ __lookupGetter__()
__lookupSetter__: ƒ __lookupSetter__()
__proto__: （…）
```



你自然也不能用了。



### 02. 原型链

`Object.create` 的功能清楚了，但是也得大概知道原型链是干什么的，不然怎么知道怎么攻击呢？

其实原型链我不是很愿意多讲，因为现在用的确实少了。

大概就是下面的



```javascript
function a() {
    this.count = "own"
}
```



`javascript` 类其实就是一个 `funtion` 你对他有2种用法

你可以直接用， a(参数) 返回给你

也可以当做类来用

```javascript
let o = new a()

o.count //own
```

这个时候 a 就是构造函数



然后就是原型链。

```javascript
function a() {
    this.count = "own"
}

a.prototype.show = function() { return "prototype" }
a.prototype.count = "prototype"
a.prototype.show() //prototype
a.prototype.count //prototype

let o = new a();
o.show() //prototype
o.count //own
```



就是有一个原型链，他会在 `a.prototype` 上, 当你初始化了实例也就是 `new a()`, 他就优先查询自己属性，不行没有找 `prototype`



还有一个值得注意的是



```javascript
o.__proto__ === a.prototype //true
```



然后 `javascript` 玩继承就是玩原型链继承.



我新增一个 `b` 

```javascript
function b() {
    this.count = "bbbbbbbbb"
    this.myb = "cccccccc"
}

```



然后改一下原型链

```javascript
b.prototype = new a()
b.prototype.constructor = b
```



这下就行了，这就是一个简单的原型链继承

原理其实就是原型链，先查自己 `b` 内部的属性 => 然后查询原型链，这里原型链是 `new a()`，也就是访问他内部的属性 => 如果没有继续查原型链 

无限循环直到顶部。



当然也有其他其他玩法，比如这种原生是不支持私有的对吧？

```javascript
function a() {
  var bb = 1
  var cc = 2
    
  return {
   plus: () => cc + bb  
  }
}


new a()
```



你访问不了 bb 和 cc 对吧。



### 03. 污染

终于到污染了，原型链说了个大概，正好我也复习下。

我们知道了原型链是一层一层查找的，就应该怎么污染。

最简单的

```javascript
Object.prototype.zzz = 1
```



那么我们就可以得知

```javascript
Object.prototype.zzz = 1
var p = {}
p.zzz //1
```



这是不是就污染了？

> 那么，在一个应用中，如果攻击者控制并修改了一个对象的原型，那么将可以影响所有和这个对象来自同一个类、父祖类的对象。这种攻击方式就是**原型链污染**。



不仅仅是这么简单，比如说我想攻击 `Object.prototype` , 总之是一个父原型, 但是作为一个攻击者没有办法访问呢？



```javascript
Object.assign(a, b, { "__proto__": { count: 10 } })
```

这不是就实现攻击了呢？



### 04. 攻击的意义

我认为攻击主要是为了2个点。

提升权限，比如我只是个普通权限，你有些地方校验不敢个，通过这种方式去提升权限。

另外就是为进一步攻击做准备，他只是一个入口，通过入口进一步搞你其他的



### 05. 防守

用库，虽然 `lodash` 出过问题，但是现在还是很严格的，他已经做了很多防御。

这个最简单。



另外就是 Object.create(null), 自己写合并的时候自己做过滤等等



任何地方都需要考虑用户的输入和限制，就算是 Vue，react 这种现代框架，毕竟你始终有对象，始终有合并，如果你做不好就有机会

我毕竟也见过直接让用户写 JSON 的.....


