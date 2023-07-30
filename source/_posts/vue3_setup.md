---
title: vue3 setup
date: 2023-07-31 00:22:01
tags: 
    - vue3
    - 前端
    - setup
    - 源码
description: Vue3 Suspense 和 defineAsyncComponent 作用，以及源码解析
---

### 怎么实现的？

之前在 [beforeCreate, created vs setup](/tblog/2023/06/20/vue_setup_created_before_created/) 当中说过 setup 函数。

在 **packages/runtime-core/src/renderer.ts** mountComponent 函数。

我们可以快速过一下他怎么实现的。

首先为什么会调用 **mountComponent** , 这个其实不管是 Vue2 还是 Vue3, 都是通过 patch 的调用，对比之后需要创建组件，才会调用。

**mountComponent** 做了什么?

1. 获取组件实例 instance
2. 如果是 keepalive 组件的话，将默认的渲染方法，加入到 KeepAliveContext 当然的 render 当中
3. setupComponent 执行, 解析 solt, props 然后执行 setup 函数，处理返回值，异步，function, 或者直接返回。 然后处理返回值，如果是 function 的话，就会替换默认 render。
4. 调用 setupRenderEffect 渲染节点

也就是说 `setupComponent` 调用, `setupRenderEffect` 渲染.

setupRenderEffect 做了些事情。

创建一个 componentUpdateFn 函数，通过 effect 函数，用来调度 componentUpdateFn, 调度的源码分析在 [vue3 任务调度源码解析](/tblog/2023/07/08/Vue3_queue/)。 

简单理解就是，通过 proxy 劫持 set => 触发到 scheduler 也就是

```ts
const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(update),
      instance.scope // track it in component's effect scope
    ))
```

中的 `() => queueJob(update)` 然后统一调度 `componentUpdateFn`

componentUpdateFn 其实本质上是使用 patch 去对比，不过区分了是否有 `instance.isMounted`, 从而触发不同的生命周期

```ts
 if (!instance.isMounted) {
    const { bm, m, parent } = instance;
    // beforeMount hook
    if (bm) {
        invokeArrayFns(bm)
    }

    //...

    patch(
        null,
        subTree,
        container,
        anchor,
        instance,
        parentSuspense,
        isSVG
    )

    //..

    // mounted hook
    if (m) {
        queuePostRenderEffect(m, parentSuspense)
    }
 }
 else {
    let { next, bu, u, parent, vnode } = instance

    // beforeUpdate hook
    if (bu) {
        invokeArrayFns(bu)
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

    if (u) {
        queuePostRenderEffect(u, parentSuspense)
    }
 }
```

这里涉及一个知识点. `queuePostRenderEffect` 并不是立刻执行的， 而是一个会加入队列，然后最后调用，先进先出。

所以 updated 或者 mounted 最后是这种结果

组件1 beforeMounted, 子组件1 beforeMounted => 子组件1 mounted => 组件1 mounted。

这大概就是 setup 的执行过程。

并且在需要注意的是，如果自定义了 render , 那么每次更新都会调用。 setup 函数只会在 mountComponent 的时候调用一次。

大概是这样.