---
title: 什么是MIT协议?
date: 2025-10-16 16:05:05
mathjax: true
tags: 
    - typescript
    - 前端
---

# typescript record
## 
```typescript
Record<string | number | symbol, any>
```
> 构造一个对象类型，其属性key是Keys,属性value是Type。被用于映射一个类型的属性到另一个类型。

> 

> 简单来说，TypeScript中的Record可以实现定义一个对象的 key 和 value 类型，Record 后面的泛型就是对象键和值的类型。

定义一个对象的key和value的类型。



```typescript
type A = Record<string, any>
```
那么结果就是

```typescript
const a:A = {
 "a": { a: 1 }
}
```
我 `key` 用了 `string` 就合法了.



玩法还是比较多的

```typescript
//这些用或去限定, key 和 value 都可以限定
type User = Record<"id" | "name" | "age", string>;


//可以用symbol 去限定枚举
const s1 = Symbol("s1");
const s2 = Symbol("s2");
type SymbolMap = Record<typeof s1 | typeof s2, number>;


//不光用symbol，用枚举也行
enum Status {
  Loading = "loading",
  Success = "success",
  Error = "error",
}
type StateData = Record<Status, string>;
//然后
const data: StateData = {
  [Status.Loading]: "加载中",
  [Status.Success]: "成功",
  [Status.Error]: "失败",
};


//我们可以提前写一个，直接放进去
type Action = "start" | "stop" | "pause";
type ActionHandlers = Record<Action, () => void>;

//用keyof也行
type RequiredUser = { id: number; name: string };
type PartialUser = Record<keyof RequiredUser, string | number | undefined>;

//后面也不仅仅是简单对象，我可以强制你都相同，当然也可以可选
type ModuleConfig = Record<string, { enable: boolean; version: string }>;

//也可以用泛型去玩
type Flags<T> = Record<keyof T, boolean>;
type User = { id: number; name: string; age: number };
type UserFlags = Flags<User>;


```


甚至，他还可以做嵌套

```typescript
type Matrix<T> = Record<string, Record<string, T>>;
```
---
[https://juejin.cn/post/7040805750775480350](https://juejin.cn/post/7040805750775480350)

[https://zhuanlan.zhihu.com/p/356662885](https://zhuanlan.zhihu.com/p/356662885)

