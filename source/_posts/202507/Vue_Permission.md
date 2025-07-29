---
title: Vue 权限方案
date: 2025-07-30 22:47:01
tags: 
    - Vue2
    - Vue3
    - 权限
---


# Vue 权限方案

### 🍰 01. 权限控制的层级

1. **路由权限（页面级）**：限制用户是否能访问某个页面。

2. **组件权限（区块级）**：控制是否能渲染某些组件（比如表格某一列）。

3. **元素权限（按钮级）**：控制是否显示某个按钮、链接、操作项等。

4. **接口权限（数据级）**：限制用户是否能请求或操作某类接口。
   
   

### 🤖 02. 路由权限

路由权限最简单的方案其实是 利用路由的 `beforeach`



```javascript
router.beforeEach((to, from, next) => {
  const userPermissions = getUserPermissions();
  if (to.meta.permission && !userPermissions.includes(to.meta.permission)) {
    next('/403'); 
  } else {
    next();
  }
});
```



这个不管是谁都有，哪家的框架都有。

你可以在这里加个白名单或者正则匹配，或者干脆用一个 `Object` 对象对应

这种有一个问题就是提权问题

用户可能利用 **F12** 或者其他方法更改权限就可以进入那个页面。



所以还有另一种方式

不是一开始注册所有路由，而是登录后直接获取菜单之类的。

然后动态的添加到 `router.addRoute()` 中。

就不存在这个级别的提权了。

这个也有缺点，因为首次需要等待`API`请求，可能有白屏，需要优化，比容龙骨架之类的



另一种比较邪典的方式 `onBeforeRouteEnter`

这种方式就是每个页面去控制，这种可以只能说你可能针对页面级别去对其颗粒度



还有一种是通过 `meta: { permission: 'admin:view' }` 去传

然后组件做精细控制.



这几种方案呢。

大概率还是选第一种或者第二种，路由级就应该控制整个页面的访问。

他是否有这个权限去访问这个页面，是整个页面的控制，如果页面中组件有细分，应该交给页面再去处理。





### 🧺 03. 组件级

这种级别主要的场景就是，某些东西是VIP才看，某些管理层才能看对吧？

首先就是 `v-if`

你可以功过 `hooks` 或者 `mixin`，甚至全局变量之类的方式引入一个权限方法.

然后

```javascript
<ChartPanel v-if="hasPermission('report:view')" />
```

这样就可以做到组件级别的判断。



指令！

```javascript
app.directive('permission', {
  mounted(el, binding) {
    const code = binding.value;
    if (!userPermissions.includes(code)) {
      el.parentNode?.removeChild(el);
    }
  },
});
```

指令的缺点在于他只能对 `dom` 生效。

指令本质是DOM操作，违反Vue的组件化理念。

并且指令你只能在模板使用，如果你想在 `setup`  中使用，就得另写一个.

对组件的兼容性是很差的，可能还需要套壳。

还有就是他不能控制逻辑. 这是最关键的

我印象中TS支持也差。

强烈不推荐.



异步组件！

```javascript
const ChartPanel = defineAsyncComponent(() =>
  hasPermission('report:view')
    ? import('@/components/ChartPanel.vue')
    : Promise.resolve(EmptyComponent)
);
```

这种本质上是和第一种是一样的，就是函数式的变种。

这种的优势是因为他是异步，树摇，打包的会直接打包成另一个`js`。 

他的优势和权限无关。



最后就是 `PermissionWrapper`

```javascript
<PermissionWrapper permission="admin:dashboard">
  <AdminChart />
  <AdminToolbar />
</PermissionWrapper>
```



当然他的缺点就是控制肯定不可能很精细，但是如果你只想控制到组件级，他逻辑清晰，结构也清晰，改起来最方便。



### 🩹 04. 元素级

在元素级如果你只需要控制UI，指令还是可以用一用的。

更多的还是推荐 `v-if="hasPermission('xxx')"`

如果要统一风格，``<AuthButton>`、`<PermissionWrapper>`` 用这种也不是不行。

优缺点前面已经介绍过了





### 🧲 05. API

这个其实我之前都没怎么关注。

毕竟API权限是后端的事情，我只是负责传TOKEN。

这个我觉得前端不需要做，因为做了也没什么用.

关键还是要后端根据 Token 要再次做权限判断



最简单的就是用 session，通过token匹配用户名，然后查 session. 判断权限

前端做了也没什么意义. 因为到这个层级，用户肯定是通过`F12`或者抓包去看的.

单纯的阻止他去看一个链接也没什么意义。


