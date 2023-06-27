---
title: Vue updated vs onUpdated
date: 2023-06-28 00:01:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - updated
---

# vue updated vs onUpdated

beforeCreate -> setup()
created -> setup()
beforeMount -> onBeforeMount
mounted -> onMounted
beforeUpdate -> onBeforeUpdate
updated -> onUpdated
beforeDestroy -> onBeforeUnmount
destroyed -> onUnmounted
activated -> onActivated
deactivated -> onDeactivated
errorCaptured -> onErrorCaptured

### vue3.x onUpdate

```ts
 if (!instance.isMounted) { // 如果组件实例未挂载
    //创建组件
 }
 else {
    //更新组件
    if (bu) { // 如果 beforeUpdate 钩子存在
      invokeArrayFns(bu) // 调用 invokeArrayFns 函数，依次执行 beforeUpdate 钩子函数
    }

    patch(
      prevTree,
      nextTree,
      // parent may have changed if it's in a teleport
      hostParentNode(prevTree.el!)!,
      // anchor may have changed if it's in a fragment
      getNextHostNode(prevTree),
      instance,
      parentSuspense,
      isSVG
    ) // 执行 patch 函数，进行 DOM 的创建或更新

    if (u) { // 如果 updated 钩子存在
      queuePostRenderEffect(u, parentSuspense) // 将 updated 钩子函数添加到 post 钩子队列中
    }
    if (!isAsyncWrapper(vnode) && (vnodeHook = next.props && next.props.onVnodeUpdated)) { // 如果不是异步组件的 VNode，并且存在 onVnodeUpdated 钩子
      queuePostRenderEffect(
        () => invokeVNodeHook(vnodeHook!, parent, next!, vnode),
        parentSuspense
      ) // 将 onVnodeUpdated 钩子函数添加到 post 钩子队列中
    }
    if (__COMPAT__ && isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)) { // 如果兼容模式开启，并且兼容选项 DEPRECATION.INSTANCE_EVENT_HOOKS 启用
      queuePostRenderEffect(
        () => instance.emit('hook:updated'),
        parentSuspense
      ) // 将 hook:updated 事件添加到 post 钩子队列中
    }
}
```

这里是再 `patch` 更新组件完成，然后调用 `beforeUpdate`, 这就是钩子插入的过程。

调用就要看 `ref or reactive`，会在 `set` 的时候 `triggerRefValue(this, newVal);` 然后 `triggerEffects`, 然后找到
`effect2.scheduler();`

```ts
const effect = (instance.effect = new ReactiveEffect(
  componentUpdateFn,
  () => queueJob(update),
  instance.scope
))
```

ok，现在可以来说一说基本的调用过程了，这是基本的创建

```ts
const effect = (instance.effect = new ReactiveEffect(
  componentUpdateFn,
  () => queueJob(update),
  instance.scope
))

const update: SchedulerJob = (instance.update = () => effect.run())
```

在写入属性的时候触发 proxy 的时候，触发 set 

```
triggerRefValue(this, newVal);
```

需要知道 ref, reactive 在创建的时候是创建的 dep，用于记录关联，所以触发的时候 this.dep 可以调用找到当前的 reactvice. 

然后就可以调用 `triggerEffect`, 触发 `effect.scheduler()`, 也就是 `queueJob(update)`.

这里里面会触发调度任务，会把 update 触发

```ts
export function queueJob(job: SchedulerJob) {
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
    )
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

然后调用 `flushJobs`, 里面会不停的循环 `queue`, 执行里面的 `function`。

在全部执行完成以后执行 `flushPostFlushCbs(seen)`。

于是就触发刚才插入的钩子函数

```ts
if (u) { // 如果 updated 钩子存在
  queuePostRenderEffect(u, parentSuspense) // 将 updated 钩子函数添加到 post 钩子队列中
}
```

### vue2.x updated

这里需要大概知道 Vue2 的一些核心概念， `wathcer & dep`，也就是 *Vue2.x* 更新的核心概念

[watcher](/tblog/2023/06/27/vue2_watch/), [dep](/tblog/2023/06/27/vue2_Dep/) 这两篇文章是之前我看 Vue2.x 的源码的时候写的，包含代码注释。

可以简单理解为是一个发布-订阅的关系，在之前看代码中，我们知道有在创建组件的函数中 `mountComponent` 当中，会新建 `wathcer`.

在组件的创建完成以后，你访问属性，会通过 `Object.defineProperty` 劫持，然后创建 Dep。通过下面代码

```ts
addDep(dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
}
```

和 watcher 建立联系。

如果属性发生变化，通过 `Object.defineProperty` 劫持发现，然后通知 dep，然后通知 `watcher，watcher.update()`.

为什么要知道这个？ 因为这个钩子就是通过 `watcher.update()` 触发的，总得简单知道他是怎么触发的吧。

```ts
update() {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
}
```

懒加载就是下次获取的更新，一个同步，一个异步(队列)。

`queueWatcher` 中往 `queue.push(watcher)`, 然后调用 `flushSchedulerQueue`。

```ts
for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    watcher.run()
    // in dev build, check and stop circular updates.
    if (__DEV__ && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' +
            (watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`),
          watcher.vm
        )
        break
      }
    }
}

// keep copies of post queues before resetting state
const activatedQueue = activatedChildren.slice()
const updatedQueue = queue.slice()

resetSchedulerState()

// call component updated and activated hooks
callActivatedHooks(activatedQueue)
callUpdatedHooks(updatedQueue) //触发updated
cleanupDeps()
```

这个时候就可以开始说了

```ts
for(queue..) {
    if (watcher.before) {
      watcher.before() //触发before
    }
    watcher.run() //触发更新函数
}

callActivatedHooks(activatedQueue) //触发 active 钩子
callUpdatedHooks(updatedQueue) //触发 update钩子
```

这个就是执行的过程,

### 总结

对比 Vue2 和 Vue3 的实现，其实本质上还是两个版本核心实现的差别

都是通过 `mountComponent` 实现创建更新的函数，不过一个是 `watcher` 一个是 `effect`. `dep` 功能有差异。

然后都是通过 `set` 的时候触发， 这里区别又来了。

**Vue2.x** `set` 通过创建的 `dep` ，通知对应的 `watcher`, 然后调用 `watcher.update()`, 在触发 `flushSchedulerQueue`。

**Vue3.x** 也是通过 `set` 触发 `triggerRefValue(this, newVal)`, 然后找到 `effect.scheduler()`, 执行 `update` 函数， 更新函数，更新完成以后调用生命周期