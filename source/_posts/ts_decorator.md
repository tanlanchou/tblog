---
title: 装饰器(js & ts)
date: 2023-07-03 22:36:51
tags: 
    - typescript
    - javascript
description: 什么是装饰器，以及装饰器在 ts 中的用法
---

### 01. js版本

之前在看 typescript decorators 的时候想起 js 其实也有 decorators, 于是翻了一下阮一峰的 es6 教程。
在自己测试的时候，发现不光是编辑器提示错误，并且在浏览器中也不支持，通过nodejs尝试，也不行。

于是查了一下

https://caniuse.com/decorators

并不支持，想要使用特性

1. react
2. typescript
3. babel

Es6原生语法

https://es6.ruanyifeng.com/#docs/decorator

### 02. typescript decorators

不管是 C#，java 或者 ag，nest.js 只要你使用过对这个东西就不会陌生。

> 随着TypeScript和ES6里引入了类，在一些场景下我们需要额外的特性来支持标注或修改类及其成员。 装饰器（Decorators）为我们在类的声明及成员上通过元编程语法添加标注提供了一种方式。 Javascript里的装饰器目前处在 建议征集的第二阶段，但在TypeScript里已做为一项实验性特性予以支持。
> 注意  装饰器是一项实验性特性，在未来的版本中可能会发生改变。
> 若要启用实验性的装饰器特性，你必须在命令行或tsconfig.json里启用experimentalDecorators编译器选项：

要使用这个你需要

```
tsc --target ES5 --experimentalDecorators --emitDecoratorMetadata

or

{
    "compilerOptions": {
        "target": "ES5",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

文档中介绍了这几种装饰器

1. 类装饰器
2. 方法装饰器
3. 访问器装饰器
4. 属性装饰器
5. 参数装饰器

也就是主要用途是给类，function，以及里面的属性，参数，访问器服务。



基本语法

```
function decoratorA(target) {
	...
}

function decoratorB(value:boolean) {
	return function(target, key, desc) {
		....
	}
}
```

区别主要在于是否传参数

```
@decoratorA
@decoratorB(false)
```

每个装饰器用在不同的对象上参数是不一样的。

这样就是一个最简单的装饰器

### 03. 执行时机

我们需要知道什么时候执行装饰器

> 装饰器只在解释执行时应用一次

```
function log(value: string): any {
  console.log(`log function ${value}`);
  return function () {
    //省略参数，因为我不需要
    console.log(`log return function ${value}`);
  };
}

@log("类")
class testLog {
  @log("属性")
  B: number;

  @log("静态属性")
  static C: number;

  @log("方法")
  A() {}

  @log("静态方法")
  static D() {}

  F(@log("参数") i: number) {}

  @log("访问器")
  set X(arg) {}
}
```

返回信息

```
log function 属性
return function 属性
index.js:66 log function 方法
return function 方法
index.js:66 log function 参数
return function 参数
index.js:66 log function 访问器
return function 访问器
index.js:66 log function 静态属性
return function 静态属性
index.js:66 log function 静态方法
return function 静态方法
index.js:66 log function 类
return function 类
```

> 属性 > 方法 > 参数 > 访问器 > 静态属性 > 静态方法 > 类

然后就是相同装饰器，比如一个类有两个装饰器的情况下

```
@log("类")
@log("类1")
class testLog {
  @log("属性")
  @log("属性1")
  B: number;

  @log("静态属性")
  @log("静态属性1")
  static C: number;

  @log("方法")
  @log("方法1")
  A() {}

  @log("静态方法")
  @log("静态方法1")
  static D() {}

  F(@log("参数") i: number, @log("参数1") y: number) {}

  @log("访问器")
  @log("访问器1")
  set X(arg) {}
}
```

输出

```
log function 属性
index.js:66 log function 属性1
return function 属性1
return function 属性
index.js:66 log function 方法
index.js:66 log function 方法1
return function 方法1
return function 方法
index.js:66 log function 参数
index.js:66 log function 参数1
return function 参数1
return function 参数
index.js:66 log function 访问器
index.js:66 log function 访问器1
return function 访问器1
return function 访问器
index.js:66 log function 静态属性
index.js:66 log function 静态属性1
return function 静态属性1
return function 静态属性
index.js:66 log function 静态方法
index.js:66 log function 静态方法1
return function 静态方法1
return function 静态方法
index.js:66 log function 类
index.js:66 log function 类1
return function 类1
return function 类
```

也就是说先放先执行构造函数，后面装饰器的后执行构造函数，但是先执行回调。
总的来说，就是后放先执行。



### 04. 类装饰器

```
type ClassDecorator = <TFunction extends Function>
(target: TFunction) => TFunction | void;
```

可以做什么？

> 如果类装饰器返回了一个值，她将会被用来代替原有的类构造器的声明。
因此，类装饰器适合用于继承一个现有类并添加一些属性和方法。
> 例如我们可以添加一个toString方法给所有的类来覆盖它原有的toString方法。
> 也就是说其实只能对构造函数进行重载，当然也够用了


```
function classDecorator<T extends { new (...args: any[]) }>(constructor: T) {
  return class extends constructor {
    title = "classDecorator title";
	toString() {
		...
	}
  };
}
```

上面的装饰器 classDecorator 重载了类的构造函数，并且新建属性 title， 重载了 `toString()` 输出。

### 05. 属性装饰器

```
type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
```

@**参数**

1. target 目标
2. propertyKey 属性名

@**可以做什么**

> 监控变化
> 重写属性
> 收集信息
> 标记验证

等等，比如说实现一个 readonly

```
function myReadonly(target: Object, key: string) {
  Reflect.defineProperty(target, key, {
    set(v) {
      if (this.key === undefined) {
        this.key = v;
      } else {
        throw new Error(`${key} is readonly`);
      }
    },
  });
}

class C {
  @myReadonly
  foo: string = "a";
}

let myC = new C();
myC.foo = "aaaaaaa";
console.log(myC.foo);
```

### 06. 方法装饰器

@**参数**

1. target: 对于静态成员来说是类的构造器，对于实例成员来说是类的原型链。
2. propertyKey: 属性的名称。
3. descriptor: {
	value
	writable
	enumerable
	configurable
}

@**返回**

1. 如果返回了值，它会被用于替代属性的描述器。

@**场景**

几乎可以适用任何场景，你甚至可以重写方法。

```
descriptor.value === Function
```

```
function logger(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = function (...args) {
    console.log('params: ', ...args);
    const result = original.call(this, ...args);
    console.log('result: ', result);
    return result;
  }
}

class C {
  @logger
  add(x: number, y:number ) {
    return x + y;
  }
}

const c = new C();
c.add(1, 2);
```

### 07. 访问器装饰器

@**参数**

1. target
2. propertyKey
3. descriptor { 
	get
	set
	enumerable
	configurable
}

需要注意的是，不管是给 `get` or `set` 添加访问器，添加一个就相当于都添加了

@**返回** 忽略

@**场景**

其实和方法差不多，重写，加日志等等，只要你想得到。

### 08. 参数装饰器

@**参数**

1. target: 对于静态成员来说是类的构造器，对于实例成员来说是类的原型链。
2. propertyKey: 属性的名称(注意是方法的名称，而不是参数的名称)。
3. parameterIndex: 参数在方法中所处的位置的下标。

@**返回** 

忽略

@**场景**

验证，验证方式，日志等等。

### 09. 例子

如果我需要写一个类的参数的装饰器。

```
// 1. 属性 > 方法 > 参数 > 访问器 > 静态属性 > 静态方法 > 类
// 2. 装饰器只在解释执行时应用一次
// 3. 所以需要在方法或者类装饰器解析的时候，重载为必包，先验证参数，后调用
// 4. 需要有变量保存验证的函数
// 5. 需要工厂方法，或者抽象类去写清楚各种不同的验证

//验证类型
type Validator = (x: any) => boolean;

//验证方法集合
let validatorMap = new Map<string, Validator>();

//属性验证装饰器工厂
function validatorFactiory(vaildator: Validator) {
  return function (target, key, index) {
    let keyStr = key as string;
    let t = validatorMap[keyStr] ?? [];
    t[index] = vaildator;
    validatorMap.set(key, t);
  };
}

//暂时不需要参数
//
function valid(target: any, key: string, descriptor: PropertyDescriptor) {

  //保存原有方法
  const original = descriptor.value;

  descriptor.value = function (...args) {

    //验证参数
    for (let i in args) {
      let validtors = validatorMap.get(key);
      if (validtors !== undefined) {
        for (let i = 0; i < validtors.length; i++) {
          if(!validtors[i](args[i])) {
            throw new Error(`${key} 值为 ${args[i]}, 验证失败`);
          }
        }
      }
    }

    original.call(this, { ...args });
  };
}

const validString = validatorFactiory((v: any) => {
  return typeof v === "string";
});
const validNumber = validatorFactiory((v: any) => {
  return Number.isInteger(v);
});

class C {
  @valid
  a(@validString a) {
    return a;
  }
}

let myC = new C();
myC.a(1);
```

这里就写了一个简单的装饰器，不仅如此，比如我要写一个解析 request body的装饰器，也可以这样写。



### 11. link

[阮一峰 es6 装饰器](https://es6.ruanyifeng.com/#docs/decorator)

[typescript 中文文档 装饰器](https://www.tslang.cn/docs/handbook/decorators.html)

[Reflect Metadata typescript](https://jkchao.github.io/typescript-book-chinese/tips/metadata.html#%E5%9F%BA%E7%A1%80)

[What does <T extends { new(...args: any[]): {} }>(constructor:T) mean in typescript?](https://stackoverflow.com/questions/58057916/what-does-t-extends-new-args-any-constructort-mean-in-typescr)

[TypeScript 中的 Decorator & 元数据反射：从小白到专家（部分 I）(https://zhuanlan.zhihu.com/p/20297283)

[What is `Reflect.decorate` in JS code transpiled from TS?](https://stackoverflow.com/questions/45165224/what-is-reflect-decorate-in-js-code-transpiled-from-ts)

[tc39 Decorators](https://github.com/tc39/proposal-decorators)

[typescript TS1241: Unable to resolve signature of method decorator when called as an expression](https://stackoverflow.com/questions/37694322/typescript-ts1241-unable-to-resolve-signature-of-method-decorator-when-called-a)

[reflect-metadata](https://github.com/rbuckton/reflect-metadata)

[Reflect Metadata](https://jkchao.github.io/typescript-book-chinese/tips/metadata.html#%E5%9F%BA%E7%A1%80)

[什么是元数据？为何需要元数据?](https://www.zhihu.com/question/20679872)

[元数据,阮一峰](https://www.ruanyifeng.com/blog/2007/03/metadata.html)

[TypeScript装饰器完全指南](https://mirone.me/zh-hans/a-complete-guide-to-typescript-decorator/)

