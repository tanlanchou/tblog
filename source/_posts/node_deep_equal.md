---
title: 看 node-deep-equal
date: 2023-07-03 20:58:59
tags: 
    - 看源码
    - javascript
description: 看 node-deep-equal，学习类型转换的基本
---

[inspect-js/node-deep-equal](https://github.com/inspect-js/node-deep-equal)

这个库很有意思，因为他需要做深层次的对比，所以所有的 javascript 类型都囊括了，应该如何判断和对比

它的核心方法 `internalDeepEqual`, 传入(A,B,Opt,Channel)

A,B 是需要对比的对象， Opt用来区分 Object.is or ===, Channel 一个字典

1. Object.is or === 判断 A，B是否相等，相等 retrun true.
2. 判断 A，B是否是基础类型，并且 typeof 的值是否一致，他这里处理了 new Number(1), new String("1") 这些情况，只是判断类型是否一致，如果不一致， return false
3. A,B 有一个可能是 undefined， null 或者 两边都不是 typeof A !== object 的情况下，直接通过 Object.is or === 来对比
4. 上面3中情况直接处理了基础类型，非object的情况下
5. 将 A，B加入字典，并且做判断
6. 进入 objEquiv(A, B, opts, channel); 进行 Object 的对比。

**objEquiv**

1. typeof 返回值对比
2. Object.prototype.toString(A or B) 对比
3. isArguments 类型判断 
4. isArray 类型判断 return false
5. instanceof Error 类型判断 return false
6. 如果都是Error对象，对比 name 和 message return false 
7. isRegex 类型判断 return false 
8. 对比 Regex.source & Regex.prototype.flags return false
9. isDate 类型判断 return false
10. 对比 Date.prototype.getTime return false
11. Object.getPrototypeOf 对比原型链 return false
12. whichTypedArray 判断 return false
13. isBuffer 类型判断 return false
14. 判断 Buffer length 或者 循环判断两个buffer内容 return true or false
15. isArrayBuffer 类型判断 return false
16. 判断 ArrayBuffer 长度是否一致 return false
17. return typeof Uint8Array === "function" && internalDeepEqual(new Uint8Array(a), new Uint8Array(b), opts, channel)
18. isSharedArrayBuffer 类型判断 和 isArrayBuffer 过程一样
19. objectKeys
20. 判断长度
21. 整理顺序 sort
22. 循环判断
23. whichCollection  判断是否是 set,map,WeakMap,WeakSet 集合类型判断
24. 类型判断
25. 循环递归判断 Set,Map 内容，return true or false
26. return true;

### 01. 关于 Error 的条件判断的问题

```
  var aIsError = a instanceof Error;
  var bIsError = b instanceof Error;
  if (aIsError !== bIsError) {
    return false;
  }
  if (aIsError || bIsError) {
    if (a.name !== b.name || a.message !== b.message) {
      return false;
    }
  }
```

//1. A other B other
//2. A Error B other
//3. A other B Error
//4. A Error B Error

2,3 的情况不存在，因为直接返回 false,在之前的代码中也直接返回 false
1, 如果都是 other 会直接跳过 
4, 如果 Error name & message 一致，也就是不会返回 false.

为什么还需要继续进行判断，比如 isRegex, 以及之后的代码，而不是直接 return true.

因为后续并没有继续针对 `Error` 对象来进行判断的了，也就是说始始终会执行到最后一步, return true

根据 `javascript Error` 文档 [Error](https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/error)

虽然 Error 本身还是有很多属性，但是其实值的判断的，name & message & stack

> Error.prototype.stack Non-standard
> A non-standard property for a stack trace.

所以 name & message 相等的话，应该可以确定是同一种错误。

### 02. channel的使用问题

`side-channel` 是 WeakMap || Map || Object 的一种封装，根据传入参数的不一致，选择不同的字典。

看一段代码

```
var hasActual = channel.has(actual);
  var hasExpected = channel.has(expected);
  var sentinel;
  if (hasActual && hasExpected) {
    if (channel.get(actual) === channel.get(expected)) {
      return true;
    }
  } else {
    sentinel = {};
  }
  if (!hasActual) {
    channel.set(actual, sentinel);
  }
  if (!hasExpected) {
    channel.set(expected, sentinel);
  }

  // eslint-disable-next-line no-use-before-define
  return objEquiv(actual, expected, opts, channel);
```

根据代码， channel 只实例化过一次，如果一个对象，出现完全相同的 Key，那么就会出问题。



### 03. 包含基本类型的判断

```
let o1 = new Number(1);
let o2 = new Number(2);
```

对于这个包来说是返回true的，因为没有针对这个的处理。

但是 

```
let o1 = new String(`one`) 
let o2 = new String(`two`)
``` 

却可以，那是因为，其中有一个判断

```
Object.keys(o1)
```

然后进行对比。

所以按照这个逻辑，new boolean 也是无法判断的。

其他的基础类型，因为不能 new, 所以没有问题

### link

1. [Error](https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/error)
2. [side-channel](https://github.com/ljharb/side-channel)
3. [deep-equal](https://www.npmjs.com/package/deep-equal)
