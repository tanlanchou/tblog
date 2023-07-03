---
title: infer
date: 2023-07-03 22:44:51
tags: 
    - typescript
description: infer 可以在 extends 条件类型的字句中，在真实分支中引用此推断类型变量，推断待推断的类型
---


> infer 是在 typescript 2.8中新增的关键字。
> infer 可以在 extends 条件类型的字句中，在真实分支中引用此推断类型变量，推断待推断的类型。

## 01. infer 有什么用？

> 推导泛型参数

他的本质上就是推导泛型参数

```
type T1<T> = T extends () => infer p ? p : number 
```

判断 T 继承自 () => T, 如果是返回 T， 如果不是返回 number.

而这个 `infer p == T`。

```
type T2 = T1<() => string>
//T2 === string
type T3 = T1<(i: number) => void>
//T3 === number
```

还可以多个参数，进行协变和逆变

```
type T4<T> = T extends (a: infer P, b: infer P) => void ? P : any;
type T5 = T4<() => void>; //any
type T6 = T4<(a:string, b: number) => void> // string & number
```

上面这个是例子是网上看到的例子

> 协变：类型推导到其子类型的过程，A | B -> A & B 就是一个协变
> 逆变：类型推导到其超类型的过程

也就是说参数是一个逆变 `string & nubmer` = never;

```
type User = { name: string, age:number };
type OtherInfo = { sex: string };
type T7 = T4<(a: User, b:OtherInfo) => void> // User & OtherInfo
```

之前的 `ReturnType`

```
type ReturnType<T extends (...args: any) => any> = T 
  extends (...args: any) => infer R ? R : any;
```

### 02. 应用场景

> 一般业务代码用 any 也不要写 infer，因为要顾及可读性和维护性，要不同事也会打人的。
如果有机会你封装 util、hook，甚至是一个 npm 包，你需要通过使用者的输入给予更好的类型提示，infer 就是一个很重要的关键字了。
具体例子有很多，如果你有心翻一翻各种库的 ts 定义就会发现 infer 被大量使用

[redux/src/types/reducers.ts](https://github.com/reduxjs/redux/blob/8ad084251a5b3e4617157fc52795b6284e68bc1e/src/types/reducers.ts#L48)

```
/**
 * Infer a combined state shape from a `ReducersMapObject`.
 *
 * @template M Object map of reducers as provided to `combineReducers(map: M)`.
 */
export type StateFromReducersMapObject<M> = M extends ReducersMapObject
  ? { [P in keyof M]: M[P] extends Reducer<infer S, any> ? S : never }
  : never
  
 

/**
 * Infer reducer union type from a `ReducersMapObject`.
 *
 * @template M Object map of reducers as provided to `combineReducers(map: M)`.
 */
export type ReducerFromReducersMapObject<M> = M extends {
  [P in keyof M]: infer R
}
  ? R extends Reducer<any, any>
    ? R
    : never
  : never

/**
 * Infer action type from a reducer function.
 *
 * @template R Type of reducer.
 */
export type ActionFromReducer<R> = R extends Reducer<any, infer A> ? A : never
```

### 03. link

1. [TypeScript infer 关键字](http://www.semlinker.com/ts-infer/)
2. [infer](https://jkchao.github.io/typescript-book-chinese/tips/infer.html#%E4%B8%80%E4%BA%9B%E7%94%A8%E4%BE%8B)
3. [redux/src/types/reducers.ts](https://github.com/reduxjs/redux/blob/8ad084251a5b3e4617157fc52795b6284e68bc1e/src/types/reducers.ts#L48)
