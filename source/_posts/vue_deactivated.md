---
title: Vue deactivated vs onDeactivated
date: 2023-07-02 14:00:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - deactivated
    - onDeactivated
---

beforeCreate -> setup()
created -> setup()
beforeMount -> onBeforeMount
mounted -> onMounted
beforeUpdate -> onBeforeUpdate
updated -> onUpdated
beforeDestroy -> onBeforeUnmount
destroyed -> onUnmounted
activated -> onActivated
**deactivated -> onDeactivated**
errorCaptured -> onErrorCaptured

### 1. onDeactivated

先说说调用流程

触发 **set => trigger => effect.scheduler() => queueJob(update) => queue.push(job); => flushJobs(执行队列, 执行完成以后) => flushPostFlushCbs => 触发回调**

加入钩子 **set => trigger => effect.scheduler() => queueJob(update) => queue.push(job); => flushJobs(执行队列) => patch(不停的递归) => unmount =>  parentComponent.ctx.deactivate(vnode)**

这是另外一套 Vue3 钩子触发方法，也是我后续才注意到的，需要补充在之前的生命周期流程。

[keep-alive](/tblog/2023/06/29/vue3_keep_alive/)

```ts
sharedContext.deactivate = (vnode: VNode) => {
  //获取当前 Vnode 组件
  const instance = vnode.component! 
  //移动节点到 storageContainer
  move(vnode, storageContainer, null, MoveType.LEAVE, parentSuspense)
  // 加入队列
  queuePostRenderEffect(() => {
    //deactivate 钩子触发
    if (instance.da) {
      invokeArrayFns(instance.da)
    }
    
    //onVnodeUnmounted 钩子
    const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted
    if (vnodeHook) {
      invokeVNodeHook(vnodeHook, instance.parent, vnode)
    }
    
    //标记 deactived
    instance.isDeactivated = true
  }, parentSuspense)
}
```

这种执行模式，更新, active 等等都是这样的，但是都是完全执行完成之后，在最后调用。

### Vue2.x deactivated

调用路径类似

触发 **set => dep => watcher => 调度队列 => watcher.run() => updateComponent => patch => removeVnodes => invokeDestroyHook** 触发 `hooks`。



