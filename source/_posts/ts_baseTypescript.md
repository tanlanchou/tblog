---
title: typescript 基础点
date: 2023-07-03 22:51:51
tags: 
    - typescript
description: 类型，值，申明，接口等等等基础知识
---

## 01. 类型

Number, Tuple, String, Enum, Any, Void, Null, Undefined, Never, Object, Boolean, Symbol

需要说一说的只是 Tuple, Never, Void

**Tuple**

> Tuple 元组类型允许表示一个已知元素数量和类型的数组
> 当访问一个越界的元素，会使用联合类型替代

let x:[string, number] = ["1", 1];

x[3] = "1"; //联合类型替 [String | Number]

**Never & Void**

Never 表示没有任何返回值
Void Null || undefined

## 02. 变量声明

const let var 作用域和ES6相同，别用var就行了。
readonly const 一个是修饰符，一个声明变量
readonly 主要用于接口，类，并且可以不用在声明的时候初始化，第一次赋值后不能再赋值
const 必须初始化的时候赋值。

## 03. interface

和 C# java 差不多，用于类定义，Object定义。
需要注意 implements和extends 差别

implements 接口
extends 类，抽象类

从语义上也可以区分，可以混合继承

1. 只读属性 readonly 属性
2. 可选属性 ?
3. 索引签名 [index: string]: { message: string }; 可以直接在变量声明,也可以之间诶接在变量后面
4. 函数属性 (param1: type, param2: type): boolean
5. 类类型
6. 多继承

## 04. class

```
class a {
	constructor() {}
	private func() {}
}
```

修饰符

1. public 共有
2. protected 内部访问
3. readonly 属性只读
4. private 私有
5. getters/setters 读取器
6. static 静态属性，静态类
7. abstract 抽象类

没有什么特别需要注意的，如果你有后端语言经验的话，基本一致。

非的说一下就是 static 使用。
，
> 在内存级别，将为静态字段创建一部分内存，这些字段将在类中的所有对象之间共享。

为什么要使用？
关键在于状态，不建议在 static 当中保存状态，可能会比较麻烦，更多的用处在于在降低耦合，创建无副作用代码。
比如说数据获取，比如可以提取出的公共操作，返回公共状态，总之就是有抽象价值，对于全局有作用的函数或者属性。

## 05. Function

基本差不多，默认值，解构，`...a: string[]`. 需要注意的是重载问题，支持重载不需要再使用 `typeof`.

## 06. 泛型

```
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}
```

function 也可以使用泛型，总之是在抽象同一类型的对象的时候，节约代码用的。

比如都是手机

```
abstract class phoneAbs {
	call() {
		...
	}
	
	abstract sms(number);
}

class class oldPhone<T: IOldPhone> extends phoneAbs {
	sms(number) { T.sendSMS(number) }
}
```

T也可以 extends，不过记住这里是约束

## 07. 类型推断

简单变量使用ok，因为上下文问题，复杂情况可能推断不出，比如自定义类型

## 08. 高级类型

交叉类型（Intersection Types）

```
interface Ant {
    name: string;
    weight: number;
}

interface Fly {
    flyHeight: number;
    speed: number;
}

// 少了任何一个属性都会报错
const flyAnt: Ant & Fly = {
    name: '蚂蚁呀嘿',
    weight: 0.2,
    flyHeight: 20,
    speed: 1,
};
```

联合类型（Union Types）

```
let a: string | number;
```

任意一个都ok, 但是联合类型会产生一个问题，无法推断出 a 究竟是 String or Number

```
interface Bird {
    fly();
    layEggs();
}

interface Fish {
    swim();
    layEggs();
}

function getSmallPet(): Fish | Bird {
    // ...
}

let pet = getSmallPet();
pet.layEggs(); // okay
pet.swim();  
```

无法推导出究竟是 `Fish` 还是 `Bird`, 所以需要判断。

```
let pet = getSmallPet();
if(<Fish>pet.swim) ...
else <Bird>pet.layEggs();
```

这个时候需要判断类型.

```
if(<Fish>pet.swim) ... //可以直接判断

if(pet instanceof Fish) ... 

function isFish(target): target is Fish  {
	//判断
	...
}

//通过泛型确定方法
function isOfType<T>(
  target: unknown,
  prop: keyof T
): target is T {
  return (target as T)[prop] !== undefined;
}
```

就可以进行判断

## 09. type 类型别名

类型别名有点类似于 `interface`

> 类型别名会给一个类型起个新名字。 类型别名有时和接口很像，但是可以作用于原始值，联合类型，元组以及其它任何你需要手写的类型。

```
type name = string;
function getName(): name { ... }
```

也就是说 `name` 就是 `string`, 还可以使用一些莫名其妙的类型

```
type user<T> = {
	name: string;
	sex: enmu;
	age: number;
	m: T
}

type user<T> = T & string;
type user<T> = T & { name: string, sex: emum }
```

看起来都和接口很像,使用方式也很像

```
type name = string;
let haha: name;
function b(user: name): name { return "" }
```

那么 type 究竟可以做什么.

```
type Container<T> = { value: T }; //范型
type TreeNode<T> = {
	left: TreeNode<T>;
	right: TreeNode<T>
} //自己调用自己
type 使用高级类型, & or | , 就可以实现联合继承.
type a = (x: number, y: number) => number
type b = 'a' | 'b' | 'c'
```

区别

1.type 可以声明基本类型别名，联合类型，元组等类型, 但是 interface 其实也可以,只是不能像 type 那样声明一个变量.
2. type 可以用 typeof 获取实例
3. interface可以合并声明, 两个 interface User 就自己合并了
4. 而且从语义上来说，interface 应该更加偏功能性，type 更加偏类型


## 10. keyof 泛型方法

## 11. 类型索引

## 12. 函数属性

## 13. Symbol

和 javascript symbol 没区别

## 14. 模块

太多细节了，这个需要专门写一篇。

## 15. 命名空间

其实就是整合一个类型的类或者类型统一在一个命名空间下，有点类似之前 C# part，可以在多个不同的文件下。



## 16. 声明合并

Namespace, Class, Enum, Interface, type Alias, Function, Variable
要合并必须要知道他的怎么生成的，所以简单写一下，tsc 编译一下就ok了。
最经典的是 Namespace

```
var user;
(function() { ... })(user || (user = {}))
```

那么他的合并就比较好说

```
let LogName = "test";
namespace logName {
	export const name = "Namespace name"
}
console.log(logName)

var LogName = "test";
var logName;
(function (logName) {
    logName.name = "Namespace name";
})(logName || (logName = {}));
console.log(logName);
```

那么他的先后顺序也会对编译产生影响.
这种合并最好还是独立起名，只是相同的声明，比如 namespace 再采取合并的方式。


## link

https://typescript.bootcss.com/basic-types.html
https://www.jianshu.com/p/57df3cb66d3d
https://zhuanlan.zhihu.com/p/365973520
https://zhuanlan.zhihu.com/p/568705587
https://jkchao.github.io/typescript-book-chinese/typings/indexSignatures.html
