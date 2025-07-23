---
title: Vuex 基本用法
date: 2025-07-23 19:59:03
tags: 
    - Vuex
    - Vue3
---

### 01. 什么是Vuex?

他就是一个Vue插件，用来管理状态。

那么第一个问题就来了，什么是状态

##### 01.01 什么是状态?

他不是一个单纯的**boolean**值

比如你是否登录，这个是一种状态。

比如用户信息，用户名，邮箱，他的权限，这些可能属于信息，但是一般也放进去了。

比如设置里面的东西，比如UI。比如一些功能的开关？

就是一个大家都会用的东西，这里的大家就是指组件，各个页面需要用的东西.

甚至一些常用的API我看有些项目也会缓存在里面。

##### 01.02 为什么要统一管理状态

ok，我状态肯定是要常用的对吧，我直接缓存起来，比如全部放在根组件上。

你哪个组件我一个一个传下去。

这个时候就发现问题了，很麻烦。

比如我通过 `props` 一个一个传下去, 他不是不行，他是真的累。



那我改一下。我直接挂在全局上？

```javascript
app.config.globalProperties.$myGlobalString = 'A global string'
```

我一样可以 `watch` 或者 `computed` 监控变化对吧。



有几个问题。

1. 任何人都可以修改全局变量，你用这个 `Vuex` 可以预测改变

2. 配合开发工具 `Vuex` 可以追溯变化

3. 封装后可以逻辑分离
   
   

当然，如果你自己项目小，其实 `Provide` 和 `Inject` 就可以了，简单做做管理



### 02. 基本概念

1. State(状态)

2. Getters(获取器)

3. Mutations(变更)

4. Actions(动作)

5. modules(模块)
   
   

逻辑很简单

`State`  就是数据

`Getters ` 就是获取

`Mutations` 去修改他的值(注意他是同步的，并且怎么修改也是固定的)

`actions` 业务流程的操作，可以进行异步操作，比如获取设置状态，然后调用 `Mutations` 进行修改



定义一个 counter

```javascript
// testvuevuex/src/store/modules/counter.js

const state = {
  count: 0
};

const getters = {
  doubleCount: state => state.count * 2
};

const actions = {
  incrementAsync({ commit }) {
    setTimeout(() => {
      commit('increment');
    }, 200);
  }
};

const mutations = {
  increment(state) {
    state.count++;
  },
  decrement(state) {
    state.count--;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}; 
```

然后组件调用

```javascript
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// 通过 computed 来访问 state 和 getters，确保响应性
const count = computed(() => store.state.counter.count);
const doubleCount = computed(() => store.getters['counter/doubleCount']);

// mutations 和 actions 可以直接 commit 或 dispatch
const increment = () => store.commit('counter/increment');
const decrement = () => store.commit('counter/decrement');
const incrementAsync = () => store.dispatch('counter/incrementAsync');
</script>

<template>
  <div id="app">
    <h1>Vuex Counter</h1>
    <p>
      Count: {{ count }}
    </p>
    <p>
      Double Count (Getter): {{ doubleCount }}
    </p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="incrementAsync">Increment Async</button>
  </div>
</template>

```

大概的过程就是这样。 有个 `counter` 就可以了

需要稍微注意的就是，`Modules`

`namespace: true` 这个是我在 `counter` 中加的.

然后就避免的重名问题，因为调用的时候都需要在前面 `counter/doubleCount` 这种



### 03. 为什么要这么设计？

其实应该是直接用了 **react redux** 的做法。



核心其实是，**数据流向单一**

****其实这个第一个词反过来就是不单一，什么叫不单一？

比如我用 全局变量，我用 `Provide`, 就会有一个问题，谁都可以改这个

他的入口是多是，任何一个地方都可以修改。



你根本不知道是谁改的。这个时候就只能一个一个的排查。

而且来源根本不固定，甚至有人拿来做双向绑定都可能



所以至少他必须用 `mutations` ，你加断点都好加一些。

当你数据来源统一的走了 `mutations `, 那么就可以管理了 



而且由于 mutations 的存在，可以控制类型，控制结果，控制数据，让状态处于可以预测。



测试也方面，同样受益。



总之他就是希望进行单向数据流，保证结果可靠性，数据可靠性，并且可以追踪。



### 04. Vuex 是怎么实现的?

这次本来就是为了看源码而来的。

插件注册的时候，有一个 

```javascript
  install (app, injectKey) {
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this

    const useDevtools = this._devtools !== undefined
      ? this._devtools
      : __DEV__ || __VUE_PROD_DEVTOOLS__

    if (useDevtools) {
      addDevtools(app, this)
    }
  }
```



然后在 useStore 的时候

```javascript
// src/injectKey.js
import { inject } from 'vue'

export const storeKey = 'store'

export function useStore (key = null) {
  return inject(key !== null ? key : storeKey)
}
```

对，其实这就是核心代码..



`app.use(store) -> store.install() -> app.provide('store', ...)`

`组件 setup() -> useStore() -> inject('store')`



其他源码简单看了一下。

就是有一个对象 `store`

然后遍历出 `options`,  options 就是参数, state，getter, mutations 之类的

然后注册，然后绑定，并且让 state computer 并且 响应式.
