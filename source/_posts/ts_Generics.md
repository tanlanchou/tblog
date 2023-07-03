---
title: 泛型
date: 2023-07-03 22:49:51
tags: 
    - typescript
description: 泛型基本语法和使用
---

官网这一章从最开始的泛型基本语法讲起，然后通过 keyof， typeof，ReturonType 等方式来类型，更方便的创建类型，只是后面玩的太花了，我确实想不到这么多玩法有什么应用类型，可能后续 typescript 用的多了以后再来复习吧。

### 01. Generics 泛型

泛型最基础的就是 function or class 的形变，主要用于相同逻辑，相同的接口的抽象。
****
> 在像 C# 和 Java 这样的语言中，可以使用泛型来创建可重用的组件，一个组件可以支持多种类型的数据。 这样用户就可以以自己的数据类型来使用组件。

语法很简单，就是增加一个任意类型的 `T`

```
function log<T>(arg:T) ****:T { return arg }
class log<T extends Ilogs> {

}
```

引入一个泛型，在声明的时候可以传入对应想要的类型。

```
log<string>("");
new log<testLog>();
```

这个字是什么不重要，主要是表达这个泛型的意思

1. T = Type
2. K = Key
3. V = Value
4. E = Element

理论上你用 `B` 也可以，重要的是他的意义，你需要传递什么，用什么为基础来重用。

```
function log<T>(arg: T):T { return arg };
```

他的核心就在于传递类型，以及你需要 `function` 里面写什么代码进行复用。

这就是最基础的语法，后续可以有很多变种，这种是最基础的用法

interface, type 都可以使用泛型。

```
type a<T> = T & string;
interface ITree<T> {
    value: Object
    parent:T
    child: T[]
}  
```

那么就可以和泛型类进行联动

```
class tree<T> extends ITree<T> {
    root: T;
    constructor() {}
    create: function(tree: T[]) {
        /...
    }
}  
```

创建一个跟树相关的泛型类，`ITree` 就可以一个基础泛型树型接口。

### 02. 约束

从开头到现在，泛型是一个任意类型，自然可以增加约束。

```
function A<T extends ITree>(arg: T): void {
    //...
}
```

这里的 extends 你其实可以理解为一种继承，但是只能引用继承到的接口或者类型，换一种说法就是一种约束。

好处就是，可以从任意类型到指定一个范围，比如刚才约束为 `ITree` 的例子，就可以确定 `arg` 类型一定包含 `ITree` 的接口，于是可以调用。

```
function A<T extends string>(arg: T) {
    return arg.length;
}
```

### 03. keyof

其实上代码最好理解这个东西的用法

```
interface User {
    name: string,
    age: number,
    sex: number
}

type K1 = keyof User;
```
这个 `keyof User` 其实相当于 `type K1 = name | age | sex`, 并且值是 `key` 的值。

他有什么用呢？

```
let user: User = { ... };
function getUserItem<T extends keyof User>(arg: T) {
    return user[arg];
}

function getUserItem(arg) {
    if(arg === "name" || arg === "age" || arg === "sex") return user[arg];
    else return ...]
}
```

这两个就是差别。


### 04. typeof & ReturnType

一般来说 `typeof` 就是返回原始类型的, 但是在 typescript 里有不一样的用处

```
let O = {
  a: 1,
  b: 2,
  c: 3,
};
type A3 = typeof O; // { a:1, b:2, c:3 }
type A4 = typeof O["a"]; //string
```

可以看到，如果是基础类型，直接返回。

如果是复杂类型，直接返回类型本身

```tsx
function F():string {
    return "";
}

function F1() {
    return {
        name: "tommy",
        age: "99"
    }
}

type T3 = typeof F;
type T4 = typeof F1;
```

[Playground Link](https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABAMQBQEoBcBnKAnGMAc0QG8AoRKxPAUyhDyQCJmBucgX3PNElgQoAjBjKVqdBkzHVZiMAEMAtrUyJmUOEqUBPZgBpxcxAqKr1ATgvMjibt3JQdAB1qIAKgGZEAXkRPXOGAUDgC3dwAWX38XWiDhNiA)

那么如果需要获取返回值的类型如何解决？

```tsx
function F():string {
    return "";
}

function F1() {
    return {
        name: "tommy",
        age: "99"
    }


type T5 = ReturnType<typeof F>;
type T6 = ReturnType<typeof F1>;
```

[Playground Link](https://www.typescriptlang.org/play?ssl=13&ssc=33&pln=12&pc=32#code/GYVwdgxgLglg9mABAMQBQEoBcBnKAnGMAc0QG8AoRKxPAUyhDyQCJmBucgX3PNElgQoAjBjKVqdBkzHVZiMAEMAtrUyJmUOEqUBPZgBpxcxAqKr1ATgvMjibjyg6ADrUQAVAKyIAvIgBK9Ixgbs60ADyOLnDAKAB8HJGubgBsPv6BTCEuEaHRwvFAA)

### 05. Indexed Access Types 索引访问类型

```tsx
ttype Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];
//   ^?


// ---cut---
type I1 = Person["age" | "name"];
//   ^?

type I2 = Person[keyof Person];
//   ^?

type AliveOrName = "alive" | "name";
type I3 = Person[AliveOrName];
//   ^?

const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];

type Person = typeof MyArray[number];
//   ^?
type Age = typeof MyArray[number]["age"];
//   ^?
// Or
type Age2 = Person["age"];
//   ^?

type key = "age";
type Age = Person[key];
//   ^?

```
[Playground Link](https://www.typescriptlang.org/play?#code/C4TwDgpgBAChBOBnA9gOygXigbygQwHMIAuKVAVwFsAjBAbjL0pKkWHgEtUCG8AbDgDcW1ZMj4Q86AL50AUKEhQAgkUywEKVAG0ARIQi6AuvID0pqJYB6Afjn3zUALQuAxuWAunC8NACSAIzqcEhoega6UAA+ULqoTIYmco7Wdj5KfgBMwZphANYQIMgAZhqhqEkpULb2itDKAsIA8vAAcgnq+o2G0bHxzLrydVB+AMw55doNQhAt7cyVFqn2rmhsUACyIMrw8Hgg6tpylrj9LLrTroYANPhEpAEArFDS18c4jMykugBCyNS6W4GUiZcavd6nBLfACiwkBdxYowAHC83kl0tAQlp1HUSpttrt9toKDQEItLNU7MNVNAsLjSlsdnsQMSqLR4EZwkRjGYlpTkhYWhiVERslgsWF9NzycthQUDlgpYYhr4RbSylptPKZZSgA)

根据索引访问 `type`

### 06. 条件类型

有意思的 `extends` 用法

```
class a extends b { }
class a<T extends b> {}
```

然而这里却是一个判断

```ts
interface Animal {
  live(): void;
}
interface Dog extends Animal {
  woof(): void;
}

type Example1 = Dog extends Animal ? number : string;
type Example2 = RegExp extends Animal ? number : string;
```
[Playground Link](https://www.typescriptlang.org/play?#code/JYOwLgpgTgZghgYwgAgIImAWzgG2QbwChlkdgA3CACgEoAuZcge2ABMBuQgX0NElkQoAIkwDmyCAA9IIVgGc0GbHiIkA7kyYxaDZm049CYAJ4AHFAFFJcTKZwQAjMgC8yEeKkz5irLmQB+ZBAAV0wAI2hkBjkwKFBRTgB6RJJkAD1-QiMzS2tbewAmF2QAJQhRK1MJaQhZBXRfPECQ8Mjo2PiklJIMoA)

判断继承自哪里

```
SomeType extends OtherType ? TrueType : FalseType;
```

### 07. Mapped Types 映射类型

这里又引入和很多概念

```
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
```

`Property` 是属性，这里写做 `Property`, 使用 ABCDEFG，或者其他单词都可以。

`in` 表示 `Property` 在 `keyof Type` 里

```
type FeatureFlags = {
  darkMode: () => void;
  newUserProfile: () => void;
};
 
type FeatureOptions = OptionsFlags<FeatureFlags>;
```

那么根据官方的例子，`[Property in keyof FeatureFlags]`, 也就是说 `FeatureFlags = darkMode | newUserProfile`

这就是映射，将 `FeatureFlags` 映射到一个新类型。

**映射修饰符**

> 可以通过以 或 为前缀来删除或添加这些修饰符。如果您不添加前缀，则假定。-++

```ts
type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};

type CreateMutable1<Type> = {
  +readonly [P in keyof Type]: P;
};

type LockedAccount = {
  readonly id: string;
  name: string;
};

type T10 = CreateMutable1<LockedAccount>;
type T11 = CreateMutable<LockedAccount>;
```

这样 `+-` 会导致不一样的结果。

`T11` 会取消所有的 `readonly`

`T10` 所有都会增加 `readonly`

作用于修饰符，那么所有修饰符都会受到这个符号限制

[TypeScript 中的修饰符](https://juejin.cn/post/7031450398959337486)


**Key Remapping via as**

用 as 重新映射 key

> In TypeScript 4.1 and onwards

as 其实是一种断言。

```
let A: any = 18
let B = A as string;

let C:number = 18;
let D:string = D as unknow as string;

let F:string | number = 18;
let E:string = F as string;
```

在类型中的应用

```
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P]
}

interface Person {
  name: string;
  age: number;
  location: string;
}

type LazyPerson = Getters<Person>;
```

### 08. Exclude & Extract

Exclude

> type Exclude<T, U> = T extends U ? never : T

```
type Fruits = "apple" | "banana" | 'peach' | 'orange';
type DislikeFruits = "apple" | "banana";
type FloveFruits = Exclude<Fruits, DislikeFruits> // 等效于 type FloveFruits = "peach" | "orange"

// 实际上 Exclude 进行的比较
type FloveFruits =
  | ("apple" extends "apple" | "banana" ? never : "apple")
  | ("banana" extends "apple" | "banana" ? never : "banana")
  | ("peach" extends "apple" | "banana" ? never : "peach")
  | ("orange" extends "apple" | "banana" ? never : "orange")
// 所以最后的结果
type FloveFruits = "peach" | "orange"
```

例子来源 [typescript 之 Exclude 和 Extract](https://www.typescriptlang.org/docs/handbook/2/generics.html)

例子说明了 `Exclude` 每个字段和整个DislikeFruits 判断继承，如果 true : never : `Exclude` 字段.

`Extract` 恰好和 `Exclude` 相反

> type Extract<T, U> = T extends U ? T : never

```
type Fruits = "apple" | "banana"  | 'peach' | 'orange';
type DislikeFruits = "apple" | "banana";
type FloveFruits = Extract<Fruits, DislikeFruits> // 等效于 type FloveFruits = "apple" | "banana"
```

需要注意的是现在不管是 `Exclude` 还是 `Extract` 都是使用联合类型作为参数，如果对象或者接口，就是整个 `extends`.


### 09. Omit & Pick

> type Pick<T, K extends keyof T> = {
> 	[key in k]: T[key]
> }

```
interface TState {
	name: string;
	age: number;
	like: string[];
}

type T28 = Pick<TState, "name" | "age">;

//结果
type T28 = {
    name: string;
    age: number;
}
```

> type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>; 

利用 `Pick` 来创建 Omit, Omit 是排除。

两者互为补充，如果排除少量的 Key 使用 Omit, 排除大量的使用 `Pick`

### 10. Partial

> Partial 的作用就是将某个类型里的属性全部变为可选项 

```
type Partial<T> = {
    [P in keyof T]?: T[P];
};
```

### 11. Record

> Record<K extends keyof any, T> 的作用是将 K 中所有的属性的值转化为 T 类型。

```
type Record<K extends keyof any, T> = {
    [P in K]: T;
};
```

### 12. 总结

01. 泛型
02. 约束: extends 来限制 T 的类型或者范围
03. keyof: 获取类型的所有Key
04. typeof & ReturnType 通过 typeof 返回全部对象类型，ReturnType和type配合获取返回值的类型
05. Indexed Access Types 通过索引获取type
06. 条件类型 通过类似三元表达式的方式 a extends T ? "string" : "number"
07. Mapped Types: Property 关键字，in，+- 修饰符
08. Exclude & Extract: Exclude<T, U> T extends U ? never : T; T = T的每一项，Extract 返回值相反
09. Omit & Pick Pick选择，Omit排除
10. Partial 所有都类型转换为 ?
11. Record 所有类型转换为 T

泛型的基础概念是什么，传入动态类型，让代码可以最高程度的复用，为了帮助复用造就了这么多方法。


### 13. link



1. [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
2. [泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)
3. [TS typeof 操作符原来有这五种用途！](https://www.51cto.com/article/711374.html)
4. [一文读懂 TypeScript 泛型及应用（ 7.8K字）](https://juejin.cn/post/6844904184894980104#heading-15)
5. [Conversion of type 'X' to type 'Y' may be a mistake in TS](https://bobbyhadz.com/blog/typescript-conversion-of-type-to-type-may-be-mistake)
6. [TypeScript - 理清Omit与Exclude的关系与区别](https://blog.csdn.net/pfourfire/article/details/125301619)
7. [学习TypeScript 之 Pick与泛型约束](https://blog.csdn.net/qq_28992047/article/details/106879772)
