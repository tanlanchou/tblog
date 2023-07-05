---
title: vue3 defineAsyncComponent & Suspense 用法以及源码
date: 2023-07-06 13:22:01
tags: 
    - vue3
    - 前端
    - defineAsyncComponent
    - Suspense
    - 源码
description: Vue3 Suspense 和 defineAsyncComponent 作用，以及源码解析
---

### 01. defineAsyncComponent 定义和使用

```ts
function defineAsyncComponent(
  source: AsyncComponentLoader | AsyncComponentOptions
): Component

type AsyncComponentLoader = () => Promise<Component>

interface AsyncComponentOptions {
  loader: AsyncComponentLoader
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number
  timeout?: number
  suspensible?: boolean
  onError?: (
    error: Error,
    retry: () => void,
    fail: () => void,
    attempts: number
  ) => any
}
```

有两个参数 `AsyncComponentLoader` or `AsyncComponentOptions`

写了一个 type AsyncComponentLoader = () => Promise<Component> 参数的

```ts
<div id="app">
    <my-async-component></my-async-component>
</div>

<script>
    const MyAsyncComponent = Vue.defineAsyncComponent(() => {
        // 异步加载组件的逻辑
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    template: '<div>This is an async component!</div>'
                });
            }, 2000);
        });
    });

    const app = Vue.createApp({
        components: {
            MyAsyncComponent
        }
    });

    app.mount('#app');
</script>
```

既然可以这样写，也可以这样写

```ts
const MyAsyncComponent = Vue.defineAsyncComponent(() => {
    return  import('../a.vue');
});
```

另一种就是写一个 `options`

```ts
const AsyncComponent = Vue.defineAsyncComponent({
    // 使用 AsyncComponentOptions 配置对象
    loader: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    template: '<div>This is an async component!</div>'
                });
            }, 10000);
        });
    },
    delay: 200, // 可选项，加载延迟
    timeout: 3000, // 可选项，超时时间
    errorComponent: 'div', // 可选项，加载错误时显示的组件或标签
    timeoutComponent: { // 可选项，加载超时时显示的组件或配置对象
        template: '<div>Component loading timed out.</div>'
    },
    suspensible: true // 可选项，启用组件的暂停和恢复功能
});
```

### 02. 源码

**packages\runtime-core\src\apiAsyncComponent.ts**

这个代码看得比较纠结，简单说就是

1. 获取参数
2. 定义一些局部变量用于跟踪异步加载状态，如 pendingRequest、resolvedComp 和 retries。
3. 实现 load 函数，用于执行异步加载过程。它会调用 loader 函数，并处理加载过程中的错误和超时。加载成功后，将得到的组件进行处理，并返回 Promise 对象。
4. 使用 defineComponent 定义一个包裹组件 (AsyncComponentWrapper)，并在 setup 钩子中处理异步加载的逻辑。
5. 在 setup 钩子中，根据加载状态渲染不同的内容，包括已加载的组件、加载中的组件、错误组件等。
6. 返回 AsyncComponentWrapper 作为最终的组件选项对象，并使用类型断言 as T 将其转换为泛型参数 T 所指定的类型。

简单说就是这些，我更关注的，这些参数有什么用。

### 03. delay

```ts
const delayed = ref(!!delay)

if (delay) {
setTimeout(() => {
    delayed.value = false
}, delay)
}

return () => {
    if (loaded.value && resolvedComp) {
        return createInnerComp(resolvedComp, instance)
    } else if (error.value && errorComponent) {
        return createVNode(errorComponent, {
        error: error.value
        })
    } else if (loadingComponent && !delayed.value) {
        return createVNode(loadingComponent)
    }
}
```

看到这里，知道这个 `delay` 有什么用了吧，他只和 `loadingComponent` 相关。

1. 判断是否load完成以及解析完成组件
2. 判断错误信息和错误组件
3. loading组件和是否应该loading

也就是说，`delay` 是出现 `loadingComponent` 组件出现的延迟时间

### 04. timeout

```ts
if (timeout != null) {
    setTimeout(() => {
        if (!loaded.value && !error.value) {
        const err = new Error(
            `Async component timed out after ${timeout}ms.`
        )
        onError(err)
        error.value = err
        }
    }, timeout)
}
```

这个 `timeout`稍显简陋，就是一个定时任务，并且无法中断 `promise`, 也就是 `load`.

但是，`error.value` 会触发 `render` 重新渲染，并且调用，所以会调用 `errorComponent`

### 04 suspensible

是否开启了 `suspens`.

### 05. defineAsyncComponent 总结

这里基本就知道他是怎么用的了，以及 error，loading 组件加载的原理，以及 setTimeout & delay & suspensible 等参数作用是什么

```ts
if (
(__FEATURE_SUSPENSE__ && suspensible && instance.suspense) ||
(__SSR__ && isInSSRComponentSetup)
) {
return load()
    .then(comp => {
    return () => createInnerComp(comp, instance)
    })
    .catch(err => {
    onError(err)
    return () =>
        errorComponent
        ? createVNode(errorComponent as ConcreteComponent, {
            error: err
            })
        : null
    })
}
```

### 06. suspense

官方文档 [Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)，其他的简单文档 [Vue3 的新功能 — Suspense](https://medium.com/i-am-mike/vue-3-vue3-%E7%9A%84%E6%96%B0%E5%8A%9F%E8%83%BD-suspense-428e02254030)

> <Suspense> 是一个内置组件，用来在组件树中协调对异步依赖的处理。它让我们可以在组件树上层等待下层的多个嵌套异步依赖项解析完成，并可以在等待时渲染一个加载状态。


这个其实就说的很明确了，刚才说的 defineAsyncComponent 是针对单个组件，Suspense可以对于整个下面的组件都控制。

> Suspense 可以等待的异步依赖有两种：
>
> 1. 带有异步 setup() 钩子的组件。这也包含了使用 <script setup> 时有顶层 await 表达式的组件。
> 2. 异步组件, definedAsyncComponent, suspensible = true

以及两个插槽和事件

```ts
<Suspense>
  <!-- 具有深层异步依赖的组件 -->
  <Dashboard />

  <!-- 在 #fallback 插槽中显示 “正在加载中” -->
  <template #fallback>
    Loading...
  </template>
</Suspense>
```

default 插槽只能有一个组件，fallback 正在加载。

事件

> <Suspense> 组件会触发三个事件：pending、resolve 和 fallback。pending 事件是在进入挂起状态时触发。resolve 事件是在 default 插槽完成获取新内容时触发。fallback 事件则是在 fallback 插槽的内容显示时触发。


error

onErrorCaptured 在上层捕获

ok, 做一个简单测试

```ts
///main
<template>
    <div>
        <Suspense>
            <template #default>
                <AsyncComponentOne /> 
            </template>
            <template #fallback>
                <Loading />
            </template>
        </Suspense>
    </div>
</template>
  
<script setup lang="ts">
import { defineAsyncComponent, Suspense } from 'vue';
import Loading from './Loading.vue';

const AsyncComponentOne = defineAsyncComponent(() =>
    import('./OneAsyncComponent.vue')
);
</script>

///OneAsyncComponent
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import ThreeAsyncComponen from './ThreeAsyncComponent.vue';

const asyncLeft = defineAsyncComponent(() => {
    return import(`./TwoAsyncComponent.vue`);
})
</script>

<template>
    <div>
        <asyncLeft />
    </div>
    <div>
        <ThreeAsyncComponen />
    </div>
</template>

<style scoped>
.read-the-docs {
    color: #888;
}
</style>

///TwoAsyncComponent.vue
<script setup lang="ts">
import { ref } from 'vue';

let dataMsg = ref(await new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('');
    }, 5000);
}).then(() => {
    return (new Date()).getTime();
}))
</script>

<template>
    <div>
        <h1>Two AsyncComponent {{ dataMsg }}</h1>
    </div>
</template>

<style scoped>
.read-the-docs {
    color: #888;
}
</style>

///ThreeAsyncComponen.vue
<script setup lang="ts">
import { ref } from 'vue';

let dataMsg = ref(await new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('');
    }, 10000);
}).then(() => {
    return (new Date()).getTime();
}))
</script>

<template>
    <div>
        <h1>Three AsyncComponent {{ dataMsg }}</h1>
    </div>
</template>

<style scoped>
.read-the-docs {
    color: #888;
}
</style>
```

### 07. Suspendse 如何实现的？

```ts
// Suspense exposes a component-like API, and is treated like a component
// in the compiler, but internally it's a special built-in type that hooks
// directly into the renderer.
// Suspense 公开了类似组件的 API，并被视为组件
// 在编译器中，但在内部它是一个特殊的内置类型，可以挂钩
// 直接进入渲染器。
export const SuspenseImpl = {
  name: 'Suspense',
  // In order to make Suspense tree-shakable, we need to avoid importing it
  // directly in the renderer. The renderer checks for the __isSuspense flag
  // on a vnode's type and calls the `process` method, passing in renderer
  // internals.
  // 为了使 Suspense 树可摇动，我们需要避免导入它
  // 直接在渲染器中。 渲染器检查 __isSuspense 标志
  // 在 vnode 的类型上并调用 `process` 方法，传入渲染器
  // 内部结构。
  __isSuspense: true,
  process(
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null,
    parentSuspense: SuspenseBoundary | null,
    isSVG: boolean,
    slotScopeIds: string[] | null,
    optimized: boolean,
    // platform-specific impl passed from renderer
    rendererInternals: RendererInternals
  ) {
    if (n1 == null) {
      mountSuspense(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized,
        rendererInternals
      )
    } else {
      patchSuspense(
        n1,
        n2,
        container,
        anchor,
        parentComponent,
        isSVG,
        slotScopeIds,
        optimized,
        rendererInternals
      )
    }
  },
  hydrate: hydrateSuspense,
  create: createSuspenseBoundary,
  normalize: normalizeSuspenseChildren
}

// 用于 h 和 TSX props 推理的强制公共类型
// Force-casted public typing for h and TSX props inference
export const Suspense = (__FEATURE_SUSPENSE__
  ? SuspenseImpl
  : null) as unknown as {
  __isSuspense: true
  new (): {
    $props: VNodeProps & SuspenseProps
    $slots: {
      default(): VNode[]
      fallback(): VNode[]
    }
  }
}
```

源码注释里面说

>  直接在渲染器中。 渲染器检查 __isSuspense 标志
>  在 vnode 的类型上并调用 `process` 方法，传入渲染器

但是这里明明是一个 Object, 没有检查，于是我又查了 process 的引用

```ts
} else if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
    ;(type as typeof SuspenseImpl).process(
    n1,
    n2,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    slotScopeIds,
    optimized,
    internals
    )
}
```

__FEATURE_SUSPENSE__ 是指的是开启 suspense 功能.

**mountSuspense**

```ts
function mountSuspense(
  vnode: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  isSVG: boolean,
  slotScopeIds: string[] | null,
  optimized: boolean,
  rendererInternals: RendererInternals
) {
  const {
    p: patch,
    o: { createElement }
  } = rendererInternals
  const hiddenContainer = createElement('div')

  //这个可以说是核心创建方法, 返回一个 suspense，后面操作的核心
  const suspense = (vnode.suspense = createSuspenseBoundary(
    vnode,
    parentSuspense,
    parentComponent,
    container,
    hiddenContainer,
    anchor,
    isSVG,
    slotScopeIds,
    optimized,
    rendererInternals
  ))

    //开始在 off-dom 容器中挂载内容子树
  // start mounting the content subtree in an off-dom container
  patch(
    null,
    (suspense.pendingBranch = vnode.ssContent!),
    hiddenContainer,
    null,
    parentComponent,
    suspense,
    isSVG,
    slotScopeIds
  )
  // 现在检查我们是否遇到了任何异步依赖
  // now check if we have encountered any async deps
  if (suspense.deps > 0) {
    // has async
    // invoke @fallback event
    triggerEvent(vnode, 'onPending')
    triggerEvent(vnode, 'onFallback')

    // mount the fallback tree
    patch(
      null,
      vnode.ssFallback!,
      container,
      anchor,
      parentComponent,
      null, // fallback tree will not have suspense context
      isSVG,
      slotScopeIds
    )
    setActiveBranch(suspense, vnode.ssFallback!)
  } else {
    // Suspense has no async deps. Just resolve.
    suspense.resolve(false, true)
  }
}
```

`createSuspenseBoundary`

> 创建 suspense 对象，该对象包含了 <Suspense> 组件的各种属性和方法。
> resolve 方法用于处理异步组件加载完成后的操作。它会根据加载状态和配置来移动或渲染组件内容，并触发相关的事件和效果。
> fallback 方法用于处理异步组件加载过程中的回退（fallback）操作。它会根据配置来渲染回退内容，并触发相关的事件。
> move 方法用于移动异步组件的位置。
> next 方法用于获取当前活跃分支的下一个节点。
> registerDep 方法用于注册异步组件的依赖。当异步组件的依赖完成加载时，会触发相应的回调处理。
> unmount 方法用于卸载 <Suspense> 组件边界及其相关的组件。

```ts
// setup() is async. This component relies on async logic to be resolved
// before proceeding
if (__FEATURE_SUSPENSE__ && instance.asyncDep) {

    //这里其实就是 asyncDep，处理 catch + then, 处理参数 setupRenderEffect(asyncResult) 处理钩子
    parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect)

    // Give it a placeholder if this is not hydration
    // TODO handle self-defined fallback
    if (!initialVNode.el) {
        const placeholder = (instance.subTree = createVNode(Comment))
        processCommentNode(null, placeholder, container!, anchor)
    }
    return
}
```

这里遇到异步任务不会立刻执行，而是增加 `Dep++`, 然后预留位置

会在卸载或者解析完成以后 `--`

所以这里的 dep 出处在这里

```ts
registerDep(instance, setupRenderEffect) {
    const isInPendingSuspense = !!suspense.pendingBranch
    if (isInPendingSuspense) {
    suspense.deps++
    }
    const hydratedEl = instance.vnode.el
    instance
    .asyncDep!.catch(err => {
        handleError(err, instance, ErrorCodes.SETUP_FUNCTION)
    })
    .then(asyncSetupResult => { ... }
```

事件在 `handleError`, 触发 `onErrorCaptured`

```ts
  // now check if we have encountered any async deps
  if (suspense.deps > 0) {
    // has async
    // invoke @fallback event
    triggerEvent(vnode, 'onPending')
    triggerEvent(vnode, 'onFallback')

    // mount the fallback tree
    patch(
      null,
      vnode.ssFallback!,
      container,
      anchor,
      parentComponent,
      null, // fallback tree will not have suspense context
      isSVG,
      slotScopeIds
    )
    setActiveBranch(suspense, vnode.ssFallback!)
  } else {
    // Suspense has no async deps. Just resolve.
    suspense.resolve(false, true)
  }
```

如果有异步任务，挂载 `fallback`，也就是 `loading` 之类的, `setActiveBranch` 是把 `vnode.ssFallback` 设置为当前的, 然后触发生命周期

```ts
triggerEvent(vnode, 'onPending')
triggerEvent(vnode, 'onFallback')
```

如果没有，直接完成。`suspense.resolve(false, true)`, 也就保证他在所有异步完全执行完成以后执行。

一旦 `asyncDep` 执行，就会 -1， 然后 `resolve`

```ts    
resolve(resume = false, sync = false) {
    if (__DEV__) {
    if (!resume && !suspense.pendingBranch) {
        throw new Error(
            `suspense.resolve() is called without a pending branch.`
        )
    }
    if (suspense.isUnmounted) {
        throw new Error(
            `suspense.resolve() is called on an already unmounted suspense boundary.`
        )
    }
    }
    const {
        vnode,
        activeBranch,
        pendingBranch,
        pendingId,
        effects,
        parentComponent,
        container
    } = suspense

    if (suspense.isHydrating) {
        suspense.isHydrating = false
    } else if (!resume) {
        const delayEnter =
            activeBranch &&
            pendingBranch!.transition &&
            pendingBranch!.transition.mode === 'out-in'
    if (delayEnter) {
        activeBranch!.transition!.afterLeave = () => {
            if (pendingId === suspense.pendingId) {
                move(pendingBranch!, container, anchor, MoveType.ENTER)
            }
        }
    }
    // this is initial anchor on mount
    let { anchor } = suspense
    // unmount current active tree
    if (activeBranch) {
        // if the fallback tree was mounted, it may have been moved
        // as part of a parent suspense. get the latest anchor for insertion
        anchor = next(activeBranch)
        unmount(activeBranch, parentComponent, suspense, true)
    }
    if (!delayEnter) {
        // move content from off-dom container to actual container
        move(pendingBranch!, container, anchor, MoveType.ENTER)
    }
    }

    setActiveBranch(suspense, pendingBranch!)
    suspense.pendingBranch = null
    suspense.isInFallback = false

    // flush buffered effects
    // check if there is a pending parent suspense
    let parent = suspense.parent
    let hasUnresolvedAncestor = false
    while (parent) {
    if (parent.pendingBranch) {
        // found a pending parent suspense, merge buffered post jobs
        // into that parent
        parent.effects.push(...effects)
        hasUnresolvedAncestor = true
        break
    }
    parent = parent.parent
    }
    // no pending parent suspense, flush all jobs
    if (!hasUnresolvedAncestor) {
    queuePostFlushCb(effects)
    }
    suspense.effects = []

    // resolve parent suspense if all async deps are resolved
    if (isSuspensible) {
    if (
        parentSuspense &&
        parentSuspense.pendingBranch &&
        parentSuspenseId === parentSuspense.pendingId
    ) {
        parentSuspense.deps--
        if (parentSuspense.deps === 0 && !sync) {
        parentSuspense.resolve()
        }
    }
    }

    // invoke @resolve event
    triggerEvent(vnode, 'onResolve')
},
```

就是全部创建流程，更新 activeBranch 为 default， 挂载 default， 删除 Fallback, 修改属性为默认值，处理嵌套, 然后触发，

### 08. 总结

ok, 简单说就是 defineAsyncCom.. 单个， suspense 多个同时处理。

suspense，有 defalut 和 fallback 两个插槽，可以提供3个钩子，

```ts
triggerEvent(vnode, 'onPending')
triggerEvent(vnode, 'onFallback')
```

在进行异步之前触发，两个钩子可以说同时触发， `triggerEvent(vnode, 'onResolve')` 在完成以后触发。

defineAsyncComponent 可以单个进行异步，他就是 definedComponent 封装.

- [defineasynccomponent](https://cn.vuejs.org/api/general.html#defineasynccomponent)
- [异步组件](https://cn.vuejs.org/guide/components/async.html)
- [Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)
- [Vue3 的新功能 — Suspense](https://medium.com/i-am-mike/vue-3-vue3-%E7%9A%84%E6%96%B0%E5%8A%9F%E8%83%BD-suspense-428e02254030)
- [Vue3 新特性 Teleport Suspense实现原理](https://juejin.cn/post/7044880716793905183#heading-9)
