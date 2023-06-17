---
title: typescript 类型有哪些？
date: 2023-6-15 17:54:28
tags: 
    - javascript
    - typescript
description: 
---

# typescript 类型有哪些？

### 1. 基本类型

* number 
* string
* null
* undefined
* bealean
* bigInt
* symbol

这是基础类型，现在的 `javascript` 也支持对应类型，先不赘述了。


### 2. 数组类型

```ts
let arr = [];

class build<T> {
    arr1: T[];
    arr2: Array<T>();
    arr3: string[];
    arr4: symbol[];
}

let o = new build<string>();
```

typescript 支持参数数组

```ts
let arr = [];
let arr1 = never[];
```

是等价的。

数组还有一个特别的**元组类型**

> [T1, T2, ...]：表示具有固定长度和特定顺序的元素类型为 T1, T2, ... 的元组。

可以简单理解为，固定顺序的数组，[string, number, type, interface].

### 3. 对象类型

object 类型，表示一切非原始类型，除了 null or undefined. 比如 {}, 比如 Date() 往大了说都是 object.

{} or Reacord<k, v>. 表示任意对象类型

type or interface 是自定义类型

### 4. 函数类型

```ts
function a() {}
() => {};
```

### 5. 枚举

```ts
enum a {
    ...
}
```

### 6. class

### 7. 泛型

```ts
Array<T>
T[]
class a<T>
type a<T> = ...
inferce a<T> = {
    ...
}
```

泛型和type的很多修饰符组合起来有奇效.

### 8. 其他

any: 任意类型，他会忽略类型检查，就跟 javascript 一样使用，被官方不推荐使用。
unknow: 效果类似，但是更推荐使用, 因为他必须使用额外的类型检查来确定。

举个例子

```ts
function c() {
    return 'a';
}

let d: any = c();
console.log(d.toLocaleLowerCase());

let e: unknown = c();
console.log(e.toLocaleLowerCase()); //报错
if(typeof e === 'string') {
    console.log(e.toLocaleLowerCase());
}
```

明白差别了把，他更安全的原因在于，他必须进行一次类型检查。

void 表示方法的返回类型，虽然 typescript 允许下面代码

```ts
function a():void {}
let b = a();
```

但是实际上不推荐。

never 表示类型通常用于表示不可到达的代码路径，例如抛出异常、死循环或类型推断失败等情况。

### 9. 总结

基础类型

* number
* string
* bealean
* null
* undefined
* symbol
* bigInt

数组类型

* T[]
* Array

函数类型

* function() {}
* () => {}

复杂类型

* {}
* object
* record
* type
* interface

其他类型

* any
* unknow
* never
* void

泛型 T
class
枚举

因为最近要开始写 typescript 做一个简单的复习。