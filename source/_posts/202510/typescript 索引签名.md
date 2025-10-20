---
title: typescript 索引签名?
date: 2025-10-14 16:05:05
mathjax: true
tags: 
    - typescript
    - 前端
---

# typescript 索引签名
### 什么是索引签名？
> 索引签名是 TypeScript 中一个强大的特性，它允许你为对象定义动态属性的类型，而不是事先列出所有属性。当你在编译时无法确定对象会包含哪些具体属性，但能确定所有属性的键和值的类型时，索引签名就非常有用

比如我们要定义一个对象，想要规范那么就需要索引签名去约束。

比如我只需要一个 key:string value: number 为了检查，为了避免其他人乱写，就可以用索引签名。



### 基本语法
索引签名通常在接口（Interface）或类型别名（Type Alias）中定义，其基本语法为 `[key: KeyType]: ValueType`。 

* `key`：这是一个占位符名称，可以是任意合法的变量名（如 `index` 或 `prop`），其名称本身不重要，只为可读性服务。
* `KeyType`：键的类型，必须是 `string`、`number` 或 `symbol` 中的一种。
* `ValueType`：值的类型，可以是任何有效的 TypeScript 类型。

```typescript
interface Dictionary {
  [key: string]: string;
}
```
这是一个很简单的索引签名

```typescript
const myDict: Dictionary = {
  name: "Alice",
  city: "New York",
};
```
我定义了 `key` 必须是 `string`，`value` 必须是 `string`



### 数字索引
```typescript
interface MyArr {
    [index: number]: string;
}

const myArr: MyArr = ['1', '2', '3'];

//这样也是合法的 
const myArr1: MyArr = {
    0: '1',
    1: '2',
    2: '3',
};
```
他就是个对象，不是数组，这点需要清楚。

只能说 `["1","2","3"] `  他也是合法的，只要满足了条件都是合法的.



### type也可以 
```typescript
type test = {
    [key: string]: string | number;
};
```


### Key的索引限制


> Type 'T' is not assignable to type 'string | number | symbol'.ts(2322)

> 

> Index\_Signatures.ts(28, 12): This type parameter might need an \`extends string | number | symbol\` constraint.



### 泛型
根据上面的索引限制，所以泛型要这样写

```typescript
type test1<T extends PropertyKey,K> = {
    [key in T]: K;
}

type newTest1 = test1<string, string>;
```


### 约束 type 或者 interface 内部元素
```typescript
type test = {
    [key: string]: string;
    1: boolean; 
};
```
> Property '1' of type 'boolean' is not assignable to 'string' index type 'string'.ts(2411)

