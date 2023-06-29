---
title: vue destroyed vs onUnmounted
date: 2023-06-29 00:29:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - destroyed
    - onUnmounted
---

# vue destroyed vs onUnmounted

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

### Vue3.x onUnmounted

首先之前就知道了卸载流程怎么触发的

v-if 的话， `proxy set => trigger => effect => effect.scheduler() => effect.run() => componentUpdateFn => patch => unmount => 触发 unmountComponent 函数` 
 
那继续看带注释的 `unmountComponent`

```ts
const unmountComponent = (
  instance: ComponentInternalInstance,
  parentSuspense: SuspenseBoundary | null,
  doRemove?: boolean
) => {
  // 检查组件是否存在热模块替换标识，如果存在则注销热模块替换
  if (__DEV__ && instance.type.__hmrId) {
    unregisterHMR(instance)
  }

  // 从组件实例中获取相关属性
  const { bum, scope, update, subTree, um } = instance

  // 触发组件的 beforeUnmount 钩子函数
  if (bum) {
    invokeArrayFns(bum)
  }

  // 如果启用了兼容模式，并且该组件启用了实例事件钩子（已废弃）
  // 触发组件的 beforeDestroy 事件
  if (
    __COMPAT__ &&
    isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
  ) {
    instance.emit('hook:beforeDestroy')
  }

  // 停止组件实例的作用域内的副作用函数的执行
  scope.stop()

  // 如果组件实例的更新函数存在
  if (update) {
    // 将更新函数的 active 属性设为 false，使调度程序不再调用它
    update.active = false
    // 调用 unmount 函数卸载组件的子树
    unmount(subTree, instance, parentSuspense, doRemove)
  }

  // 触发组件的 unmounted 钩子函数
  if (um) {
    queuePostRenderEffect(um, parentSuspense)
  }

  // 如果启用了兼容模式，并且该组件启用了实例事件钩子（已废弃）
  // 触发组件的 destroyed 事件
  if (
    __COMPAT__ &&
    isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
  ) {
    queuePostRenderEffect(
      () => instance.emit('hook:destroyed'),
      parentSuspense
    )
  }

  // 将组件实例的 isUnmounted 属性设为 true
  queuePostRenderEffect(() => {
    instance.isUnmounted = true
  }, parentSuspense)

  // 如果启用了 SUSPENSE 特性，并且存在父级悬挂点、挂起分支未解决、
  // 组件实例存在异步依赖项、异步依赖项未解决，并且该组件实例的 suspenseId 等于
  // 父级悬挂点的 pendingId，则处理悬挂点的依赖项
  if (
    __FEATURE_SUSPENSE__ &&
    parentSuspense &&
    parentSuspense.pendingBranch &&
    !parentSuspense.isUnmounted &&
    instance.asyncDep &&
    !instance.asyncResolved &&
    instance.suspenseId === parentSuspense.pendingId
  ) {
    parentSuspense.deps--
    if (parentSuspense.deps === 0) {
      parentSuspense.resolve()
    }
  }

  // 如果是开发环境或者启用了生产/开发工具的特性，通知开发工具该组件已被移除
  if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
    devtoolsComponentRemoved(instance)
  }
}
```

这里面注释其实已经说的很清楚

1. scope.stop() //停止副作用函数
2. unmount(subTree, instance, parentSuspense, doRemove) // 调用 unmount 函数卸载组件的子树
3. instance.isUnmounted = true

主要就这几个，这里有一个概念 EffectScope，在 Vue2.x 中也有类似的概念

> EffectScope（效果作用域）是用于管理副作用函数（effects）的工具。它提供了一种将副作用函数组织在一起并控制其执行的机制。
> 
> 在 Vue 3 中，组件内部的副作用函数（如 onMounted、onUpdated、onUnmounted 等）被称为“副作用”（effects）。副作用可以是一些具有副作用的操作，例如订阅事件、发送网络请求、操作 DOM 等。
> 
> EffectScope 提供了以下功能：
> 
> 创建效果作用域：使用 createScope 函数可以创建一个新的效果作用域。
> 
> 开始和停止副作用函数的执行：在组件实例中，通过调用效果作用域的 run 方法可以开始执行副作用函数，调用 stop 方法可以停止执行副作用函数。
> 
> 批量执行副作用函数：EffectScope 允许将多个副作用函数分组，然后一次性启动它们的执行，这样可以确保它们按照正确的顺序执行。
> 
> 嵌套效果作用域：可以在一个效果作用域内创建另一个效果作用域，形成嵌套结构。嵌套的效果作用域可以独立运行，可以在父作用域停止时自动停止。

大概知道就行了，后面会专门看一看这个，简单理解就是管理组件上的副作用函数。

unmount 是递归去卸载子树，就是一个一个卸载，ref，KeepAliveContext，unmountComponent，处理SUSPENSE，TELEPORT，Fragment，动态子节点，并且直接删除 vnode。

还调用了各种钩子函数，这就是大概的卸载节点的过程，当然这里谈的主要是钩子函数，所以可能中间很多点是不会触发的。


### Vue2.x destroyed

之前已经知道了大概触发流程 `patch => removeNodes => Vue.prototype.$destroy`

```ts
callHook(vm, 'beforeDestroy')
vm._isBeingDestroyed = true
// remove self from parent
const parent = vm.$parent
if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
  remove(parent.$children, vm)
}
// teardown scope. this includes both the render watcher and other
// watchers created
vm._scope.stop()
// remove reference from data ob
// frozen object may not have observer.
if (vm._data.__ob__) {
  vm._data.__ob__.vmCount--
}
// call the last hook...
vm._isDestroyed = true
// invoke destroy hooks on current rendered tree
vm.__patch__(vm._vnode, null)
// fire destroyed hook
callHook(vm, 'destroyed')
```

ok, 不存在什么异步，就直接触发了， 那我们来看他做了什么？

删除 parent.$childre 关于vm的引用, remove 就是一个单纯的数组方法.

```ts
if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
  remove(parent.$children, vm)
}
```

停止 watch, _scope 是 EffectScope， 然后调用 watcher.teardown(), 调用 this.cleanups 清理函数， 如果 scope 在，就遍历清理。

```ts
vm._scope.stop()
```

从数据对象的观察者（__ob__）中移除对组件的引用：

```ts
if (vm._data.__ob__) {
  vm._data.__ob__.vmCount--
}
```

调用 vm.__patch__ 方法将当前组件的虚拟节点（_vnode）设置为 null，用于解除组件与虚拟 DOM 的关联

```ts
vm.__patch__(vm._vnode, null)
```

### 总结

这里简单介绍了一下 Vue2,3 卸载组件的过程，都是类似的流程，只是方法换了，但是流程没有变。