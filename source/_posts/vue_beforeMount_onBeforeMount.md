---
title: Vue beforeMount vs onBeforeMount
date: 2023-06-24 14:47:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
---

# Vue beforeMount vs onBeforeMount

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


### 1. beforeMount

```ts
callHook(vm, 'created')

if (vm.$options.el) {
    vm.$mount(vm.$options.el)
}

Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

export function mountComponent(
  vm: Component,
  el: Element | null | undefined,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    // @ts-expect-error invalid type
    vm.$options.render = createEmptyVNode
  }
  callHook(vm, 'beforeMount')
  //todo...
}
```

只是家查了 `el` 是否在， 检查了 `vm` 中 $`options` 中是否有 `render`, 如果没有绑定一个空节点到 `options` 当中.

首先你需要知道 render 是做什么的？

> 在Vue.js中，你可以使用两种方式来定义组件的视图：
> 
> 模板方式：使用Vue的模板语法，将HTML代码与Vue实例的数据进行绑定。你可以在模板中使用指令、表达式和其他特性来实现数据的渲染和交互。
> 
> render函数方式：使用JavaScript编写render函数，该函数返回一个虚拟节点（VNode），描述了组件的DOM结构。render函数提供了更灵活和动态的方式来生成组件的视图，你可以在函数中使用JavaScript的语法和逻辑来处理数据渲染。

也就是有个方法自己来写模版类似于这种

```ts
const Counter = Vue.extend({
  data() {
    return {
      count: 0
    };
  },
  render(h) {
    return h('div', [
      h('span', 'Count: ' + this.count),
      h('button', {
        on: {
          click: () => {
            this.count++;
          }
        }
      }, 'Increment')
    ]);
  }
});
```

也就是说自己去写虚拟dom节点，只是我没有在实际应用中有用到这个。

可能是比较复杂的情况，比如性能优化，特别复杂的情况，或者自定义组件吧。

### 2. onBeforeMount

之前大概看了 **Vue3** 的生命周期, 地址在这里 [Vue lifecycle 实现](/tblog/2023/06/20/vue_lifecycle/)

```ts
const setupRenderEffect: SetupRenderEffectFn = (
  instance,
  initialVNode,
  container,
  anchor,
  parentSuspense,
  isSVG,
  optimized
) => {
  const componentUpdateFn = () => {
    if (!instance.isMounted) {
      let vnodeHook: VNodeHook | null | undefined
      const { el, props } = initialVNode
      const { bm, m, parent } = instance
      const isAsyncWrapperVNode = isAsyncWrapper(initialVNode)

      toggleRecurse(instance, false)
      // beforeMount hook
      if (bm) {
        invokeArrayFns(bm)
      }
```

`invokeArrayFns` 就是遍历然后传入参数, 这里的 `bm` 其实就是 `beforeMount` 的枚举值。

在执行完成 `setup` 函数以后，并且处理完成 `SUSPENSE` 之后，调用 `setupRenderEffect，就开始执行` `beforeMount`

### 3. 总结

Vue 2.x 在 合并 `options`， 解析完 `render, evnet, data, methods` 之类的，并且判断完成 `el` (就是)

```
beforeCreate => Created => beforeMount
```

Vue3.x 在也是先合并 `options`, 执行完成 `setup` 函数，处理完成 `SUSPENSE，` 之后调用 `beforeMount`

```
setup => beforeMount
```