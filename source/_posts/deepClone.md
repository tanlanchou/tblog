---
title: 深拷贝方法优缺点总结
date: 2023-07-03 21:36:01
tags: 
    - web
    - javascript
    - 深拷贝
description: JSON.stringify(obj)， _.cloneDeep，自己写深度遍历，structuredClone
---

# 深度拷贝

一般来说，如果需要深度拷贝，网上会推荐三种方式。

1. JSON.stringify(obj)
2. _.cloneDeep(value)
3. 自己写深度遍历

### JSON.stringify

> 首先，将要被序列化的对象（称为目标对象）传递给函数。JSON.stringify()
> JSON.stringify()函数检查目标对象的数据类型。 如果目标对象是一个简单类型（例如字符串、数字、布尔值、null、undefined），则它会直接返回该值的JSON表示。
> 如果目标对象是一个数组，则会递归地调用自身，对每个数组元素进行序列化，并将结果拼接成一个JSON数组。JSON.stringify()
> 如果目标对象是一个对象，则会递归地调用自身，对每个对象属性进行序列化，并将结果拼接成一个JSON对象。JSON.stringify()
> 在序列化对象属性时，会跳过属性值为函数或undefined的属性，并在其他情况下将属性值转换为JSON格式的字符串。JSON.stringify()
> 最后，返回一个JSON格式的字符串表示整个目标对象。JSON.stringify()
> 
> 需要注意的是，在某些情况下，会跳过一些属性。 例如，当对象包含循环引用时，会将这些引用跳过，以避免无限递归。 此外，对于某些不支持的数据类型（例如日期对象），可能会将它们转换为null或空字符串。

他的主要问题其实不是问题，主要是错误的应用方式，他本身就是为了 json => string.

所以当你使用他的时候

```js
JSON.parse(JSON.stringify(obj))
```

会发现以下问题

1. Date() 他直接给你 toString() 了。
2. 他不支持函数对象
3. 他不支持 Map,Set,Error,RegExp，Symbol 等等.
4. 不支持循环引用

不支持循环引用的问题 

```js
let obj = {
    a: 1,
    b: null
}
obj.b = obj;
```

这个时候就会报错。

### _.clonedeep

clonedeep 没有任何问题，问题是需要引入 `lodash`.

简单看了一下他的源码

**.internal/baseClone.js**

大概是这个递归的思路来的

### 自己写一个 deepClone

本质上就是一个递归，我写一个伪代码

```js
const argsTag = '[object Arguments]'
const arrayTag = '[object Array]'
const boolTag = '[object Boolean]'
const dateTag = '[object Date]'
const errorTag = '[object Error]'
const mapTag = '[object Map]'
const numberTag = '[object Number]'
const objectTag = '[object Object]'
const regexpTag = '[object RegExp]'
const setTag = '[object Set]'
const stringTag = '[object String]'
const symbolTag = '[object Symbol]'
const weakMapTag = '[object WeakMap]'
const arrayBufferTag = '[object ArrayBuffer]'
const dataViewTag = '[object DataView]'
const float32Tag = '[object Float32Array]'
const float64Tag = '[object Float64Array]'
const int8Tag = '[object Int8Array]'
const int16Tag = '[object Int16Array]'
const int32Tag = '[object Int32Array]'
const uint8Tag = '[object Uint8Array]'
const uint8ClampedTag = '[object Uint8ClampedArray]'
const uint16Tag = '[object Uint16Array]'
const uint32Tag = '[object Uint32Array]'
```

```js
function deepClone() {

    //判断类型，如果 typeof 不是 object，直接返回
    //判断类型
    //你需要把每一个类型列出来单独处理，如同上图的tag
    //基础类型 new String(), new Date() 之类的，使用取出原始值，来创建新的对象，并且赋值
    //如果是Array, Map, Set ... 之类的的集合，字典，数组，遍历循环递归。
    //最后给出一个结果
    //return reuslt

}
```

### 新方式，structuredClone

解决了大部分问题。

https://developer.mozilla.org/en-US/docs/Web/API/structuredClone

```js
const calendarEvent = {
  title: "Builder.io Conf",
  date: new Date(123),
  attendees: ["Steve"]
}

const copied = structuredClone(calendarEvent)
```

> 克隆无限嵌套的对象和数组
> 克隆循环引用
> 克隆各种 JavaScript 类型，例如 、 、 等等DateSetMapErrorRegExpArrayBufferBlobFileImageData
> 传输任何可转移对象

但是他也有问题

首先他无法克隆 `function`

> Uncaught DOMException: Failed to execute 'structuredClone' on 'Window': function() { console.log(1) } could not be cloned.

而且在某些情况下他会直接跳过 `function`

```js
class MyClass { 
  foo = 'bar' 
  myMethod() { console.log(this.foo) }
}
const myClass = new MyClass()

const cloned = structuredClone(myClass)
cloned.myMethod === undefined; //true
```

这个例子当中，还有另一个问题

```js
cloned instanceof MyClass //false
```

也就是说他不会随着原型链像上查找，只是遍历属性。

还会存在一个问题，就是 `getter & setter`. 他会跳过，你把他理解为 fn 就行了。

也就是说，这个单纯的是给你深度克隆数据的方法，如果你要克隆一个类，那是不行的。

https://caniuse.com/?search=structuredClone

浏览器支持情况, nodejs中至少我目前的 v16.18 是不支持的。

### 深拷贝的应用场景

其实深拷贝还是特殊场景的特殊应用，随意使用可能导致问题。

因为持续的遍历需要考虑有多深的问题，还需要考虑是否要遍历prototype问题，还需要解决一些数据就是有问题的情况。

所以还是要剧情情况具体分析。

### 如何浅拷贝

都说道这里了，那么如何浅拷贝

```js
let o = {...x}
let o = x
let o = Object.assign({}, x);
let o = Object.create(x)
```

等等..

