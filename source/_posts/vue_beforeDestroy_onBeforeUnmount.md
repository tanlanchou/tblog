---
title: vue beforeDestroy vs onBeforeUnmount
date: 2023-06-28 16:28:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - beforeDestroy
    - onBeforeUnmount
---

# vue beforeDestroy vs onBeforeUnmount

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

### vue3.x onBeforeUnmount


这个的生命周期其实和 update 类似，注销组件我能想到的就是 v-if, component is 这两种办法。

v-if 通过 update 一样的方式触发，只是 patch 当中会调用 unmount 然后判断到是组件，调用 unmountComponent.

component is 方式不清楚，反正肯定需要调用 patch。

```ts
  const unmountComponent = (
    instance: ComponentInternalInstance,
    parentSuspense: SuspenseBoundary | null,
    doRemove?: boolean
  ) => {
    if (__DEV__ && instance.type.__hmrId) {
      unregisterHMR(instance)
    }

    const { bum, scope, update, subTree, um } = instance

    // beforeUnmount hook
    if (bum) {
      invokeArrayFns(bum)
    }

    ///...
```

这就调用了, 

### Vue2.x beforeDestroy

我这边也是通过 v-if 触发 Object.defineProperty, 然后创建响应式的时候，创建了 Dep，通过 Dep 通知 watcher。

触发 patch, 然后对比

```ts
if (oldStartIdx > oldEndIdx) {
  refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
  addVnodes(
    parentElm,
    refElm,
    newCh,
    newStartIdx,
    newEndIdx,
    insertedVnodeQueue
  )
} else if (newStartIdx > newEndIdx) {
  removeVnodes(oldCh, oldStartIdx, oldEndIdx)
}
```

然后 remove 流程开始, 最后话触发到 `Vue.prototype.$destroy`

```ts
callHook(vm, 'beforeDestroy')
```

### 总结

Vue3.x 通过 `patch => unmount => unmountComponent` 触发

Vue2.x 通过 `patch => removeVnodes => invokeDestroyHook => Vue.prototype.$destroy` 触发

我使用 v-if 测试，所以都是由劫持(Object.defineProperty or proxy) => Dep => watcher or effect => patch => 上面的过程。

