---
title: Vue2.x Dep
date: 2023-06-27 14:33:21
tags: 
    - Vue2
    - Dep
    - 源码
    - 响应式
---

# vue2.x Dep

### 01. Dep

```ts
export default class Dep {
  //静态属性 target 用来存放当前正在计算的 Watcher。
  static target?: DepTarget | null
  //构造函数生成，每个Dep实例的唯一ID
  id: number
  //用来存放所有订阅了该 Dep 实例的 Watcher。
  subs: Array<DepTarget | null>
  //pending subs cleanup
  //一个标志位，用来标识是否有订阅者需要被清除。
  _pending = false 

  //构造函数，用来初始化 id 和 subs。
  constructor() {
    this.id = uid++
    this.subs = []
  }

  //添加订阅者，把 Watcher 添加到 subs 中。
  addSub(sub: DepTarget) {
    this.subs.push(sub)
  }

  //移除订阅者，把 Watcher 从 subs 中移除。
  //由于移除订阅者的操作可能会影响到遍历 subs，所以这里采用了标记位的方式，把要移除的 Watcher 标记为 null，然后在下一次 scheduler flush 的时候再进行清除。
  removeSub(sub: DepTarget) {
    // #12696 deps with massive amount of subscribers are extremely slow to
    // clean up in Chromium
    // to workaround this, we unset the sub for now, and clear them on
    // next scheduler flush.
    this.subs[this.subs.indexOf(sub)] = null
    if (!this._pending) {
      this._pending = true
      pendingCleanupDeps.push(this)
    }
  }
  
  //收集依赖，把当前的 Watcher 添加到该 Dep 实例的 subs 中。
  //如果有需要调试的信息（如 onTrack 回调函数），则调用该回调函数。
  depend(info?: DebuggerEventExtraInfo) {
    if (Dep.target) {
      Dep.target.addDep(this)
      if (__DEV__ && info && Dep.target.onTrack) {
        Dep.target.onTrack({
          effect: Dep.target,
          ...info
        })
      }
    }
  }

  //通知更新，当一个 Dep 实例被更新时，它会遍历 subs 中的所有 Watcher，并依次调用它们的 update 方法进行更新。
  //在这个过程中，如果有需要调试的信息（如 onTrigger 回调函数），则调用该回调函数。
  //如果配置中不是异步模式，则需要对 subs 进行排序以确保它们按正确的顺序触发更新。
  notify(info?: DebuggerEventExtraInfo) {
    // stabilize the subscriber list first
    const subs = this.subs.filter(s => s) as DepTarget[]
    if (__DEV__ && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      const sub = subs[i]
      if (__DEV__ && info) {
        sub.onTrigger &&
          sub.onTrigger({
            effect: subs[i],
            ...info
          })
      }
      sub.update()
    }
  }
}
```

继续看

```ts
const pendingCleanupDeps: Dep[] = []

export const cleanupDeps = () => {
  for (let i = 0; i < pendingCleanupDeps.length; i++) {
    const dep = pendingCleanupDeps[i]
    dep.subs = dep.subs.filter(s => s)
    dep._pending = false
  }
  pendingCleanupDeps.length = 0
}
```

这里是配合 `removeSub`, 过滤调已经被 `removeSub` 置 `null` 的 `subs`, 查询了 **vue2** 源码，主要在 `watch` & `apiWatch` 中调用， 这个过会儿再深究

还有就是 

```ts
// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack: Array<DepTarget | null | undefined> = []

export function pushTarget(target?: DepTarget | null) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

这里初始化 `Dep.target = null`, 然后给了一个进栈出栈代码，这个看起来简单，其实很重要。

首先这个是什么？

> 这段代码实现了一个全局的Watcher调度器。Vue的数据响应式机制会创建一个Watcher对象，Watcher会在数据变化时进行更新。在Vue的内部实现中，Dep（Dependency）对象用来收集Watcher，当数据发生变化时，Dep会通知收集的所有Watcher进行更新。
>
> 当一个Watcher被创建时，它会被设置为全局唯一的Dep.target。当数据变化时，Dep会通过调用Watcher的update方法来通知它进行更新。pushTarget方法将当前Watcher入栈并将Dep.target设置为该Watcher，这样在收集依赖时Dep会将该Watcher加入到其subs数组中。而popTarget方法则将Watcher出栈并恢复Dep.target为上一个Watcher，这样当数据变化时就可以通知到上一个Watcher进行更新。

也就是说，当源码需要更新的时候

```ts
pushTarget(watcher);
//操作已经劫持过的值，触发更新
popTarget(watcher);
```

另外，`targetStack` 为什么是一个数组？ 因为 Vue 响应式是可以嵌套的，层层嵌套，所以需要用到这个进栈出栈操作。

但是有些代码中，`pushTarget()` , 并没有包含 `watch`，传入值为 `undefined`, 是用于区别和判断

```ts
if(Dep.target) { ... }
```

真实传入 watch 的方式是，通过 `watch.get`

```ts
get() {
    pushTarget(this)
    ...
```

所以两者还是需要连起来看。

### 02. 总结

`Dep` 究竟干了什么。

他是一个桥梁，对象和watch之间的桥梁，每一个对象都应该有一个 Dep, 用于管理关于这个对象的依赖。

声明一个 Dep 用于管理 数据和Watch之间的依赖。

并且，也统一通过 Dep.target 来管理整个 Vue watch 的调度。

1. addSub 添加watch，用于通知
2. removeSub 标记为null，scheduler flush 中清理
3. depend 当前 Dep 添加到 Dep.target 当中
4. notify 通知所有的 sub
