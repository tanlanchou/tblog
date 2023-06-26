---
title: Vue beforeUpdate
date: 2023-06-26 21:53:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - beforeUpdate
---

# beforeUpdate vs onBeforeUpdate

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

### vue3.x onBeforeUpdate

有两个地方可以调用 `onBeforeUpdate`

第一个是在组件渲染函数中 `setupRenderEffect`, 里面创建了 `componentUpdateFn` 函数，交给副作用函数监控。

中间第一行代码就是去判断

```ts
 if (!instance.isMounted) { // 如果组件实例未挂载
 	//创建组件
 }
 else {
 	//更新组件
 }
```

更新组件中的就是会调用 `beforeUpdate`.

```ts
let { next, bu, u, parent, vnode } = instance

if (bu) { // 如果 beforeUpdate 钩子存在
  invokeArrayFns(bu) // 调用 invokeArrayFns 函数，依次执行 beforeUpdate 钩子函数
}
```

和 `beforeMount` 一样，立即触发。


### Vue2.x beforeUpdate

逻辑类似，都是在 mountComponent 的时候监视组件，然后触发更新.

```ts
new Watcher(
  vm,
  updateComponent,
  noop,
  watcherOptions,
  true /* isRenderWatcher */
)
hydrating = false
```

`updateComponent` 就是更新函数，其中有一个 `watcherOptions`

```ts
const watcherOptions: WatcherOptions = {
  before() {
    if (vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'beforeUpdate')
    }
  }
}
```

当遇到更新触发，然后触发钩子。

### 总结

都是在 `mountComponent` 创建组件的时候处理更新逻辑。

**Vue2.x** 通过 `watch options before` 触发

**Vue3.x** 通过 `effect` 触发 `updateComponent` 触发。