---
title: Vue lifecycle 实现
date: 2023-06-20 14:47:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
---

# Vue lifecycle 实现

### 1. Vue2.x

在看 Vue2.x 源码的时候，总会看到下面类似代码

```ts
callHook(vm, 'beforeCreate', undefined, false /* setContext */)
callHook(vm, 'created')
```

看一下 callHook 源码

```ts
export function callHook(
  vm: Component,
  hook: string,
  args?: any[],
  setContext = true
) {
  // #7573 disable dep collection when invoking lifecycle hooks
  // 推入调用栈
  pushTarget()
  const prev = currentInstance
  setContext && setCurrentInstance(vm)
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, args || null, vm, info)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  //这里是设置当前上下文
  setContext && setCurrentInstance(prev)
  //设置调用栈
  popTarget()
}
```

传入 `hook` 名称，从当前 `vm` 获取到 `handlers`，然后遍历调用 `invokeWithErrorHandling`， 执行 `hook` 并且捕获错误

如果 ok，触发 `vm.$emit('hook:' + hook)`，那么剩下的问题就是在哪里解析的？

其实就是在合并 `options` 的时候 把 `vm.constructor.options` 合并到 `vm.$options` 当中，就可以调用了

### 2. Vue3.x

**packages\runtime-core\src\apiLifecycle.ts**

```ts
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)

export const createHook = <T extends Function = () => any>(lifecycle: LifecycleHooks) =>
  (hook: T, target: ComponentInternalInstance | null = currentInstance) =>
    // post-create lifecycle registrations are noops during SSR (except for serverPrefetch)
    (!isInSSRComponentSetup || lifecycle === LifecycleHooks.SERVER_PREFETCH) &&
    injectHook(lifecycle, (...args: unknown[]) => hook(...args), target)
```

分一下断就是 

```ts
(lifecycle: LifecycleHooks) => {
     return (hook: T, target: ComponentInternalInstance | null = currentInstance) => {
        if(!isInSSRComponentSetup || lifecycle === LifecycleHooks.SERVER_PREFETCH) {
            return injectHook(lifecycle, (...args: unknown[]) => hook(...args), target)
        }
     }
}
```

就是闭包，或者说是工厂函数，用来调用 hook。

```ts
// 导出函数 injectHook
export function injectHook(
  // 生命周期钩子的类型
  type: LifecycleHooks,
  // 要注入的钩子函数，类型为 Function 并且具有一个可选的 __weh 属性
  hook: Function & { __weh?: Function },
  // 要注入到的组件实例，类型为 ComponentInternalInstance 或者 null，默认为 currentInstance
  target: ComponentInternalInstance | null = currentInstance,
  // 是否将钩子函数添加到钩子数组的开头，默认为 false
  prepend: boolean = false
): Function | undefined {
  // 如果 target 存在，则继续执行注入逻辑，否则在开发环境下发出警告
  if (target) {
    // 获取对应生命周期类型的钩子数组 hooks，如果不存在则创建一个空数组并赋值给 target[type]
    const hooks = target[type] || (target[type] = [])
    
    // 对传入的钩子函数 hook 进行封装
    const wrappedHook =
      // 如果钩子函数已经被封装过（存在 __weh 属性），则直接使用封装后的函数
      hook.__weh ||
      // 否则创建一个新的函数作为封装后的钩子函数
      (hook.__weh = (...args: unknown[]) => {
        // 检查 target 是否已经被卸载，如果是则直接返回
        if (target.isUnmounted) {
          return
        }

        // 暂停依赖追踪
        pauseTracking()
        // 设置当前的组件实例为 target
        setCurrentInstance(target)
        // 使用 callWithAsyncErrorHandling 调用钩子函数，并传入相应的参数 args
        const res = callWithAsyncErrorHandling(hook, target, type, args)
        // 取消当前组件实例的设置
        unsetCurrentInstance()
        // 重置依赖追踪状态
        resetTracking()
        // 返回钩子函数的执行结果 res
        return res
      })

    // 根据 prepend 参数的值，将封装后的钩子函数添加到 hooks 数组的开头或末尾
    if (prepend) {
      hooks.unshift(wrappedHook)
    } else {
      hooks.push(wrappedHook)
    }

    // 返回封装后的钩子函数
    return wrappedHook
  } else if (__DEV__) {
    // 如果 target 不存在，且是开发环境，则发出警告
    const apiName = toHandlerKey(ErrorTypeStrings[type].replace(/ hook$/, ''))
    warn(
      // 输出警告信息
    )
  }
}
```

也就是说， `inject` 会给 `target` 注入一个函数，函数可以直接执行 `hook`

```ts
import { onBeforeMount, ref } from 'vue';

export default {
  setup() {
    // 创建一个响应式数据
    const count = ref(0);

    // 在组件挂载之前执行的逻辑
    onBeforeMount(() => {
      console.log('组件挂载之前');
      // 执行其他操作...
    });

    return {
      count
    };
  }
};
```

ok, 到这里明白了生命周期是如何注入的，那么 **Vue3** 生命周期如何调用呢？，以 `beforeMount` 为例子

这个时候找到了 `setupRenderEffect` 也就是渲染 `setup` 的函数

```ts
const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn, //调用 instance.emit('hook:beforeMount')
    () => queueJob(update),
    instance.scope // track it in component's effect scope
))

const update: SchedulerJob = (instance.update = () => effect.run())
update.id = instance.uid
update()
```

另外除了这样注册之外，还可以直接这样调用

```ts
invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount')
```

会直接触发，而不需要等待事件。

### 3. 总结

Vue2.x Vue3.x 生命周期的注入和调用，本质上没什么区别。

都是挂在在当前上下文，区别只是通知方式，一个直接调用，一个通过 `emit` 来触发