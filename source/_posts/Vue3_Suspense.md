---
title: vue3 Suspense
date: 2023-06-29 13:22:01
tags: 
    - vue3
    - 前端
    - Suspense
    - 源码
description: Vue3 Suspense 作用，以及源码解析
---

官方文档 [Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)，其他的简单文档 [Vue3 的新功能 — Suspense](https://medium.com/i-am-mike/vue-3-vue3-%E7%9A%84%E6%96%B0%E5%8A%9F%E8%83%BD-suspense-428e02254030)

> <Suspense> 是一个内置组件，用来在组件树中协调对异步依赖的处理。它让我们可以在组件树上层等待下层的多个嵌套异步依赖项解析完成，并可以在等待时渲染一个加载状态。

在看源码的时候，经常看到需要单独处理他，所以专门看一看。

### 1. 基本用法

