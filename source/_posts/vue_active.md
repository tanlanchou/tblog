---
title: vue actived vs onActivated
date: 2023-07-02 13:38:01
tags: 
    - vue2
    - vue3
    - 前端
    - keep-alive
    - typescript
description: 对比 Vue2.x Vue3.x keep-alive 源码分析
---

### 1. Vue3.x onActivated

`keep-alive`  的源码之前看了大概看过，可以看这里 [keep-alive](/tblog/2023/06/29/vue3_keep_alive/)

`active` 会在 `processComponent` 当中调用

```ts
const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
        if (n2.shapeFlag & 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */) {
            parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
        }
        else {
            mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
        }
    }
    else {
        updateComponent(n1, n2, optimized);
    }
};
```

也就是通过 component is 的触发到 update => patch 然后可以触发到这里。

```ts
sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
  const instance = vnode.component!
  move(vnode, container, anchor, MoveType.ENTER, parentSuspense)
  // in case props have changed
  patch(
    instance.vnode,
    vnode,
    container,
    anchor,
    instance,
    parentSuspense,
    isSVG,
    vnode.slotScopeIds,
    optimized
  )
  queuePostRenderEffect(() => {
    instance.isDeactivated = false
    if (instance.a) {
      invokeArrayFns(instance.a)
    }
    const vnodeHook = vnode.props && vnode.props.onVnodeMounted
    if (vnodeHook) {
      invokeVNodeHook(vnodeHook, instance.parent, vnode)
    }
  }, parentSuspense)

  if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
    // Update components tree
    devtoolsComponentAdded(instance)
  }
}
```


然后把当前节点移动到 `container` 当中，然后 `patch` 新旧节点，触发 `active hook`。

具体关于缓存和其他方法就看 [keep-alive](/tblog/2023/06/29/vue3_keep_alive/)

另外还有一处触发点在 setupRenderEffect

```ts
if (
  initialVNode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE ||
  (parent &&
    isAsyncWrapper(parent.vnode) &&
    parent.vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE)
) {
  instance.a && queuePostRenderEffect(instance.a, parentSuspense)
  if (
    __COMPAT__ &&
    isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
  ) {
    queuePostRenderEffect(
      () => instance.emit('hook:activated'),
      parentSuspense
    )
  }
}
```

### Vue2.x actived

**src\core\components\keep-alive.ts**

就是一个组件，自定义是组建，然后自己写了一个 `render`, 方法有类似，基本逻辑一样，只是 **Vue3.x** 是用 **setup** 来写，并且是一个闭包，可是这里似乎与生命周期无关，也就是说，`active` 是在 `patch` 当中调用的全局生命周期

那么 actived 是怎么触发的 ？

**Vue.prototype._update**

```ts
const vm: Component = this
const prevEl = vm.$el
const prevVnode = vm._vnode
const restoreActiveInstance = setActiveInstance(vm)
vm._vnode = vnode
// Vue.prototype.__patch__ is injected in entry points
// based on the rendering backend used.
if (!prevVnode) {
  // initial render
  vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
} else {
  // updates
  vm.$el = vm.__patch__(prevVnode, vnode)
}
```
**initComponent**

```ts
function initComponent (vnode, insertedVnodeQueue) {
  if (isDef(vnode.data.pendingInsert)) {
    insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
    vnode.data.pendingInsert = null;
  }
  vnode.elm = vnode.componentInstance.$el;
  if (isPatchable(vnode)) {
    invokeCreateHooks(vnode, insertedVnodeQueue);
    setScope(vnode);
  } else {
    // empty component root.
    // skip all element-related modules except for ref (#3455)
    registerRef(vnode);
    // make sure to invoke the insert hook
    insertedVnodeQueue.push(vnode);
  }
}
```

也就是说通过 **Object.defineProperty => set => dep => 触发 watcher => 触发更新 => _update => patch => initComponent => 然后加入队列**

最后在 patch 结束以后，统一调用.

```ts
invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
```