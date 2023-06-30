---
title: vue keep-alive
date: 2023-06-29 13:22:01
tags: 
    - vue2
    - vue3
    - 前端
    - keep-alive
    - ts
description: 对比 Vue2.x Vue3.x keep-alive 组件对比
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

### 1.2 deactivate

```ts
import {
  ConcreteComponent,
  getCurrentInstance,
  SetupContext,
  ComponentInternalInstance,
  currentInstance,
  getComponentName,
  ComponentOptions
} from '../component'
// 导入相关的组件和函数

import {
  VNode,
  cloneVNode,
  isVNode,
  VNodeProps,
  invokeVNodeHook,
  isSameVNodeType
} from '../vnode'
// 导入虚拟节点相关的函数和类型

import { warn } from '../warning'
// 导入警告函数

import {
  onBeforeUnmount,
  injectHook,
  onUnmounted,
  onMounted,
  onUpdated
} from '../apiLifecycle'
// 导入生命周期相关的函数

import {
  isString,
  isArray,
  isRegExp,
  ShapeFlags,
  remove,
  invokeArrayFns
} from '@vue/shared'
// 导入一些共享的工具函数和类型

import { watch } from '../apiWatch'
// 导入监听函数

import {
  RendererInternals,
  queuePostRenderEffect,
  MoveType,
  RendererElement,
  RendererNode
} from '../renderer'
// 导入渲染器相关的函数和类型

import { setTransitionHooks } from './BaseTransition'
// 导入过渡相关的函数

import { ComponentRenderContext } from '../componentPublicInstance'
// 导入组件公共实例相关的类型

import { devtoolsComponentAdded } from '../devtools'
// 导入开发工具相关的函数

import { isAsyncWrapper } from '../apiAsyncComponent'
// 导入异步组件相关的函数

import { isSuspense } from './Suspense'
// 导入Suspense相关的函数

import { LifecycleHooks } from '../enums'
// 导入生命周期钩子的枚举类型

type MatchPattern = string | RegExp | (string | RegExp)[]
// 定义MatchPattern类型，可以是字符串、正则表达式或字符串和正则表达式的数组

export interface KeepAliveProps {
  include?: MatchPattern
  exclude?: MatchPattern
  max?: number | string
}
// 定义KeepAlive组件的属性类型，包括include、exclude和max

type CacheKey = string | number | symbol | ConcreteComponent
type Cache = Map<CacheKey, VNode>
type Keys = Set<CacheKey>
// 定义缓存相关的类型，包括缓存键、缓存和键的集合

export interface KeepAliveContext extends ComponentRenderContext {
  renderer: RendererInternals
  activate: (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
    isSVG: boolean,
    optimized: boolean
  ) => void
  deactivate: (vnode: VNode) => void
}
// 定义KeepAlive组件的上下文类型，包括渲染器、激活函数和取消激活函数

export const isKeepAlive = (vnode: VNode): boolean =>
  (vnode.type as any).__isKeepAlive
// 判断一个VNode是否为KeepAlive组件的标志

const KeepAliveImpl: ComponentOptions = {
  name: `KeepAlive`,

  // Marker for special handling inside the renderer. We are not using a ===
  // check directly on KeepAlive in the renderer, because importing it directly
  // would prevent it from being tree-shaken.
  __isKeepAlive: true,

  // Configuraion for the `render` method
  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number]
  },
  // KeepAlive组件的props属性，包括include、exclude和max

  setup(props: KeepAliveProps, { slots }: SetupContext) {
    // 获取当前组件实例
    const instance = getCurrentInstance() as ComponentInternalInstance
    // 如果是服务端渲染，则直接返回组件的子节点
    if (!instance) {
      return slots.default
    }

    // 定义缓存、缓存键的集合和当前VNode节点
    const cache: Cache = new Map()
    const keys: Keys = new Set()
    let current: VNode | null = null

    // In dev, expose cache on instance
    if (__DEV__) {
      instance.__v_cache = cache
    }

    // 获取渲染器相关的API
    const {
      render: renderWithContext,
      hydrate: hydrateWithContext,
      internalRender: render
    } = instance.renderProxy.$options

    // 创建一个div元素作为缓存容器
    const container = document.createElement('div')

    // 定义sharedContext的activate和deactivate方法
    const sharedContext: KeepAliveContext = {
      renderer: instance.renderer,
      activate: (vnode, container, anchor, isSVG, optimized) => {
        // 激活VNode节点
        const instance = vnode.component!
        move(instance.vnode, container, anchor, MoveType.ENTER, isSVG)
        // 执行激活钩子函数
        invokeArrayFns(instance.a, vnode, isSVG)
        // 更新激活状态
        instance.isDeactivated = false
        // 更新激活标志
        if (instance.a !== null && optimized) {
          instance.a = filter(instance.a, vnode)
          queuePostRenderEffect(() => {
            // 删除多余的VNode节点
            pruneCache(instance.a, instance)
          }, shared)
        }
      },
      deactivate: (vnode) => {
        // 取消激活VNode节点
        const instance = vnode.component!
        move(instance.vnode, container, null, MoveType.LEAVE, vnode.el)
        // 执行取消激活钩子函数
        invokeArrayFns(instance.da, vnode)
        // 更新取消激活状态
        instance.isDeactivated = true
        // 更新取消激活标志
        if (instance.da !== null && instance.a === null) {
          instance.da = filter(instance.da, vnode)
          queuePostRenderEffect(() => {
            // 删除多余的VNode节点
            pruneCache(instance.da, instance)
          }, shared)
        }
      }
    }

    // 定义unmount函数，用于卸载VNode节点
    const unmount: (vnode: VNode) => void = (vnode) => {
      // 调用渲染器的卸载函数
      instance.renderer.unmount(vnode, instance, parentSuspense)
    }

    // 定义pruneCache函数，根据include和exclude属性清理缓存
    const pruneCache = (vnodes: VNode[], instance: ComponentInternalInstance) => {
      // 获取include和exclude属性
      const { include, exclude, max } = props
      // 如果max属性是数字，则限制缓存大小
      if (isNumber(max) && max > 0) {
        const overLimit = vnodes.length - max
        if (overLimit > 0) {
          // 删除超过限制的VNode节点
          pruneCacheEntry(vnodes[overLimit - 1])
        }
      }
      // 如果include或exclude属性存在，则根据匹配模式删除VNode节点
      if (include || exclude) {
        const cached = vnodes.filter(
          (vnode) => include && !matches(include, vnode.type)) ||
          (exclude && matches(exclude, vnode.type))
        // 删除匹配的VNode节点
        cached.forEach((vnode) => {
          pruneCacheEntry(vnode)
          // 调用渲染器的卸载函数
          unmount(vnode)
        })
      }
    }

    // 定义pruneCacheEntry函数，删除缓存中的VNode节点
    const pruneCacheEntry = (vnode: VNode) => {
      // 从缓存中移除VNode节点
      cache.delete(vnode.key as CacheKey)
      keys.delete(vnode.key as CacheKey)
    }

    // 定义matches函数，用于匹配模式是否符合VNode节点的类型
    const matches = (pattern: MatchPattern, type: ConcreteComponent) => {
      if (isString(pattern)) {
        return pattern.split(',').indexOf(type) > -1
      } else if (isRegExp(pattern)) {
        return pattern.test(type as string)
      } else if (isArray(pattern)) {
        return pattern.some((p) => matches(p, type))
      }
      return false
    }

    // 定义move函数，用于移动VNode节点
    const move = (
      vnode: VNode,
      container: RendererElement,
      anchor: RendererNode | null,
      moveType: MoveType,
      parentSuspense: SuspenseBoundary | null
    ) => {
      // 调用渲染器的移动函数
      instance.renderer.move(vnode, container, anchor, moveType, parentSuspense)
    }

    // 定义render函数，根据缓存和当前VNode节点渲染组件
    const render: () => VNode = () => {
      // 获取缓存键
      const key = getCacheKey(instance.vnode, instance.parent)
      // 如果缓存中存在对应的VNode节点，则从缓存中取出
      if (cache.has(key)) {
        current = cache.get(key)!
        // 更新缓存和键的集合
        keys.delete(key)
        keys.add(key)
      } else {
        // 否则，克隆当前VNode节点并放入缓存中
        current = cloneVNode(instance.vnode)
        cache.set(key, current)
        keys.add(key)
        // 调用渲染器的渲染函数
        render(current, container)
        // 如果当前VNode节点有激活钩子函数，则执行
        if (current.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
          // 执行激活钩子函数
          invokeArrayFns(instance.a, current, container)
        }
      }
      // 返回当前VNode节点
      return current
    }

    // 注册生命周期钩子函数
    onMounted(() => {
      // 获取当前VNode节点
      current = render()
      // 执行挂载钩子函数
      invokeVNodeHook(current!, 'mounted')
    })

    onUpdated(() => {
      // 更新当前VNode节点
      const prev = current
      current = render()
      // 执行更新钩子函数
      invokeVNodeHook(current!, 'updated', prev!)
    })

    onBeforeUnmount(() => {
      // 执行卸载钩子函数
      invokeVNodeHook(current!, 'beforeUnmount')
    })

    onUnmounted(() => {
      // 执行卸载钩子函数
      invokeVNodeHook(current!, 'unmounted')
    })

    return () => {
      // 返回当前VNode节点
      return current
    }
  }
}

// 设置KeepAlive组件的过渡钩子函数
setTransitionHooks(KeepAliveImpl)

// 导出KeepAlive组件
export const KeepAlive = KeepAliveImpl as any

```