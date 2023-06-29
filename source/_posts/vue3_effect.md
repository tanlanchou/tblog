---
title: vue3 effect
date: 2023-6-21 14:51:59
tags: 
    - vue3
    - effect
---

# vue3 effect

### 01. track

以响应式代码为例子

**packages/reactivity/src/baseHandlers.ts** 中 `createGetter` 该方法为 `Proxy` 提供 `Getter` 的工厂方法

在判断，特殊返回完成之后，会进行 `track`

```ts
if (!isReadonly) {
    track(target, TrackOpTypes.GET, key)
}
```

**packages/reactivity/src/effect.ts 214**

首先会判断 `houldTrack && activeEffect`, 这里默认它为true，因为要解释是否为true，需要知道创建和绑定的流程，以及它的规则。

```ts
if (shouldTrack && activeEffect) { ... }
```

接下来是

```ts
//通过 target 查找 targetMap 获取 depsMap
let depsMap = targetMap.get(target)
//如果没有，新建Map，并且赋值 depsMap
if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
}
//depsMap 通过 Key 获取。
let dep = depsMap.get(key)
//如果没有，创建一个新的 Dep， Dep 是 Set & TrackedMarkers
if (!dep) {
    depsMap.set(key, (dep = createDep()))
}

//跟踪 Effects
//判断是否需要 track
//相互引用
trackEffects(dep, eventInfo)
```

`targetMap` 

```ts
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()
```

定义 `target => key => Dep` 的一个映射表，通过他来存储之间的关系。
其中 `KeyToDepMap` 就是 `depsMap`, 最终存储 `Dep`

Dep 是一个 

```ts
export type Dep = Set<ReactiveEffect> & TrackedMarkers
type TrackedMarkers = {
  /**
   * wasTracked
   */
  w: number
  /**
   * newTracked
   */
  n: number
}
```

**trackEffects**

```ts
export function trackEffects(
  dep: Dep,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
let shouldTrack = false
//...
//先不用纠结他怎么算的
//判断是否超过最大数值
//如果没有超过，就是部分清理
//判断是否被其他 ReactiveEffect 访问
//...
dep.add(activeEffect!) //dep增加 Effect
activeEffect!.deps.push(dep) //activeEffect.deps增加dep
}
```

这一部分就是增加 track 的代码，总之就是在 `dep` 和 `effect` 相互关联, dep 在 targetMap 中。

### 02. triggger

`triggger function`

```ts
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {

  //如果没有从 targetMap.get 获取到，没有 track
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }
  //Dep[]
  let deps: (Dep | undefined)[] = []
  //如果 type 是 CLEAR，表示清空集合，将 depsMap 中所有的依赖项都加入到 deps 中
  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    deps = [...depsMap.values()]
  }
  //如果 key 是 length，并且 target 是数组，则表示数组长度发生变化，需要触发数组的依赖项更新。
  //找到 depsMap 中 key 等于 length 或者大于等于新长度的依赖项，并将其加入到 deps 中。
  else if (key === 'length' && isArray(target)) {
    const newLength = Number(newValue)
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= newLength) {
        deps.push(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    //key !== undefined
    if (key !== void 0) {
      deps.push(depsMap.get(key))
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    // 对于 SET、ADD、DELETE 三种情况，根据 key 从 depsMap 中获取依赖项 dep，并将其加入到 deps 中
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          //对于 ADD 操作，如果 target 不是数组，则需要触发 ITERATE_KEY 和 MAP_KEY_ITERATE_KEY 两个迭代依赖项更新
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        //如果 target 是数组，且 key 是整数，则需要触发数组长度的依赖项更新。 
        else if (isIntegerKey(key)) {
          // new index added to array -> length changes
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          //如果 target 不是数组，则需要触发 ITERATE_KEY
          deps.push(depsMap.get(ITERATE_KEY))
          //如果是Map，MAP_KEY_ITERATE_KEY
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        break
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }

  const eventInfo = __DEV__
    ? { target, type, key, newValue, oldValue, oldTarget }
    : undefined

  //如果只有一个 dep，直接更新
  //如果多个 则需要将所有依赖项的 ReactiveEffect 对象合并成一个新的 ReactiveEffect 对象，再更新
  if (deps.length === 1) {
    if (deps[0]) {
      if (__DEV__) {
        triggerEffects(deps[0], eventInfo)
      } else {
        triggerEffects(deps[0])
      }
    }
  } else {
    const effects: ReactiveEffect[] = []
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep)
      }
    }
    if (__DEV__) {
      triggerEffects(createDep(effects), eventInfo)
    } else {
      triggerEffects(createDep(effects))
    }
  }
}
```
看起来代码很多，其实做了几件事。

1. 处理 type.clear
2. 处理 arr & key = length or number 的问题
3. deps = Dep[], 如果 Key != undefined 把对应 key，以及根据type 获取对应Dep
4. triggerEffects 处理

**triggerEffects**

```ts
export function triggerEffects(
  dep: Dep | ReactiveEffect[],
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  // spread into array for stabilization
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect, debuggerEventExtraInfo)
    }
  }
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect, debuggerEventExtraInfo)
    }
  }
}
```

通过遍历 `dep`, `triggerEffect(effect)`, 先处理 `computed`, 然后非 `computed`

**triggerEffect**

```ts
function triggerEffect(
  effect: ReactiveEffect,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  if (effect !== activeEffect || effect.allowRecurse) {
    if (__DEV__ && effect.onTrigger) {
      effect.onTrigger(extend({ effect }, debuggerEventExtraInfo))
    }
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
```

触发 `ReactiveEffect` 有 `scheduler` 优先 `scheduler`，没有 `run`

### track & trigger 总结

1. track，创建Dep，并且放入 targetMap & desMap, Dep 添加 activeEffect， activeEffect.deps.push(dep)
2. trigger, 获取 target 的 depsMap, 排除 type.clear & key = length & number, 如果有key 从 depsMap 获取, 然后再把对应type的一些固定key，也获取出来，然后 effect.scheduler or run, computed 优先。


### 03. reactiveEffect 源码

之前说了这么多，其实 track 和 trigger 都是为了触发 reactiveEffect 更新，那么继续看一下


```ts
// ReactiveEffect 类定义
export class ReactiveEffect<T = any> {
  // 是否处于活动状态，初始为 true
  active = true
  // 当前 ReactiveEffect 实例的依赖项数组
  deps: Dep[] = []
  // 当前 ReactiveEffect 实例的父级 ReactiveEffect 实例，用于解决递归调用的问题
  parent: ReactiveEffect | undefined = undefined

  // 可以在创建之后附加
  computed?: ComputedRefImpl<T>
  // 允许递归调用
  allowRecurse?: boolean
  // 延迟停止，用于避免因删除当前 ReactiveEffect 实例时引起的并发问题
  private deferStop?: boolean

  // 当 ReactiveEffect 实例停止时调用的函数
  onStop?: () => void
  // 仅在开发环境中使用，用于跟踪依赖项追踪事件
  onTrack?: (event: DebuggerEvent) => void
  // 仅在开发环境中使用，用于跟踪触发事件
  onTrigger?: (event: DebuggerEvent) => void

  // ReactiveEffect 构造函数
  constructor(
    public fn: () => T, // 当前 ReactiveEffect 实例的执行函数
    public scheduler: EffectScheduler | null = null, // 用于指定更新策略
    scope?: EffectScope // 用于指定作用域
  ) {
    recordEffectScope(this, scope) // 记录当前 ReactiveEffect 实例的作用域
  }

  // 运行 ReactiveEffect 实例
  run() {
    if (!this.active) {
      return this.fn()
    }

    // 检查是否已经追踪了当前 ReactiveEffect 实例
    let parent: ReactiveEffect | undefined = activeEffect
    let lastShouldTrack = shouldTrack
    while (parent) {
      if (parent === this) {
        return
      }
      parent = parent.parent
    }

    try {
      // 设置父级 ReactiveEffect 实例，并将当前实例设置为 activeEffect
      this.parent = activeEffect
      activeEffect = this
      shouldTrack = true

      // 初始化 depMarkers，用于性能优化
      trackOpBit = 1 << ++effectTrackDepth
      if (effectTrackDepth <= maxMarkerBits) {
        initDepMarkers(this)
      } else {
        cleanupEffect(this)
      }

      // 执行 ReactiveEffect 实例的函数
      return this.fn()
    } finally {
      // 结束追踪 depMarkers
      if (effectTrackDepth <= maxMarkerBits) {
        finalizeDepMarkers(this)
      }
      trackOpBit = 1 << --effectTrackDepth

      // 恢复上一个活动的 ReactiveEffect 实例
      activeEffect = this.parent
      shouldTrack = lastShouldTrack
      this.parent = undefined

      // 如果 deferStop 属性为 true，则删除当前 ReactiveEffect 实例
      if (this.deferStop) {
        this.stop()
      }
    }
  }

    stop() {
    // 如果当前副作用函数正在执行，标记为延迟清理
    if (activeEffect === this) {
        this.deferStop = true
    } else if (this.active) { // 如果当前副作用函数未执行且仍然活跃
        cleanupEffect(this) // 清除副作用函数与其依赖项之间的关联关系
        if (this.onStop) { // 如果有停止回调函数，调用停止回调函数
        this.onStop()
        }
        this.active = false // 标记当前副作用函数为不活跃状态
    }
    }
}
```

提供了3个方法，构造，`run`，`stop`

1. 构造函数， 就是如果 `!!scope`, `scope.effects.push(this)`, 还有一个 `EffectScope`，就是这个 `scope`，用于管理 `reactiveEffect`, 这里把他放进管理里面去
2. run 可以简单的理解为执行构造函数传入的 `Fn` 函数
  2.1 复杂一点说，当 `!active`, 直接调用 `fn`
  2.2 检查 parent 是否存在循环引用
  2.3 设置参数，`parent = activeEffect, activeEffect = this, shouldTrack = true`
  2.4 `fn()`
  2.5 恢复参数 `activeEffect = this.parent，shouldTrack = lastShouldTrack，this.parent = undefined`

这里有一个概念

> depMarkers 是一个用于追踪依赖关系的标记对象，用于在 reactive effect 中记录哪些依赖项已被追踪过。它有两个属性 w 和 n，分别代表了 "wasTracked" 和 "newTracked"。
> 
> 在 reactive effect 中，depMarkers 被用来判断某个依赖项是否已被追踪，以及在追踪完所有依赖项后是否有新的依赖项被追踪。如果一个依赖项在 reactive effect 中被追踪过，它的 w 位会被设置为 1，如果在当前追踪过程中有新的依赖项被追踪，它的 n 位会被设置为 1。
> 
> 通过 depMarkers 中的这些标记，Vue3 可以在 reactive effect 中跟踪依赖项的变化，并且只会在必要的时候重新运行 reactive effect。这样可以提高性能和响应速度。

这里先不展开了

3. `stop` 就是清理 `effect` 和 `dep` 的关联，全部`delete`，`active` 设置为 `false`

### 04. 怎么调用 reactiveEffect

这里我产生了一个疑惑，在这个触发的过程中，activeEffect, 是什么时候实例化的？我查看了所有关于 `activeEffect` 的引用。

只有在 `reactiveEffect.run` 中才有设置

```ts
this.parent = activeEffect
activeEffect = this
shouldTrack = true

//...

activeEffect = this.parent
shouldTrack = lastShouldTrack
this.parent = undefined
```

也就是说当一个, 我们可以理解 `reactiveEffect` 是一个树，保证运行时候类似于先进后出。

这里解释了为什么 `activeEffect` 会保证有值的原因。

另外我们总是需要先调用 `reactiveEffect`, 才会有第一次的值, 这里是在初始化组件或者更新组件的时候

```ts
// create reactive effect for rendering
const effect = (instance.effect = new ReactiveEffect(
  componentUpdateFn,
  () => queueJob(update),
  instance.scope // track it in component's effect scope
))

const update: SchedulerJob = (instance.update = () => effect.run())
update.id = instance.uid
// allowRecurse
// #1801, #2043 component render effects should allow recursive updates
toggleRecurse(instance, true)

if (__DEV__) {
  effect.onTrack = instance.rtc
    ? e => invokeArrayFns(instance.rtc!, e)
    : void 0
  effect.onTrigger = instance.rtg
    ? e => invokeArrayFns(instance.rtg!, e)
    : void 0
  update.ownerInstance = instance
}

update()
```

### 05. 总结。

reactiveEffect 是响应式的核心代码，所有的值都通过他来执行响应式，通过 `run` or `stop` 来控制执行或者停止。

通过 targetMap 来存储 reactiveEffect.

targetMap => depsMap => Dep => reactiveEffect.

通过 track 方法来创建 Dep，并且和当前的 reactivEffect 产生关联， 

`activeEffect.deps.push(dep)` 

`dep.add(activeEffect)`

通过 trigger 方法，来找到对应的 reactiveEffect, 不仅仅包含当前 key 的，还包含对用操作类型的 reactiveEffect 

然后统一去触发。


