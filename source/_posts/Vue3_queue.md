---
title: vue3 任务调度源码解析
date: 2023-07-08 01:30:01
tags: 
    - vue3
    - 前端
    - queue
    - 任务调度
    - 源码
---

### 01. queueJob

首先需要知道这个接口的定义，他就是任务调度的 **job** 定义

```ts
export interface SchedulerJob extends Function {
  id?: number //唯一ID
  pre?: boolean //是否是预处理
  active?: boolean //是否激活
  computed?: boolean //是否是计算任务
    /**
    * 表示是否允许该效果自行递归触发
    * 当由调度程序管理时。
    *
    * 默认情况下，作业无法自行触发，因为某些内置方法调用，
    * 例如 Array.prototype.push 实际上也执行读取（#1740）
    * 可能导致令人困惑的无限循环。
    * 允许的情况是组件更新函数和监视回调。
    * 组件更新函数可能会更新子组件 props，进而更新子组件 props
    * 触发刷新：“预”监视回调，该回调会改变父级的状态
    * 依赖于（#1801）。 监视回调不会跟踪其依赖项，因此如果
    * 再次触发自身，这可能是故意的，并且是用户的
    * 负责执行递归状态突变，最终
    * 稳定（#1727）。
    */
  allowRecurse?: boolean
  /**
    * 设置组件渲染效果时由renderer.ts附加
    * 用于在报告最大递归更新时获取组件信息。
    * 仅限开发人员。
    */
  ownerInstance?: ComponentInternalInstance
}
```

然后下面是入口, 传入一个 `job`, 并且 `push` 进入队列。

```ts
export function queueJob(job: SchedulerJob) {
  // 重复数据删除搜索使用 Array.includes() 的 startIndex 参数
  // 默认情况下，搜索索引包括当前正在运行的作业
  // 所以它不能再次递归地触发自身。
  // 如果作业是 watch() 回调，则搜索将从 +1 索引开始
  // 允许它递归地触发自身 - 用户有责任
  // 确保它不会陷入无限循环。
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
    )
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}
```

`const queue: SchedulerJob[] = []` 这是一个 `SchedulerJob` 数组.

`job.id = instance.uid` 也就是 `Vue` 实例的唯一ID

### 02. queueFlush

```ts
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

这里有两个变量

```ts
let isFlushing = false //是否有更新循环正在执行
let isFlushPending = false //是否有等待中的更新循环
```

这两个标志位主要是为了保证，一次性只执行一个更新循环，当没有循环.

设置 `isFlushPending = true`，然后设置微任务

到这里我们其实已经可以知道他的大概调度流程.

当触发更新，调用 `queueJob => 如果没有重复 => queue.push => queueFlush => 如果没有执行 => 加入微任务(flushJobs)`

这样一个流程说明了什么？

首先 `queueJob` 需要去重，`include`, 位置判断是基于是否允许递归调用。

也就是说，如果你

```ts
for(let i=0;i<1000;i++) {
    count.value++
}
```

根本不会增加队列中 `job`, 他始终保证了只有一个。

第二个点就是微任务, 我之前写了一个文章，[浏览器事件循环总结](/tblog/2023/07/03/eventLoop/)。

```ts
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>
resolvedPromise.then(flushJobs)
```

这里就是把 `flushJobs` 当做微任务来执行，也就是说，需要主线程的代码执行完毕以后，再执行。

```ts
isFlushPending = true
currentFlushPromise = resolvedPromise.then(flushJobs)
```
当这个代码执行，就是一次更新循环，js主线程执行完毕以后，开始执行队列，flushJobs，这个就是所谓的操作合并。

这里明白了这两个点，其实就已经大概明白了事件调度。

### 03. flushJobs

```ts
function flushJobs(seen?: CountMap) {
  isFlushPending = false
  isFlushing = true
  if (__DEV__) {
    seen = seen || new Map()
  }

   // 在刷新之前对队列进行排序。
   // 这确保了：
   // 1. 组件从父级更新到子级。 （因为父母总是
   // 在子进程之前创建，因此它的渲染效果会更小
   // 优先级编号）
   // 2. 如果在父组件更新期间卸载了组件，
   // 可以跳过它的更新。
  queue.sort(comparator)

   // checkRecursiveUpdate 的条件使用必须由以下确定
   // try ... catch 块，因为 Rollup 默认情况下会取消对 treeshaking 的优化
   // 在 try-catch 中。 这可以使所有警告代码保持不变。 虽然
   // 他们最终会被像 terser 这样的缩小器动摇，一些缩小器
   // 将无法做到这一点（例如 https://github.com/evanw/esbuild/issues/1610）
  const check = __DEV__
    ? (job: SchedulerJob) => checkRecursiveUpdates(seen!, job)
    : NOOP

  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        if (__DEV__ && check(job)) {
          continue
        }
        // console.log(`running:`, job.id)
        callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    flushPostFlushCbs(seen)

    isFlushing = false
    currentFlushPromise = null
    // 一些 postFlushCb 排队作业！
    // 继续冲洗直到排空。
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen)
    }
  }
}
```

其实这里在注释里面已经说的很明确了，在这里可以开始讲一讲关于 `isFlushing & isFlushPending`.

`isFlushPending = true` 表示，`flushJobs` 加入微任务以后 => 开始执行这一个区间, 其他为 false.
`isFlushing = true` 表示 `flushJobs` 正在执行的区间

还有一个需要注意的点 `queue.sort(comparator)`, 为什么需要排序，以及 `id` 的意义，在注释中都解释了

然后遍历队列，全部执行。

然后执行回调 `flushPostFlushCbs`

然后开始继续执行 `flushJobs(seen)`，因为在执行之前的 `queue` 的时候，可能也有需要插入队列。

### 04. flushPostFlushCbs

简单说就是执行回调函数

```ts
export function flushPostFlushCbs(seen?: CountMap) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)]
    pendingPostFlushCbs.length = 0

    // #1947 already has active queue, nested flushPostFlushCbs call
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped)
      return
    }

    activePostFlushCbs = deduped
    if (__DEV__) {
      seen = seen || new Map()
    }

    activePostFlushCbs.sort((a, b) => getId(a) - getId(b))

    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      if (
        __DEV__ &&
        checkRecursiveUpdates(seen!, activePostFlushCbs[postFlushIndex])
      ) {
        continue
      }
      activePostFlushCbs[postFlushIndex]()
    }
    activePostFlushCbs = null
    postFlushIndex = 0
  }
}
```

这些回调函数是在 `pendingPostFlushCbs` 当中, 他可能是 `queuePostRenderEffect` 加入的, `queuePostRenderEffect` 是各种生命周期函数加入的。

### 05. 总结。

这里解释了 Vue3.x 调度的大概流程，我之所以想看这个，是因为我在看 `nextTick` 源码, 不看这个无法完全理解 `nextTick`.