---
title: Vue2.extend
date: 2023-08-19 14:47:21
tags: 
    - 插件
    - vue3
    - vue2
---

### 01. 什么是 Vue.extend

> Vue.extend 返回的是一个扩展实例构造器，也就是预设了部分选项的Vue实例构造器

在实际的过程中，我尝试了使用 `Vue.extend`

```js
const MyComponent = Vue.extend({
    template: '<div>{{ message }}</div>',
    data() {
    return {
        message: 'Hello, Vue!'
    };
    }
});

const vm1 = new MyComponent();
vm1.$mount('#app1');

const vm2 = new MyComponent();
vm2.$mount('#app2');
```

也就是说，你给他一个 options 返回你一个组件，你可以任意使用，比如注册为组件

这里的好处是什么？你可以动态创建组件，比如使用插件

比如我想写一个全局 loading 函数，那么我需要先写一个组件，然后通过 $mount 绑定到节点。

其中一种办法就是使用 Vue.extend 创建组件，然后 $mount.

然后通过一个js去调用他，上面那个就是一个简单的绑定的例子。

### 02. Vue2 写一个loading

首先写一个loading

```js
<template>
    <div class="container" v-if="flag">
        <div class="centered-div">
            <p>{{ loadingMessage }}</p>
        </div>
    </div>
</template>

<script>
export default {
    name: "loading-components",
    data() {
        return {
            loadingMessage: '.',
            t: null,
            flag: false
        }
    },
    created() {
        const max = 10
        this.t = setInterval(() => {
            if (this.loadingMessage.length >= max)
                this.loadingMessage = '.';
            else {
                this.loadingMessage += '.';
            }
        }, 1000)
    },
    destroyed() {
        if (this.t !== null) {
            clearInterval(this.t);
            this.t = null;
        }
    }
}
</script>

<style scoped>
.container {
    position: relative;
    height: 100vh;
}

.centered-div {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}
</style>
```

然后重点来了。

使用  Vue.extend(loading), 然后 new & mount， 最后 append 到 body 上。

然后注册插件即可

```js
import Vue from 'vue'
import loading from './loading-components.vue'
const app = Vue.extend(loading)
const myLoading = new app().$mount(document.createElement('div'))
document.body.appendChild(myLoading.$el)
export default {
    install(vm) {
        vm.prototype.$loading = {
            show: () => {
                loading.flag = true
            },
            hide: () => {
                loading.flag = false
            }
        }
    }
}
```

然后在 mian.js 中 Vue.use(...)

就可以调用了。

### Vue.extend

**src\core\global-api\extend.ts**

```ts
  Vue.extend = function (extendOptions: any): typeof Component {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    const name =
      getComponentName(extendOptions) || getComponentName(Super.options)
    if (__DEV__ && name) {
      validateComponentName(name)
    }

    const Sub = function VueComponent(this: any, options: any) {
      this._init(options)
    } as unknown as typeof Component
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(Super.options, extendOptions)
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}
```

看完其实就是一个继承

根据你传入的组件，然后新建一个构造函数，然后把父组件的属性都继承给你。

最后你 new 返回的值， 他会调用 this._init

**src\core\instance\init.ts**

也就是说，开始了组件创建的流程

### 04. 总结

因为在写 Vue3 代码的时候，想要创建一个全局 loading，在 http 请求的时候调用。

突然想如果是 Vue2 会怎么写，于是就顺便看了下 Vue.extend 源码。