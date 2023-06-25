---
title: Vue mounted
date: 2023-06-26 00:02:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - mounted
---

# Vue mounted

### 1. Vue2 mounted

在 `beforeMount` 之后做了什么？

1. 创建了 `updateComponent` 函数，调用 `vm._update(vm._render, hydrating);`
2. 创建 `watcher`, 监视`vm`, 发生变化调用 `updateComponent`， 在执行之前调用 `beforeUpdate`
3. 调用 `preWatchers`
4. 如果创建成功，调用 `mounted`

在这里，我们必须知道 **Vue2** `watcher` 是什么?

> 在 Vue 2.x 中，Watcher 的作用是建立数据的响应式依赖关系并在数据发生变化时更新相关的视图。

也就是说，会根据 vm 属性变化，调用 updateComponent，在 `new watcher(...)` 的时候，会立刻调用一次。

按照代码逻辑来说

new Wather(...) 第一次调用渲染组件, 调用 

```ts
updateComponent = () => {
	vm._update(vm._render(), hydrating)
}

new Watcher(
  vm,
  updateComponent,
  noop,
  watcherOptions,
  true /* isRenderWatcher */
)

const watcherOptions: WatcherOptions = {
	before() {
		if (vm._isMounted && !vm._isDestroyed) {
			callHook(vm, 'beforeUpdate')
		}
	}
}

if (vm.$vnode == null) {
  vm._isMounted = true
  callHook(vm, 'mounted')
}
```
触发完成 `updateComponent` 然后顺序调用 `mounted`. 当 `vm` 触发更新，`_isMouted = true`，可以触发 `beforeUpdate`.

但是实际上，并不是这样，上面是我理解的代码逻辑，但是如果是这样顺序就有问题，而且实际测试不是这样。

所以要知道 mounted 怎么触发，就需要搞清楚 `render` 和 `update` 的详细逻辑

`render` 方法就是在 `renderMixin` 当中  

```ts
Vue.prototype._render = function (): VNode { //...
```

就是调用通过你模板中解析出来的 `render` 函数, 解析模板为一个 `vnode`，设置了上下文环境，设置属性

```ts
vm.$vnode = _parentVnode!
vnode.parent = _parentVnode
```

总之就是返回一个 `vnode`. 并且设置了 `vm` & `vnode` 属性。

继续来看 _update, 他通过调用 createElm 来创建节点。重点在创建完成以后，他通过一个队列，来调用 `vnode.data.hook.insert`

```ts
invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)

function invokeInsertHook(vnode, queue, initial) {
  // delay insert hooks for component root nodes, invoke them after the
  // element is really inserted
  if (isTrue(initial) && isDef(vnode.parent)) {
    vnode.parent.data.pendingInsert = queue
  } else {
    for (let i = 0; i < queue.length; ++i) {
      queue[i].data.hook.insert(queue[i])
    }
  }
}
```

`initial` 是用来判断是否是第一次创建。

queue 是 insertedVnodeQueue。 insertedVnodeQueue 是已经插入了 `Vnode` 队列, 可以理解为创建完成 `vnode`，会 `push` 到里面.

然后这个组件所有的组件创建完成以后，就会开始调用这个队列 `insertedVnodeQueue，然后调用` `vnode.data.hook.insert`

```ts
insert(vnode: MountedComponentVNode) {
  const { context, componentInstance } = vnode
  if (!componentInstance._isMounted) {
    componentInstance._isMounted = true
    callHook(componentInstance, 'mounted')
  }
  if (vnode.data.keepAlive) {
    if (context._isMounted) {
      // vue-router#1212
      // During updates, a kept-alive component's child components may
      // change, so directly walking the tree here may call activated hooks
      // on incorrect children. Instead we push them into a queue which will
      // be processed after the whole patch process ended.
      queueActivatedComponent(componentInstance)
    } else {
      activateChildComponent(componentInstance, true /* direct */)
    }
  }
},
```

当所有的子节点都调用 insert, 然后最后调用根节点

```ts
if (vm.$vnode == null) {
  vm._isMounted = true
  callHook(vm, 'mounted')
}
return vm
```

创建，并且渲染完成所有 vnode 以后， 依照次序调用 mounted.

所以会造成一种结果

### 2. vue3.x mounted

我们从前面的文章可以知道，Vue3.x 如何注册和调用生命周期的, 地址在这里 [Vue lifecycle 实现](/tblog/2023/06/20/vue_lifecycle/).

这里我们需要知道他在哪里调用，并且在调用之前做了什么？

在 componentUpdateFn 中调用

```ts
const { bm, m, parent } = instance //取出需要的生命周期

if (bm) { // 如果 beforeMount 钩子存在
  invokeArrayFns(bm) // 调用 invokeArrayFns 函数，依次执行 beforeMount 钩子函数
}

if (m) { // 如果 mounted 钩子存在
  queuePostRenderEffect(m, parentSuspense) // 将 mounted 钩子函数添加到 post 钩子队列中
}
```

`queuePostRenderEffect` 会调用 `queuePostFlushCb`，然后向 `pendingPostFlushCbs.push(m)`.

然后会在 `render` 完成以后调用 `pendingPostFlushCbs`，循环触发事件。

```ts
const render: RootRenderFunction = (vnode, container, isSVG) => {
	if (vnode == null) {
	  if (container._vnode) {
	    unmount(container._vnode, null, null, true)
	  }
	} else {
	  patch(container._vnode || null, vnode, container, null, null, null, isSVG) //创建
	}
	flushPreFlushCbs() //预事件
	flushPostFlushCbs() //调用事件
	container._vnode = vnode
}
```

patch 就是创建或者更新 vnode 的方法。

根据上面的代码会得到的结果就是 

```
parent vnode beforeMount trigger
	child vnode beforeMount trigger
	child vnode mounted trigger
parent vnode mounted trigger
```

和 Vue2.x 一样，这就是 `onMounted` 的调用, 那么继续看 `beforeMount` 到 `Mounted` 之间做了什么.

```ts
if (bm) {
  invokeArrayFns(bm)
}
```

从 `beforeMount` 开始, 直接 `invokeArrayFns` 是直接调用，不存在延迟.

如果不是 ssr 的话，直接调用 patch 创建组件, 将子树的 el 属性赋值给初始 VNode 的 el 属性

```ts
patch(
	null,
	subTree,
	container,
	anchor,
	instance,
	parentSuspense,
	isSVG
)
initialVNode.el = subTree.el
```

如果钩子存在加入队列

```ts
if (m) { 
  queuePostRenderEffect(m, parentSuspense) 
}
```

然后直接调用 `vnode` 内部的 `mounted hook` 和 **Vue2.x** 写法的兼容性

```ts
if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) { // 如果不是异步组件的包装 VNode，并且存在 onVnodeMounted 钩子
  const scopedInitialVNode = initialVNode
  queuePostRenderEffect(
    () => invokeVNodeHook(vnodeHook!, parent, scopedInitialVNode),
    parentSuspense
  ) // 将 onVnodeMounted 钩子函数添加到 post 钩子队列中
}

if (
  __COMPAT__ &&
  isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
) {
  queuePostRenderEffect(
    () => instance.emit('hook:mounted'),
    parentSuspense
  )
}
```

接下来又处理了 active 事件（这个后面再讲），并且设置 `instance.isMounted = true`.

再这个过程中你会发觉，其实就是执行了 `patch` 创建或者更新了真实 dom，然后触发.

所以过程，流程就是当刚开始 mount => render => patch => 然后根据 vnode 不停的判断循环，递归，不停的创建真实dom。

等真实创建完成执行后面的代码

```ts
const render: RootRenderFunction = (vnode, container, isSVG) => {
  if (vnode == null) {
    if (container._vnode) {
      unmount(container._vnode, null, null, true)
    }
  } else {
    patch(container._vnode || null, vnode, container, null, null, null, isSVG)
  }
  flushPreFlushCbs() //
  flushPostFlushCbs() //执行刚才插入的钩子
  container._vnode = vnode
}
```

### 3. 总结

其实创建阶段的生命周期就走到这里了。

setup => onBeforeMount => onMounted

beforeCreate => created => beforeMount => mounted


