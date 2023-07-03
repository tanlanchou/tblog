---
title: ConstructSignature 错误
date: 2023-07-03 22:33:01
tags: 
    - typescript
description: 解决问题的构造函数签名
---

# ConstructSignature

看构造函数签名起源于一个错误

```ts
abstract class commonMobileFunc {
  abstract call(ph: number): void;
  abstract sms(ph: number, text: string): void;
}

class oldMobile extends commonMobileFunc {
  call(ph: number): void {}
  sms(ph: number, text: string): void {}
}

class newMobile extends commonMobileFunc {
  call(ph: number): void {}
  sms(ph: number, text: string): void {}
  videoCall(ph: number) {}
}

class exec<T> {

  model: T;
  constructor(arg: T) {
    this.model = new arg();
  }

  sms(ph: number, text: string) {
    this.model.sms(ph, text);
  }
}
```

> 抽象出一个通用的手机功能类型
> 新手机 call sms videoCall
> 旧手机 call sms
> 如果我想实例化对象，可以通过工厂方法，依赖注入等等方式
> 这次想通过泛型的方法去实例化，但是报错了。

但是构造函数签名可以解决这个问题

### 01. 什么是构造函数签名

语法

> ConstructSignature: new TypeParametersopt (ParameterListopt) TypeAnnotationopt

TypeScript 官方解释

> An object type containing one or more construct signatures is said to be a constructor type. Constructor types may be written using constructor type literals or by including construct signatures in object type literals.

机翻

> 包含一个或多个构造签名的对象类型被称为构造函数类型。 构造函数类型可以使用构造函数类型文字或通过在对象类型文字中包含构造签名来编写。

也就是下面这种

```ts
new <T1,T2 ...>(p1, p2) => Result
```

这样问题就得到了解决, 沿用最开始抽象的例子

```ts
interface I1 {
  new (): commonMobileFunc;
}

class C2 {
    model: commonMobileFunc;
    constructor(arg: I1) {
        this.model = new arg();
    }
}
```

除此之外，还可以用简写的方式

```ts
class C2 {
    model: commonMobileFunc;
    constructor(arg: { new(): commonMobileFunc }) {
        this.model = new arg();
    }
}
```

### 02. 泛型构造函数签名

```ts
interface T3<T> {
  new (): T;
}

interface T4 {
    sms(ph: number, text: string): void;
    call(ph: number): void;
}

class C3<T> implements T4 {
  model: T;
  constructor(arg: T3<T>) {
    this.model = new arg();
  }

  sms(ph: number, text: string): void {
      //..
  }

  call(ph: number): void {
      //..
  }
}
```

如果需要智能提示，可以增加约束

### 03. 应用场景

我们可以创建一个泛型工厂

```
function F1<T>(arg: { new():T }) {
    return new arg();
}
```

我上文写的也是一种工厂，比如我想实现依赖注入,就是源于类似的思路

### 04. 定义了构造器签名的接口无法被实现

```
interface T2<T> {
  new (): T;
}

class C5<T> implements T2<T> {
    constructor(arg: T) {
        
    }
}
```

> Class 'C5 T' incorrectly implements interface 'T2 T'.
> Type 'C5 T' provides no match for the signature 'new (): T'.ts(2420)

我觉得这个应该实现


### 05. link

1. [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
2. [How does interfaces with construct signatures work?](https://stackoverflow.com/questions/13407036/how-does-interfaces-with-construct-signatures-work)
3. [一文读懂 TypeScript 泛型及应用（ 7.8K字）](https://juejin.cn/post/6844904184894980104#heading-14)


