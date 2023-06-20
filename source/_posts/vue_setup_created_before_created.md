---
title: beforeCreate, created vs setup
date: 2023-6-20 09:36:29
tags: 
    - Vue3.x
    - Vue2.x
    - beforeCreate
    - created
    - setup
---

# beforeCreate, created vs setup

```ts
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
```

有这么多生命周期，我们一个一个对比。


### 1. beforeCreate

vue2.x 核心代码一直在这个位置 **src\core\instance\init.ts**


```ts
export function initMixin(Vue: typeof Component) {
  Vue.prototype._init = function (options?: Record<string, any>) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to mark this as a Vue instance without having to do instanceof
    // check
    vm._isVue = true
    // avoid instances from being observed
    vm.__v_skip = true
    // effect scope
    vm._scope = new EffectScope(true /* detached */)
    vm._scope._vm = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options as any)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (__DEV__) {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate', undefined, false /* setContext */)
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

这里包含了

```ts
callHook(vm, 'beforeCreate', undefined, false /* setContext */)
callHook(vm, 'created')
```

先看 `beforeCreate` 做了什么



```ts
// merge options
// 可以简单的理解为2种情况
// 1. 根组件合并，你 new Vue的参数，mixin，api 都合并为一个新的 $options
// 2. 子组件合并，把父组件的 event, props 需要传递的东西合并。
if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options as any)
} else {
    vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor as any),
    options || {},
    vm
    )
}

//用于初始化组件生命周期的函数。它接受一个组件实例 vm 作为参数，并在该组件实例上设置一些属性和状态。
//总体来说就是初始化当前组件的很多属性
initLifecycle(vm)
//事件注册
//把父组件的 _parentListeners 传递给当前组件监听
initEvents(vm)
//解析插槽
//绑定createElement 组件实例
//获取 $attrs & $listenters, 并且响应式
initRender(vm)
```

也就是说 beforeCreate 之前做了 options,events,lifecycle, render的一些函数。

### 2. beforeCreate 能做些什么？

能做些什么肯定是基于 options,events,lifecycle, render。

1. 访问组件实例的配置项和属性，也就是合并的 options.
2. 因为只是加载了属性，事件等等前置的东西，所以可以进行身份验证，初始值，修改属性，加载数据之类的操作
3. 注册事件监听器 event

其他的都不能访问。

### 3. created

beforeCreated 在钩子执行完成以后

```ts

//解析vm.$options.inject
//defineReactive 响应式
initInjections(vm) // resolve injections before data/props

//if (opts.props) initProps(vm, opts.props)
//if (opts.methods) initMethods(vm, opts.methods)
//if (opts.data) initData(vm)
//if (opts.computed) initComputed(vm, opts.computed)
//if (opts.watch && opts.watch !== nativeWatch) initWatch(vm, opts.watch)
//就是把这些解析出来，然后响应式，挂载在vm上
initState(vm)

//解析 resolveProvided(vm)
//响应式 Object.defineProperty
initProvide(vm) // resolve provide after data/props
```

也就是在执行 Created 之前，解析出 `props, methods, data, computed, watch, inject, provide`.

也就是说，在 Created 之后就可以访问这些数据了。

### 4. created 能做什么？

1. 获取组件数据。
2. 访问组件的 DOM 元素，组件的模板已经被编译为 DOM 元素，并且可以通过 this.$el 来访问组件的根元素。你可以执行一些需要操作实际 DOM 的任务，例如操作元素属性、添加事件监听器等。
3. 调用方法。

### 5. setup

在看生命周期钩子之前，还是需要知道大概 Vue3 创建组件的基本流程。

```ts
//获取组件实例
const instance: ComponentInternalInstance =
  compatMountInstance ||
  (initialVNode.component = createComponentInstance(
    initialVNode,
    parentComponent,
    parentSuspense
  ))

// inject renderer internals for keepAlive
// 将默认的渲染方法，加入到 KeepAliveContext 当然的 render 当中
if (isKeepAlive(initialVNode)) {
  ;(instance.ctx as KeepAliveContext).renderer = internals
}

// resolve props and slots for setup context
// 其实不仅仅是解析，还执行了 setup函数
setupComponent(instance)

// setup() is async. This component relies on async logic to be resolved
// before proceeding
// 处理异步逻辑的情况，需要等待 setup() 函数完成后再继续  
if (__FEATURE_SUSPENSE__ && instance.asyncDep) {
  parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect)

  // Give it a placeholder if this is not hydration
  // TODO handle self-defined fallback
  if (!initialVNode.el) {
    const placeholder = (instance.subTree = createVNode(Comment))
    processCommentNode(null, placeholder, container!, anchor)
  }
  return
}

//执行组件的渲染效果函数进行渲染
setupRenderEffect(
  instance,
  initialVNode,
  container,
  anchor,
  parentSuspense,
  isSVG,
  optimized
)
```

创建一个组件有什么流程？

1. 获取组件实例
2. 将默认的渲染方法，加入到 KeepAliveContext 当然的 render 当中
3. 解析和执行 setup
4. 处理 setup 异步情况
5. 渲染

那我们继续看 `setupComponent` 函数

```ts
export function setupComponent(
  instance: ComponentInternalInstance,
  isSSR = false
) {
  isInSSRComponentSetup = isSSR

  const { props, children } = instance.vnode
  const isStateful = isStatefulComponent(instance)
  //解析props & slots
  initProps(instance, props, isStateful, isSSR)
  initSlots(instance, children)

  //如果是有状态组件，执行 setup
  const setupResult = isStateful
    ? setupStatefulComponent(instance, isSSR)
    : undefined
  isInSSRComponentSetup = false
  return setupResult
}

//执行setup
function setupStatefulComponent(
  instance: ComponentInternalInstance,
  isSSR: boolean
) {
  const Component = instance.type as ComponentOptions

  // 0. create render proxy property access cache
  instance.accessCache = Object.create(null)
  // 1. create public instance / render proxy
  // also mark it raw so it's never observed
  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers))

  // 2. call setup()
  const { setup } = Component
  if (setup) {
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null)

    setCurrentInstance(instance)
    pauseTracking()
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      ErrorCodes.SETUP_FUNCTION,
      [__DEV__ ? shallowReadonly(instance.props) : instance.props, setupContext]
    )
    resetTracking()
    unsetCurrentInstance()

    if (isPromise(setupResult)) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance)
      if (isSSR) {
        // return the promise so server-renderer can wait on it
        return setupResult
          .then((resolvedResult: unknown) => {
            handleSetupResult(instance, resolvedResult, isSSR)
          })
          .catch(e => {
            handleError(e, instance, ErrorCodes.SETUP_FUNCTION)
          })
      } else if (__FEATURE_SUSPENSE__) {
        // async setup returned Promise.
        // bail here and wait for re-entry.
        instance.asyncDep = setupResult
        if (__DEV__ && !instance.suspense) {
          const name = Component.name ?? 'Anonymous'
          warn(
            `Component <${name}>: setup function returned a promise, but no ` +
              `<Suspense> boundary was found in the parent component tree. ` +
              `A component with async setup() must be nested in a <Suspense> ` +
              `in order to be rendered.`
          )
        }
      } else if (__DEV__) {
        warn(
          `setup() returned a Promise, but the version of Vue you are using ` +
            `does not support it yet.`
        )
      }
    } else {
      handleSetupResult(instance, setupResult, isSSR)
    }
  } else {
    finishComponentSetup(instance, isSSR)
  }
}
```

简单说就是设置上下文，执行 `setup，获取` `setup` 返回值，判断是否异步返回，调用 `handleSetupResult`

`` 就是判断返回类型，进行不同的处理

```ts
isFunction(setupResult) //返回渲染函数
isObject(setupResult) //返回绑定对象，绑定到 setupState 当中
```

然后调用 `finishComponentSetup`， 这里其实主要是处理渲染函数和兼容模式(兼容Vue2.x写法)。

在这里基本明白了组件创建期间做了什么？

1. 需要创建组件的地方调用 `patch`
2. 根据节点类型(shapeFlag & 6 /* ShapeFlags.COMPONENT */), 判断需要调用 `processComponent。`
3. 然后调用 `mountComponent` 创建节点
4. 判断是否是 `keepAlive，写入` `keepAlive` 专门的 `render`
5. 执行 `setupComponent(instance);` 解析和执行 `setup`
  5.1 解析 `props`, `slot`
  5.2 设置 `setup` 执行上下文
  5.3 执行 `setup`
  5.4 处理返回值
  5.5 创建 `render` 函数
6. 处理 `setup` 异步调用情况
7. 渲染

### 6. setup 函数能访问什么？

这里有几个问题，在刚才看 **vue2.x** 源码的时候，不仅仅有这些东西，

在 `beforeCreate` 的时候有 `options，initLifecycle，initEvents，initRender`
在 `created` 的时候可以访问，`props, methods, data, computed, watch, inject, provide`

这些没有可以理解 `methods, data, computed, watch`，因为他已经在 `setup` 函数当中了，那么？其他的呢？

我们应该如何访问？

拿 options 来说

```ts
import { getCurrentInstance } from 'vue';
const instance = getCurrentInstance()
console.log('instance???', instance.appContext.config.globalProperties)
```

initRender 在解析和执行 setup 会初始化。

`$attrs` 在 `createSetupContext` 中解析，然后传入 `callWithErrorHandling`

```ts
const setupContext = (instance.setupContext =
  setup.length > 1 ? createSetupContext(instance) : null)

setCurrentInstance(instance)
pauseTracking()
const setupResult = callWithErrorHandling(
  setup,
  instance,
  ErrorCodes.SETUP_FUNCTION,
  [__DEV__ ? shallowReadonly(instance.props) : instance.props, setupContext]
)
```

`initEvents` 主要是解决父节点和子节点的通信（通过事件通信）, 

```ts
<child v-on=`customEvent`>something</child>

//child
const triggerEvent = () => {
  const payload = 'Hello from child component!';
  emit('customEvent', payload);
};
```

`initEvents` & `$attrs` 的源码都在 `createSetupContext`

```ts
let attrs: Data
if (__DEV__) {
  // We use getters in dev in case libs like test-utils overwrite instance
  // properties (overwrites should not be done in prod)
  return Object.freeze({
    get attrs() {
      return attrs || (attrs = createAttrsProxy(instance))
    },
    get slots() {
      return shallowReadonly(instance.slots)
    },
    get emit() {
      return (event: string, ...args: any[]) => instance.emit(event, ...args)
    },
    expose
  })
} else {
  return {
    get attrs() {
      return attrs || (attrs = createAttrsProxy(instance))
    },
    slots: instance.slots,
    emit: instance.emit,
    expose
  }
}
```

`inject, provide` 

**packages\runtime-core\src\apiInject.ts**

其实就是 父组件调用 `provide`, 为当前组件的 `provides` 属性添加 `key value`.

```ts
let provides = currentInstance.provides
// by default an instance inherits its parent's provides object
// but when it needs to provide values of its own, it creates its
// own provides object using parent provides object as prototype.
// this way in `inject` we can simply look up injections from direct
// parent and let the prototype chain do the work.
const parentProvides =
  currentInstance.parent && currentInstance.parent.provides
if (parentProvides === provides) {
  provides = currentInstance.provides = Object.create(parentProvides)
}
// TS doesn't allow symbol as index type
provides[key as string] = value
```

创建子组件的时候会调用

```ts
provides: parent ? parent.provides : Object.create(appContext.provides),
```

如果要 `inject`，就是沿着向上找。

### 7. 差别。

在我看来，可以理解为没有 `beforeCreate` 这个生命周期了, 可以理解为 `setup = created`. 该解析的都解析好了.

### 8. 总结

`beforeCreate` 可以访问 `options, event, render` 函数等等。

`created` 可以访问到 `data，method，inject，provide，attrs，listener` 等等

`setup` 等于上面的都能访问.
