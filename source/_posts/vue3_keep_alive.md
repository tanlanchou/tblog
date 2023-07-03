---
title: vue3 keep-alive
date: 2023-06-29 13:22:01
tags: 
    - vue2
    - vue3
    - 前端
    - keep-alive
    - typescript
description: Vue3.x keep-alive 源码分析，知道怎么缓存，以及大概流程
---

# 1. Vue3.x keep-alive 源码

**packages/runtime-core/src/components/KeepAlive.ts**

看源码知道 keepalive 分为以下几个功能

setup 函数，里面定义了 activate，deactivate，unmount，pruneCache，pruneCacheEntry，matches，move，以及生命周期函数注册和调用。


### 1.1 setup

setup 会在创建的时候执行，他主要包含了以下功能

定义了三个变量

```ts
const cache: Cache = new Map() //缓存
const keys: Keys = new Set() //字典，存放key
let current: VNode | null = null //当前的组件
```

从上下文中拿到了几个方法

```ts
const {
  renderer: {
    p: patch,
    m: move,
    um: _unmount,
    o: { createElement }
  }
} = sharedContext
```

创建容器 `const storageContainer = createElement('div')`

然后创建 `activate & deactivate` 两个方法到 `sharedContext` 当中，`sharedContext = instance.ctx as KeepAliveContext`，也就是当前组件(**keepalive**)的上下文。

```ts
sharedContext.activate = (...) => { ... }
sharedContext.deactivate = (...) => { ... }
```

然后创建 `unmount` 方法, 卸载组件

```ts
function unmount(vnode: VNode) {
  // reset the shapeFlag so it can be properly unmounted
  resetShapeFlag(vnode)
  _unmount(vnode, instance, parentSuspense, true)
}
```

`pruneCache` 用于清理缓存中的组件

```ts
function pruneCache(filter?: (name: string) => boolean) {
  cache.forEach((vnode, key) => {
    const name = getComponentName(vnode.type as ConcreteComponent)
    if (name && (!filter || !filter(name))) {
      pruneCacheEntry(key)
    }
  })
}
```

`pruneCacheEntry` 清理一个指定的缓存 

```ts
function pruneCacheEntry(key: CacheKey) {
  const cached = cache.get(key) as VNode
  if (!current || !isSameVNodeType(cached, current)) {
    unmount(cached)
  } else if (current) {
    // current active instance should no longer be kept-alive.
    // we can't unmount it now but it might be later, so reset its flag now.
    resetShapeFlag(current)
  }
  cache.delete(key)
  keys.delete(key)
}
```

监听 `include` 和 `exclude` 属性的变化，根据变化重新清理缓存



缓存子树，如果 `pendingCacheKey` 有值，在 `Mounted`, `Updated` 这两个生命周期会触发的时候调用 缓存子树的方法

```ts
let pendingCacheKey: CacheKey | null = null
const cacheSubtree = () => {
  if (pendingCacheKey != null) {
    cache.set(pendingCacheKey, getInnerChild(instance.subTree))
  }
}
onMounted(cacheSubtree)
onUpdated(cacheSubtree)
```

然后返回一个方法，相当于一个闭包, 在放回的方法里面

拿到插槽里面的组件，组件没有或者多以一个，报错。

```ts
if (!slots.default) {
  return null
}

const children = slots.default()
const rawVNode = children[0]
```

再拿到对应的方法 `const { include, exclude, max } = props`

```ts
if (
  (include && (!name || !matches(include, name))) ||
  (exclude && name && matches(exclude, name))
) {
  current = vnode
  return rawVNode
}
```
这里就不是很懂了，因为在我的逻辑里面，按照他的这个条件，应该是不使用或者不渲染，但是他这边的逻辑其实是，满足这个条件立刻渲染，不使用缓存。

接下来就是判断是否缓存的问题

```ts
//这里拿到 key, 然后获取缓存
const key = vnode.key == null ? comp : vnode.key
const cachedVNode = cache.get(key)
// 将当前的键赋值给待缓存的键，上面说明了，这里会触发钩子函数中的子树缓存
pendingCacheKey = key

if (cachedVNode) {
  //如果有缓存，复用缓存
  vnode.el = cachedVNode.el
  vnode.component = cachedVNode.component
  //这里是动画的处理，触发过渡动画的钩子
  if (vnode.transition) {
    setTransitionHooks(vnode, vnode.transition!)
  }
  vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
  //更新key
  keys.delete(key)
  keys.add(key)
} else {
  //如果没有缓存，加入key，判断max数量，删除多余的缓存。
  keys.add(key)
  if (max && keys.size > parseInt(max as string, 10)) {
    pruneCacheEntry(keys.values().next().value)
  }
}
```
这里就是 `keep-alive setup` 的全貌了, 主要就是声明一些方法，主要是 active, deActive, 和卸载组件，缓存管理的一些方法，并且返回一个函数，用于创建处理插槽中的新组件。

### 2. deactivate

```ts
sharedContext.deactivate = (vnode: VNode) => {
  //获取当前 Vnode 组件
  const instance = vnode.component! 
  //移动节点到 storageContainer
  move(vnode, storageContainer, null, MoveType.LEAVE, parentSuspense)
  // 异步执行
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

  if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
    // Update components tree
    devtoolsComponentAdded(instance)
  }
}
```

也就是说 `deactivate` 并没有删除节点，而是移动到了 `storageContainer`, 然后调用钩子。

这里我有一个疑问, Vue 如何生成两个组件。

```ts
// render
if (__DEV__) {
  startMeasure(instance, `render`)
}
const nextTree = renderComponentRoot(instance)
if (__DEV__) {
  endMeasure(instance, `render`)
}
const prevTree = instance.subTree
instance.subTree = nextTree

if (__DEV__) {
  startMeasure(instance, `patch`)
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
)
```

也就是说，用新生成的子树和老的子树进行对比，然后解决

总是说子树, subTree, 那么和 vnode 有什么区别？都是虚拟节点。

- instance.subTree 表示组件的子树的根节点的虚拟节点。
- instance.vnode 表示整个组件的根节点的虚拟节点。

区别在哪里？一个是子树，一个是当前节点，子树包含当前节点，也包含子组件的。
 
### 3. active

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

这里的 instance.vnode 其实是上一个组件，vnode 是需要渲染的组件.

move 会把 `vnode` 通过 `dom beforeInsert` 到 `container`

patch 会把 `vnode.el = instance.vnode.el` && `instance.vnode = vnode`

### 4. include, exclude, max

```ts
if (
(include && (!name || !matches(include, name))) ||
(exclude && name && matches(exclude, name))
) {
	current = vnode
	return rawVNode
}
```

include 和 exclude, max 是在 keep-live setup 函数的返回的函数中, 根据 include，exclude 来判断是否缓存

```ts
keys.add(key)
// prune oldest entry
if (max && keys.size > parseInt(max as string, 10)) {
  pruneCacheEntry(keys.values().next().value)
}
```

max 会在需要缓存之前，判断是否需要清理缓存。

### 5. 如何缓存

关键在于 `pendingCacheKey`

```ts
// cache sub tree after render
let pendingCacheKey: CacheKey | null = null
const cacheSubtree = () => {
  // fix #1621, the pendingCacheKey could be 0
  if (pendingCacheKey != null) {
	cache.set(pendingCacheKey, getInnerChild(instance.subTree))
  }
}
onMounted(cacheSubtree)
onUpdated(cacheSubtree)
```

当组件触发钩子的时候，判断是否需要触发钩子中的缓存。

如果 

```ts
(include && (!name || !matches(include, name))) ||
(exclude && name && matches(exclude, name))
```

不通过的话，就无法执行 `pendingCacheKey = key` 和 `keys.add(key)`.

也就是说，在 keep-alive 下，组件渲染或者跟新完成后，会开始缓存。