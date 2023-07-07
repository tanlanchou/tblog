---
title: Vue3 nextTick
date: 2023-07-08 01:36:01
tags: 
    - Vue3
    - nextTick
    - 源码解析
    - 任务调度
---

### 01. 什么是 nextTick

首先要知道什么是 nextTick

> 等待下一次 DOM 更新刷新的工具方法。

```ts
function nextTick(callback?: () => void): Promise<void>
```

这里说了语法和定义，下面这个例子会会说明，为什么需要 nextTick

```ts
<script setup>
import { ref, nextTick } from 'vue'

const count = ref(0)

async function increment() {
    count.value++

    // DOM 还未更新
    console.log(document.getElementById('counter').textContent) // 0

    await nextTick()
    // DOM 此时已经更新
    console.log(document.getElementById('counter').textContent) // 1
}
</script>

<template>
    <h1>nextTick 例子1</h1>

    <button id="counter" @click="increment">{{ count }}</button>
</template>
```

这里展示一下结果

```
0 index.vue:14 
1 index.vue:10 
1 index.vue:14 
2 index.vue:14 
```

就是说，当 `count.value++` 变量发生变化，他不会立刻更新，而是触发调度。

为什么要这么做？

如果我写一个循环

```ts
for(let i=0;i<1000;i++) {
    count.value = i;
}
```

那么，**vue** 是不是需要更新 **1000** 次？很明显不是。也就是说中间有一个调度

那么 `nextTick` 就是等待更新完成以后，会调用的回调，他可以使用 `await`, 也可以使用回调。

### 02. 调度过程

我在看 nextTick 之前，专门学习了一下任务调度的源码，地址在这里 [任务调度源码解析](/tblog/2023/07/08/Vue3_queue/)。

这里可以解释

```ts
for(let i=0;i<1000;i++) {
    count.value = i;
}
```

为什么不会一直更新。

### 03. nextTick 源码

```ts
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>

export function nextTick<T = void>(
  this: T,
  fn?: (this: T) => void
): Promise<void> {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}
```

`currentFlushPromise`

```ts
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

在 flushJobs 执行完成所有当前 Job 以后的 finally 中

```ts
currentFlushPromise = null
```

所以这个这个原理就很清楚了

当你修改了属性，然后后面设置了 nextTick. 就会在执行 flushJobs(也就是一个更新的循环) 以后，执行 nextTick。

如果你没有修改任何属性，那么 nextTick 就是一个单纯的异步，一个微任务。

### 04. 总结

这个够清晰了，不用总结了...