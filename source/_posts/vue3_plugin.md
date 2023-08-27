---
title: vue3 createVNode & render
date: 2023-08-27 23:30:01
tags: 
    - vue3
    - 插件
    - createVNode
    - render
---

之前用 Vue2.x 写了一个 loading，思路是

写一个 vue 文件 => 使用 Vue.extend 创建虚拟dom => 写一个 install 插件，插件中写方法调用 vue 文件中的开关 

然后就可以在 vue 或者其他文件中使用了。

Vue3 区别不大，只是 API 有变化

### 01. CreateVnode & render

Vue2.x extend 没有了，他的作用是继承，并且创建和宣传了组件。

在 Vue3.x 中使用 `CreateVnode` & `render` 来代替

`CreateVnode` 创建虚拟dom，`render` 渲染真实dom

```js
import { createVNode, render } from "vue";
import loading from "./Index.vue";

const o = createVNode(loading);
const mountNode = document.createElement("div");
render(o, mountNode);
document.body.appendChild(mountNode);

export default {
  install(app) {
    app.config.globalProperties.$loading = {
      show: () => {
        o.component.exposed.enableFlg.value = true;
      },
      hide: () => {
        o.component.exposed.enableFlg.value = false;
      },
    };
  },
};
```

这样就创建了。

### 02. exposed

之前 **Vue2.x** 是直接可以访问属性的，但是 **Vue3.x** 是不行的，需要设置 `defineExpose`

```js
<template>
    <div id="test11111" v-if="enableFlg">
        test
    </div>
</template>

<script setup>
import { ref, defineExpose } from "vue";
const enableFlg = ref(true)

defineExpose({
    enableFlg
})  
</script>
```

### 03. app.config.globalProperties

https://cn.vuejs.org/api/application.html#app-config-globalproperties

> 这是对 Vue 2 中 Vue.prototype 使用方式的一种替代，此写法在 Vue 3 已经不存在了。与任何全局的东西一样，应该谨慎使用。
> 
> 如果全局属性与组件自己的属性冲突，组件自己的属性将具有更高的优先级。

```js
<template>
  <div class="hello">
    <button @click="show">打开</button>
    <button @click="close">关闭</button>
  </div>
</template>

<script setup>
import { getCurrentInstance } from "vue";
const instance = getCurrentInstance();

const show = function () {
  instance.proxy.$loading.show()
}

const close = function () {
  instance.proxy.$loading.hide()
}
</script>
```