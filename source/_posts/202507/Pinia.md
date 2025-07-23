---

title: Pinia 基本和源码简单分析
date: 2025-07-24 17:47:01
tags: 
    - Pinia
    - Vue3

---

# Pinia 基本

### 01. 情况

在看 `Pinia` 之前专门看了下 `Vuex` ，相当于说为了这个醋包了饺子。

主要是想知道差别在什么地方

为什么要管理状态？为什么要使用他？其实之前已经看过了，需要的话就去看 `Vuex` 那一篇



### 02. 基本使用



```javascript
// stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    },
    incrementBy(n: number) {
      this.count += n
    }
  }
})

```



**App.vue**

```javascript

<template>
  <div>
    <h1>Pinia Counter</h1>
    <p>Count: {{ counter.count }}</p>
    <p>Double: {{ counter.double }}</p>
    <button @click="counter.increment">+1</button>
    <button @click="counter.incrementBy(5)">+5</button>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from './stores/counter'


const counter = useCounterStore()
</script>


```



实话实说简单了很多，很多东西确实原本就不需要去关注



### 03. 概念上 Pinia 和 Vuex 的差别



他在使用上主要有2个差别。



##### 03.01 Mutations

首先是没有了 `Mutations` 也是最重要的。

我第一反应是改变了设计思路。



因为对于 `Vuex` 来说， `Mutations => State` 的作用其实是保证数据可控。

设计为同步，你再严格限制数据，做校验，那么就能在一定程度上保证 `State` 数据可控。

Actions 相对来说只是为了易用性打的补丁。

但是如果直接用Actions，就相当于为了易用性，减少了对数据的控制.



从设计思路上来说是这样

也有人认为 `Actions => Mutations` 本身就是脱了裤子放屁，反而多一个概念，脱了裤子放屁。

形式大于实际



取消掉了 `Mutations` , 依然需要调用 `Actions` ，依然不能随意修改

因为数据是响应式的，还是可以追踪

依然是需要 `UseXXXStore` 不随意修改



只是允许了异步的 `Actions` 的差别，对于整体的目的没有直接破坏



##### 03.02 modules

这个是改成了你直接调用你写的，而不是统一调用然后 "xxx/xxx"

没什么好说的。



### 04. 简单的源码解析



主要讲2个点。



##### 04.01 传递方式

他和 `Vuex` 一样，都使用注入搞定的，但是细节还是有变化的

```typescript
    // ...
    function useStore(pinia?: Pinia | null, hot?: StoreGeneric): StoreGeneric {
        const hasContext = hasInjectionContext()
        pinia =
          // ...
          (hasContext ? inject(piniaSymbol, null) : null) // <-- 关键在这里！

        if (pinia) setActivePinia(pinia)
        // ...

    }
    // ...
```

看得懂吧。



##### 04.02 `createOptionsStore`

这个是核心代码，创建 state, getter, action 都在这个方法里面。



```typescript
function createOptionsStore<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A extends _ActionsTree,
>(
  id: Id,
  options: DefineStoreOptions<Id, S, G, A>,
  pinia: Pinia,
  hot?: boolean
): Store<Id, S, G, A> {
  const { state, actions, getters } = options

  const initialState: StateTree | undefined = pinia.state.value[id]

  let store: Store<Id, S, G, A>

  function setup() {
    if (!initialState && (!__DEV__ || !hot)) {
      /* istanbul ignore if */
      pinia.state.value[id] = state ? state() : {}
    }

    // avoid creating a state in pinia.state.value
    const localState =
      __DEV__ && hot
        ? // use ref() to unwrap refs inside state TODO: check if this is still necessary
          toRefs(ref(state ? state() : {}).value)
        : toRefs(pinia.state.value[id])

    return assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce(
        (computedGetters, name) => {
          if (__DEV__ && name in localState) {
            console.warn(
              `[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`
            )
          }

          computedGetters[name] = markRaw(
            computed(() => {
              setActivePinia(pinia)
              // it was created just before
              const store = pinia._s.get(id)!

              // allow cross using stores

              // @ts-expect-error
              // return getters![name].call(context, context)
              // TODO: avoid reading the getter while assigning with a global variable
              return getters![name].call(store, store)
            })
          )
          return computedGetters
        },
        {} as Record<string, ComputedRef>
      )
    )
  }

  store = createSetupStore(id, setup, options, pinia, hot, true)

  return store as any
}

```



首先看 `state`

```typescript

const initialState: StateTree | undefined = pinia.state.value[id]st

 pinia.state.value
    const localState =
      __DEV__ && hot
        ? // use ref() to unwrap refs inside state TODO: check if this is still necessary
          toRefs(ref(state ? state() : {}).value)
        : t  : t
```

就是获取 你传入的 `options` ， 然后响应式

```typescript
    return assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce(
```

然后传递给新生的 `newStore`



你就可以通过 `actions`  去访问，比如说 

```typescript
actions: {
  increment() {
    this.count++
  }
}
```



这个 `this` 是指向 `store` 的, 就能通过 `store => pinia.state.value`



`getter` 在刚才代码里面也说明了

```typescript
      Object.keys(getters || {}).reduce(
        (computedGetters, name) => {
          if (__DEV__ && name in localState) {
            console.warn(
              `[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`
            )
          }

          computedGetters[name] = markRaw(
            computed(() => {
              setActivePinia(pinia)
              // it was created just before
              const store = pinia._s.get(id)!

              // allow cross using stores

              // @ts-expect-error
              // return getters![name].call(context, context)
              // TODO: avoid reading the getter while assigning with a global variable
              return getters![name].call(store, store)
            })
          )
          return computedGetters
        },
        {} as Record<string, ComputedRef>
      )
```



只需要注意2个点

为什么要去用 `computed` 主要是为了缓存和依赖追踪

```typescript
return getters![name].call(store, store)
```

获取最新的值




