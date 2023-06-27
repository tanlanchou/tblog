---
title: Vue2.x watcher
date: 2023-06-27 11:53:21
tags: 
    - vue2
    - wather
    - 源码
---

# vue2.x watcher

### 01. 源码

```ts
export default class Watcher implements DepTarget {
  vm?: Component | null //组 //件实例
  expression: string //监视的表达式
  cb: Function //回调函数
  id: number //watch 唯一id
  deep: boolean //是否进行深度监视
  user: boolean //是否是自定义watch
  lazy: boolean //是否懒执行
  sync: boolean //watch 执行是同步还是异步
  dirty: boolean //在 lazy = true 的前提下，值是否要重新计算
  active: boolean //是否处于激活状态
  deps: Array<Dep> //依赖列表
  newDeps: Array<Dep> //临时依赖列表
  depIds: SimpleSet //依赖的ID集合
  newDepIds: SimpleSet //临时依赖列表ID
  before?: Function //更新之前的 hook 函数
  onStop?: Function //当前 watch 被停止调用以后的钩子函数
  noRecurse?: boolean //是否避免递归监视
  getter: Function //获取当前监视的表达式的值
  value: any //当前值
  post: boolean //是否是后置 watcher（即渲染 watcher）？

  // dev only
  onTrack?: ((event: DebuggerEvent) => void) | undefined
  onTrigger?: ((event: DebuggerEvent) => void) | undefined

  constructor(
    vm: Component | null,
    expOrFn: string | (() => any),
    cb: Function,
    options?: WatcherOptions | null,
    isRenderWatcher?: boolean //可选参数，表示这个 watcher 是否是渲染函数 watcher
  ) {

    //调用 recordEffectScope 函数记录 effect scope，其中 activeEffectScope 表示当前的激活的 effect scope。  
    recordEffectScope(
      this,
      // if the active effect scope is manually created (not a component scope),
      // prioritize it
      activeEffectScope && !activeEffectScope._vm
        ? activeEffectScope
        : vm
        ? vm._scope
        : undefined
    )

    //如果 vm 不为 null，且 isRenderWatcher 为 true，则将 watcher 存储在 vm 的 _watcher 属性中。
    if ((this.vm = vm) && isRenderWatcher) {
      vm._watcher = this
    }
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
      if (__DEV__) {
        this.onTrack = options.onTrack
        this.onTrigger = options.onTrigger
      }
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.post = false
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = __DEV__ ? expOrFn.toString() : ''
    // parse expression for getter
    if (isFunction(expOrFn)) {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        __DEV__ &&
          warn(
            `Failed watching path: "${expOrFn}" ` +
              'Watcher only accepts simple dot-delimited paths. ' +
              'For full control, use a function instead.',
            vm
          )
      }
    }
    this.value = this.lazy ? undefined : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get() {
    pushTarget(this) //进栈，表示正在计算watch的值
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm) //获取值
    } catch (e: any) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) { //如果要深入监视
        //traverse 函数是用来遍历一个对象或数组的所有子属性，以便在进行“深度观测”（deep watch）时能够将这些子属性全部注册为依赖关系。
        //traverse 函数接收一个 val 参数，代表需要遍历的对象或数组。函数中首先会对 val 进行一些判断，例如如果 val 不是数组或对象，或者是被冻结的对象，或者是一个 VNode，就直接返回，不需要继续遍历。
        //接下来会判断 val 是否是一个响应式对象，如果是，就会将它所关联的依赖的 id 加入到 seen 集合中。这里的 seen 集合是用来去重的，它的作用是保证在遍历一个对象时不会出现循环依赖的情况。 
        //最后，如果 val 是一个数组，就对数组中的每个元素递归调用 _traverse 函数进行遍历；如果是一个对象，就对对象中的每个属性递归调用 _traverse 函数进行遍历。如果 val 是一个 Ref 对象，则遍历它的 value 属性。
        //这个方法的主要作用是遍历一个对象或者数组的所有属性或元素，并且将遍历到的所有属性或元素都收集为响应式依赖，这样当其中任意一个属性或元素发生变化时，Vue 就能够知道这个变化，并且及时通知视图进行更新。
        traverse(value) 
      }
      popTarget() //出栈
      this.cleanupDeps() //清除所有Deps
    }
    return value 
  }

  /**
   * Add a dependency to this directive.
   */
  addDep(dep: Dep) {
    const id = dep.id
    //如果临时的ID集合没有包含这个ID
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id) //加入
      this.newDeps.push(dep) //加入临时依赖的集合
      if (!this.depIds.has(id)) { //如果依赖ID集合里面,没有
        dep.addSub(this) //在Dep中加入这个watch
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps() {

    //遍历deps，如果没有在 newDepIds ，删除当前这个 watch 实例。
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }

    //将 newDepIds 和 newDeps 赋值给 depIds 和 deps ，临时列表清空
    let tmp: any = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update() {
    /* istanbul ignore else */
    //判断lazy 如果是，dirty = true，表示发生了变化，但是还没有重新计算。
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      //如果 sync = true，同步执行，调用run
      this.run()
    } else {
      //如果是异步执行，加入队列。
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run() {

    //判断是否是 active
    if (this.active) {

      //调用 get 获取 value
      const value = this.get()
      if (
        //当 新旧 value 不一致
        //当 新值 是object
        //或者深度遍历 deep = true
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value

        //这里就是回调，用户自定义因为需要方便调试，所以用这种方法
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`
          invokeWithErrorHandling(
            this.cb,
            this.vm,
            [value, oldValue],
            this.vm,
            info
          )
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   * 评估 watcher 的值。
   * 只有懒惰的 watcher 才会调用这个方法。
   * 这个需要结合刚才的 upadte 来看，如果 this.lazy = true. 那么 dirty = true， 然后执行这个方法
   */
  evaluate() {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   * 把 deps 全部遍历， depends 全部执行到当前 Dep.target 中
   */
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown() {

    //_isBeingDestroyed，用于标识该实例是否正在被销毁。当这个标记为 true 时，Vue 会停止继续观察数据，并且在一些钩子函数中，可能需要判断这个标记来决定是否执行一些操作，比如避免在组件已经被销毁后还执行一些异步操作，从而避免可能的内存泄漏问题。
    if (this.vm && !this.vm._isBeingDestroyed) {
      remove(this.vm._scope.effects, this)
    }

    //是否是激活状态
    if (this.active) {
      let i = this.deps.length
      while (i--) {
        //清除所有引用
        this.deps[i].removeSub(this)
      }
      //设置不激活
      this.active = false

      //触发钩子
      if (this.onStop) {
        this.onStop()
      }
    }
  }
}
```

### 02. 总结

watch 做了什么？

> 用于监听一个数据对象的变化，并在变化时执行回调函数。
>
> 在初始化时，watcher 会收集依赖，也就是将当前的 watcher 对象赋值给当前访问的数据对象的 dep 实例，从而建立数据对象和 watcher 的关联关系。当数据对象的值发生变化时，dep 实例会通知所有的 watcher，watcher 会重新执行回调函数。
> 
> 在执行回调函数之前，watcher 还会进行一些优化处理，比如判断当前回调函数是否是异步执行的，如果是则将其加入到异步队列中，从而避免连续多次的更新操作，提高性能。同时，watcher 还支持一些高级特性，比如 computed、watchEffect 等。

`get` 方法主作用获取表达式的值，其中包含 Dep.target 进栈和出栈的操作，并且遍历获取的值的所有属性，将其响应式。

1. pushTarget
2. 获取表达式 value
3. traverse(value) 追种所有属性，响应式alue
4. popTarget() //出栈
5. this.cleanupDeps() //清理

`addDep` 如果临时ID的集合没有包含这个Dep，那么在临时ID集合以及临时集合中加入，继续判断，如果依赖ID集合(不是临时)没有包含这个ID，那么这个Dep.addSub(this)

`update` 更新，3种更新

1. 懒更新 => ditry = true
2. !!sync => run()
3. !sync => 进入队列

`evaluate` 获取 value 赋值，dirty = false。

`run` 如果是否是 `active`，获取值，并且调用 callbcak

`depend` 把 deps 全部遍历， depends 全部执行到当前 Dep.target 中

`teardown` 清除关于这个 dep 中所有的当前 watcher。


