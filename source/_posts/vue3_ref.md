---
title: vue3 ref
date: 2023-6-29 11:51:59
tags: 
    - vue3
    - ref
    - 源码
---

# ref

### 01. 代码

**packages\reactivity\src\ref.ts**

```ts
class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    const useDirectValue =
      this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal)
      triggerRefValue(this, newVal)
    }
  }
}
```

这个是 `ref` 核心代码, 不管是创建 `ref` 或者 `shallowRef` 都是通过 `RefImpl` 去实现的

```
export function shallowRef(value?: unknown) {
  return createRef(value, true)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}
```

首先看看他的**构造函数**

```ts
constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
}
```

这里需要知道 `toRaw` 和 `toReactive` 是做什么的

```ts
export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}
```

> SKIP：用于标记不需要代理为响应式的属性
> IS_REACTIVE：用于标记对象是否为响应式的
> IS_READONLY：用于标记对象是否为只读的
> IS_SHALLOW：用于标记对象是否进行了浅层代理
> RAW：用于存储对象的原始值，方便在需要时获取

这里理解为一个对象有标记，比如对象是 `let o = { a:1 }`，那么这些标记，就是表示对象的属性，意义如上

```ts
export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}
```

`toRaw` 就是递归获取用于存储对象的原始值。

接下来就是 `toReactive`

```ts
export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value
```

**packages\reactivity\src\reactive.ts**

```ts
export function reactive(target: object) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  )
}
```

就是如果是一个 `object` 直接将对象响应式, 也就是 `reactive`, 会把对象转为 `proxy`

现在我们回到构造函数

```ts
constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
}
```

如果 `__v_isShallow` **true**, 也就是 `shallowRef`, 两个值会存储原始值
如果是 `__v_isShallow` **false**, 也就是 `ref`

this._rawValue = value的原始值
this._value = 转换为 `reactive` 对象

**取值和赋值**

```ts
get value() {
    trackRefValue(this)
    return this._value
}

set value(newVal) {
    const useDirectValue =
        this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
        this._rawValue = newVal
        this._value = useDirectValue ? newVal : toReactive(newVal)
        triggerRefValue(this, newVal)
    }
}
```

这里又出来了两个新的方法，`trackRefValue` 和 `triggerRefValue`

```ts
export function trackRefValue(ref: RefBase<any>) {
  if (shouldTrack && activeEffect) {
    ref = toRaw(ref)
    if (__DEV__) {
      trackEffects(ref.dep || (ref.dep = createDep()), {
        target: ref,
        type: TrackOpTypes.GET,
        key: 'value'
      })
    } else {
      trackEffects(ref.dep || (ref.dep = createDep()))
    }
  }
}

export function triggerRefValue(ref: RefBase<any>, newVal?: any) {
  ref = toRaw(ref)
  const dep = ref.dep
  if (dep) {
    if (__DEV__) {
      triggerEffects(dep, {
        target: ref,
        type: TriggerOpTypes.SET,
        key: 'value',
        newValue: newVal
      })
    } else {
      triggerEffects(dep)
    }
  }
}
```

在Vue2.0当中，会在 `Object.defineProperty` 通过 `get` 和 `set` 劫持去解决响应式的核心问题，至少现在来说 `ref` 其实是通过访问器中添加代码去解决的的, `get trackRefValue` 收集依赖，`set triggerEffects` 触发依赖，然后回调。

鉴于目前，我还不是很清楚其中实现过程，先暂时简单的理解为下面内容

> trackRefValue 函数用于追踪响应式引用对象的变化依赖，将当前活动的副作用函数（即当前调用 trackRefValue 函数的函数）添加到响应式引用对象的依赖集合中。在引用对象的值被修改时，会触发相关的依赖执行回调函数。
>
> triggerRefValue 函数用于触发响应式引用对象的依赖更新，会依次执行响应式引用对象的所有依赖，调用它们的回调函数，以实现响应式数据的自动更新。同时，它还会触发依赖于引用对象的 computed 以及 watchEffect 等响应式函数的更新。

在大概清楚了这个概念以后，我们可以回过头看访问器。

```ts
get value() {
    trackRefValue(this)
    return this._value
}
```

在 `dep` 中新增一个依赖，然后返回 `_value`

```ts
set value(newVal) {
    const useDirectValue =
        this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
        this._rawValue = newVal
        this._value = useDirectValue ? newVal : toReactive(newVal)
        triggerRefValue(this, newVal)
    }
}
```

判断 `newVal` ， `this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)`

> IS_READONLY：用于标记对象是否为只读的
> IS_SHALLOW：用于标记对象是否进行了浅层代理

主要用于区分是否是浅层代理，如果是 `newVal` 等于本身，如果不是，通过 `toRaw` 返回原始值

接下来对比新的值和原始值是否一致，如果不一致

存储原始值，并且根据 useDirectValue，是否响应式处理 newVal, 最后触发追踪，更新。

### 02. 梳理

`RefImpl` 只提供 value 访问器

如果是 shallowRef, 并不对值做响应式处理，他的响应式只是在 get，set 中进行依赖收集和触发，你输入什么，那么我接收什么，我也返回什么。

如果是 ref, 在 shallowRef 的基础之上，增加了对于值的响应式，输入值，返回响应式处理以后的值，其他一样。

所以 ref 和 shallowRef 两者的相同和不同就很明显了。


