---
title: Vue errorCaptured vs onErrorCaptured
date: 2023-07-02 19:02:21
tags: 
    - 生命周期
    - typescript
    - vue3
    - vue2
    - errorCaptured
    - onErrorCaptured
---

beforeCreate -> setup()
created -> setup()
beforeMount -> onBeforeMount
mounted -> onMounted
beforeUpdate -> onBeforeUpdate
updated -> onUpdated
beforeDestroy -> onBeforeUnmount
destroyed -> onUnmounted
activated -> onActivated
deactivated -> onDeactivated
**errorCaptured -> onErrorCaptured**

### 1. onErrorCaptured