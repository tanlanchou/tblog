---
title: vue3 reactive
date: 2023-06-29 12:01:01
tags: 
    - vue3
    - reactive
    - 源码
---

# reactive

要了解这个东西，你起码需要对 Proxy 和 Reflect 有最基本的了解

其次，我是真的讨厌三目表达式嵌套。

### 01. createReactiveObject

入口方法是 `createReactiveObject`

```ts
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // only specific value types can be observed.
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
  proxyMap.set(target, proxy)
  return proxy
}
```

`!isObject(target)` 不是 `Object` 返回


`target[ReactiveFlags.RAW] && !(isReadonly && target[ReactiveFlags.IS_REACTIVE])` 
`target` 包含 `ReactiveFlags.RAW` 并且 不是 `readonly` 或 `target` 不包含 `ReactiveFlags.IS_REACTIV` 返回 target

> target 已经是 Proxy，返回它。
> 异常：在反应对象上调用 readonly()

接下来判断是否已经存在这个 `proxy`, 在 `proxyMap` 中查找，如果有，直接返回。

然后判断允许 proxy 的类型

> only specific value types can be observed.

```ts
function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
    default:
      return TargetType.INVALID
  }
}

function getTargetType(value: Target) {
  return value[ReactiveFlags.SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}
```

他会把传入分类，判定接收的类型，不是 `SKIP` 或者不能 操作的值，然后通过 `Object.toString().call` 判定类型，并且返回 `TargetType`

```ts
const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
)
proxyMap.set(target, proxy)
return proxy
```

这里比较简单就是代理，并且加入代理的 `Map`

### 02. handler

`reactive`, `shallowReactive`, `readonly`, `shallowReadonly` 都是在这里创建的, 代码都是通过 `createReactiveObject` 创建, 例如

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
`mutableHandlers` & `mutableCollectionHandlers`, 先看 `mutableHandlers`

```ts
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
```

### 04. haddler get

```ts
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow
    } else if (
      key === ReactiveFlags.RAW &&
      receiver ===
        (isReadonly
          ? shallow
            ? shallowReadonlyMap
            : readonlyMap
          : shallow
          ? shallowReactiveMap
          : reactiveMap
        ).get(target)
    ) {
      return target
    }

    const targetIsArray = isArray(target)

    if (!isReadonly) {
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      if (key === 'hasOwnProperty') {
        return hasOwnProperty
      }
    }

    const res = Reflect.get(target, key, receiver)

    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res
    }

    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    if (shallow) {
      return res
    }

    if (isRef(res)) {
      // ref unwrapping - skip unwrap for Array + integer key.
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

const set = /*#__PURE__*/ createSetter()
const shallowSet = /*#__PURE__*/ createSetter(true)
```

`createGetter` 是一个 `get` 工厂, 用于个各种 get 创建。


```ts
if (key === ReactiveFlags.IS_REACTIVE) {
    return !isReadonly
} else if (key === ReactiveFlags.IS_READONLY) {
    return isReadonly
} else if (key === ReactiveFlags.IS_SHALLOW) {
    return shallow
} else if (
    key === ReactiveFlags.RAW &&
    receiver ===
    (isReadonly
        ? shallow
        ? shallowReadonlyMap
        : readonlyMap
        : shallow
        ? shallowReactiveMap
        : reactiveMap
    ).get(target)
) {
    return target
}
```

这里是判断是否是一些特殊值，进行特殊的返回，最后一个判断是如果通过 `isReadonly` & `shallow`,来判断应该用哪个 `Map` 来判断是否需要返回缓存。

```ts
const targetIsArray = isArray(target)

if (!isReadonly) {
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
    return Reflect.get(arrayInstrumentations, key, receiver)
    }
    if (key === 'hasOwnProperty') {
    return hasOwnProperty
    }
}
```

如果不是 `readonly`, 是 `array` 并且 `arrayInstrumentations` 包含 `key`

```ts
return Reflect.get(arrayInstrumentations, key, receiver)
```

如果是 key === 'hasOwnProperty', 则返回使用这个方法

```ts
function hasOwnProperty(this: object, key: string) {
  const obj = toRaw(this)
  track(obj, TrackOpTypes.HAS, key)
  return obj.hasOwnProperty(key)
}
```

这里需要说的是 `arrayInstrumentations`, 他劫持了设计者想要代理的方法

> 这个方法的主要作用是为了拦截一些对数组进行操作的方法，例如 push、pop、shift 等，以及一些查询数组的方法，例如 includes、indexOf、lastIndexOf 等。当对这些方法进行操作时，会调用 track 方法来收集数组的依赖关系，并在需要时通过 trigger 方法触发重新渲染视图。
>
> 同时，当调用这些方法时也需要注意避免无限循环的问题，因为一些数组操作可能会导致长度改变，从而导致重新触发这些方法。为了避免这种情况，对于长度变化的操作方法，例如 push、pop、shift 等，会在方法执行前暂停依赖追踪，执行完毕后再恢复依赖追踪。
>
> 最终，createArrayInstrumentations 方法会返回一个对象，该对象包含针对数组对象的代理方法，例如 push、pop、shift、unshift、splice、includes、indexOf、lastIndexOf 等。这些方法被用于在 reactive、shallowReactive、readonly 和 shallowReadonly 等响应式数据类型中对数组对象进行拦截和代理。

```ts
function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, TrackOpTypes.GET, i + '')
      }
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetTracking()
      return res
    }
  })
  return instrumentations
}
```

上半部分是将 提供 `['includes', 'indexOf', 'lastIndexOf']` 方法的劫持，添加 `tarck` 之后返回。

下半部分在 `['push', 'pop', 'shift', 'unshift', 'splice']` 执行的时候暂停和恢复 `track` 

在完成了类数组的劫持后, `const res = Reflect.get(target, key, receiver)` 通过反射获取本应该取到的值。

接下来 `if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {` 

```ts
const builtInSymbols = new Set(
  /*#__PURE__*/
  Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => (Symbol as any)[key])
    .filter(isSymbol)
)

const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`)
```
主要作用是用来判断关键字。

```ts
if (!isReadonly) {
    track(target, TrackOpTypes.GET, key)
}

if (shallow) {
    return res
}

if (isRef(res)) {
    // ref unwrapping - skip unwrap for Array + integer key.
    return targetIsArray && isIntegerKey(key) ? res : res.value
}

if (isObject(res)) {
    // Convert returned value into a proxy as well. we do the isObject check
    // here to avoid invalid value warning. Also need to lazy access readonly
    // and reactive here to avoid circular dependency.
    return isReadonly ? readonly(res) : reactive(res)
}

return res
```

接下来就是判断和追踪，定义其他的返回或者返回的包装。

**重新回顾一下，这个方法做了什么**

1. 判断 key `IS_REACTIVE` or `IS_READONLY` or `IS_SHALLOW` 返回对应值
2. 根据参数查找缓存，有缓存返回缓存
3. !Readonly 并且是 数组，并且是这些 key ['includes', 'indexOf', 'lastIndexOf']，['push', 'pop', 'shift', 'unshift', 'splice'] 通过 arrayInstrumentations 来劫持和追踪。
4. 通过反射拿到值
5. 判断 key is Symbol， 如果是属于某些 Symbol 属性或者 `__proto__,__v_isRef,__isVue`， 直接返回
6. !Readonly 情况加入 track
7. !!shallow 返回值
8. !!ref .value 返回值
9. !!object 返回值也要包装成响应式
10. 返回

通过源码分析一下差别

readonly 不加入 track, 允许 get, 返回值也要包装成 readonly(res)
shallow + readonly, 不加入 track, 允许get，不处理返回值
reactive 加入 track, 允许get, 返回值 reactive(res)
shallow + reactive, 加入 track, 允许get, 返回值不处理。

还可以看到关于

这里就是一个 `get`, 其他 get 大都也是由这个工厂来组成。这差不在于参数的差别。

```
const get = /*#__PURE__*/ createGetter()
const shallowGet = /*#__PURE__*/ createGetter(false, true)
const readonlyGet = /*#__PURE__*/ createGetter(true)
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true)
```

这里有一个规则，对应着 **vue** 的判断

> isReadonly && shallow = shallowReadonly
> isReadonly && !shallow = readonly
> !isReadonly && shallow = shallow
> !isReadonly && !shallow = reactiveMap

### 05. handler set

```ts
function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
      return false
    }
    if (!shallow) {
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue)
        value = toRaw(value)
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
      // 在浅层模式下，无论反应与否，对象都按原样设置
    }

    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
```

`set` 相对简单一些

1. 拿到老值
2. !!readonly retrun false
3. isRef(oldValue) && !isRef(value) return false
4. !shallow 不是 shallow 也不是 readonly, 赋值 oldValue， value.
5. !shallow 不是数组，isRef(oldValue) && !isRef(value) oldValue.value = value
6. haskey 验证了key 是否存在，不管是数组还是object
7. 反射set, 得到result
8. 对比原始对象，如果不一致不触发
9. hadKey trigger
10. !hadKey && 新旧值不一致 trigger

### 06. handler other

```ts
function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key)
  const oldValue = (target as any)[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
  }
  return result
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key)
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, TrackOpTypes.HAS, key)
  }
  return result
}

function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}
```


### 07. 问题

关于 `toRaw` 我知道他是去找原生对象, 但是确实没找到赋值的地方。

还有就是不太明白代理一些遍历的属性干什么, 有什么作用？

还是需要后面带着问题去读一下。

### 08. 总结

我这里并没有看 collectionHandlers.ts 代码，不然写的太长了

`reactive` 不支持 `typeof x != object` 的参数， 只接受 `Object，Array，Map，Set，WeakMap，WeakSet` 类型，其他类型直接不做响应式处理。

这里说明了基础类型应该使用 ref，非基础类型应该使用 reactive, 按照之前的 ref 的源码

通过看 ref.ts 和 reactive.ts 源码知道了一些东西。

1. ref get set 触发响应式，如果改里面的东西，通过 reactive 触发响应式。
2. reactive 通过 Proxy 代理触发响应式
3. 带有 shallow 表示只处理浅层。
4. 因为机制问题，建议 ref 用基础类型，复杂类型使用 reactive
5. readonly 是通过 proxy get 返回 readony(v) ，set，delete 代理来保证只读。
6. reactive 只支持 Object, Array, Map, Set, WeakMap, WeakSet 的响应式，其他不会劫持。
