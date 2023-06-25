---
title: type 和 interface 区别
date: 2023-6-15 15:32:28
tags: 
    - javascript
    - typescript
description: 对于区别和共同处。
---

# type 和 interface 区别

### 1. 继承

interface 可以通过 implements 实现继承，然而 type 理论上不能继承。

```ts
interface Animal {
    name: String;
    sex: Number;
    readonly id: String;
}

interface Speak {
    say(to: number): String;
}

interface Person extends Animal, Speak { }
```

`class` 就可以继承 `interface` 取实现方法.

type 想要继承，可以通过交叉类型可以实现

```ts
type Animal1 {
    name: String;
    sex: Number;
    readonly id: String;
}

type Speak1 {
    say(to: number): String;
}

type Person1 = Animal1 & Speak1;
```

也可以实现相同效果

### 2. 合并

如果两个同名的 interface 可以直接合并，如果遇见重名的属性，以后面的为准，type 不行，只会报错。

type 不行，他不能实现这种操作。

### 3. 泛型

接口和类型都可以实现泛型

```ts
interface Box<T> {
    value: T;
    getInfo(): string;
}

type Box1<T> = {
    value: T;
    getInfo(): string;
}
```

### 4. 联合类型，交叉类型

```ts
type MyType = string | number;

let myVar: MyType;
myVar = "Hello"; // 类型为 string
myVar = 123; // 类型为 number
```

联合类型就是都可以使用，不过 interface 也可以

```ts
interface IMyType {
    myType:  string | number
}
```

交叉类型也一样。

```ts
type Person = {
  name: string;
  age: number;
};

type Employee = {
  company: string;
  position: string;
};

type EmployeeWithPerson = Person & Employee;

let employee: EmployeeWithPerson = {
  name: "John",
  age: 30,
  company: "ABC Inc.",
  position: "Manager"
};

interface IEmployeeWithPerson {
    company: string;
    position: string;
    name: string;
    age: number;
}

let employee: IEmployeeWithPerson = {
  name: "John",
  age: 30,
  company: "ABC Inc.",
  position: "Manager"
};
```

效果类似，但是明显 type 更灵活，可以随意组装，任意加载。

### 5. 定义数组顺序

```ts
interface a { a(); }
interface b { b(); }
type list = [a, b];

interface c {
    c: [a, b]
}
```

### 6. typeof 

```ts
const element = document.getElementById('testA');
type d = typeof element; //htmlElement || null

interface d1 {
    el: typeof element
}
```

### 7. 总结

其实主要区别在于继承上，还有接口合并上。

理论上 type 能够实现的 interface 都可以实现，差别只是在于

```ts
interface a {
    b: ...
}

type b = ...
```

从继承上来说，一个是 extends implements 继承，一个是通过联合类型，交叉类型实现，方法不一样，但是可以实现相同效果。

interface 可以使用合并， type 其实也可以使用交叉类型来解决问题。

其实最大的区别在于，interface 需要外面包一个壳子，也就是初始一个对象，但是 type 可以作为一个单独的类型存在, 也就是类型。

期间，不管是使用 字符串字面量类型模板，还是映射类型，还是 typof，条件类型 等等方式，虽然不能直接对 interface 使用，但是可以对 interface 下面的属性使用。


