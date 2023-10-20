

### 01. 什么是IndexDB?

https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API

> IndexedDB 是一个事务型数据库系统，类似于基于 SQL 的 RDBMS。然而，不像 RDBMS 使用固定列表，IndexedDB 是一个基于 JavaScript 的面向对象数据库。IndexedDB 允许你存储和检索用键索引的对象；可以存储结构化克隆算法支持的任何对象。你只需要指定数据库模式，打开与数据库的连接，然后检索和更新一系列事务。

其实没得选, 如果要在浏览器存储大量东西,你只能选 IndexDB.

他可以异步, 支持事务, 有索引, 可以跨域. 而且是 NoSql.

还有就是他数据是结构化的, 说人话就是, 他理论上没有限制, 你可以存任何东西.

### 02. 浏览器支持问题

https://caniuse.com/?search=indexdb

理论上只要你不兼容 IE, 问题都不大, 如果要兼容IE, 需要考虑 IndexDB不同版本的写法兼容性问题

### 03. 大小

不同浏览器大小不同, 但是也不好测试.

因为你需要看每个浏览器自己的公告, 并且你也不知道随着更新是否会有调整, 每个版本都可能不太一样.

查了半天也没有谁去做了一个统计.

也可以通过下面代码进行检测.

```ts
navigator.storage.estimate().then(function (estimate) {
    const usedSpaceInMB = estimate.usage / 1024;
    const totalSpaceInMB = estimate.quota / 1024;
});
```

只是这个代码也有问题

https://developer.mozilla.org/zh-CN/docs/Web/API/StorageManager/estimate

> 安全上下文: 此项功能仅在一些支持的浏览器的安全上下文（HTTPS）中可用。

测试的时候需要注意

### 04. 基本流程和概念

首先推荐看文档

https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API

这个比较复杂, 简单使用看阮一峰的也行

https://www.ruanyifeng.com/blog/2018/07/indexeddb.html

弄懂, 简单使用是没问题了.

https://developer.mozilla.org/zh-CN/docs/Web/API/IDBFactory

IDBFactory 对象表示 IndexedDB 工厂。 它提供打开和关闭数据库的方法。

也就是 

```js
window.indexedDB.open(name, version)
window.indexedDB.deleteDatabase(name)
```

需要注意的是, 如果 `open` 的时候, 数据库不存在, 会自动创建.

`open` 和 `deleteDatabase` 都会返回 `IDBOpenDBRequest`

https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest

`IDBOpenDBRequest` 需要注意下面4个事件.

1. `blocked` https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest
2. `upgradeneeded` https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/upgradeneeded_event
3. `error` https://developer.mozilla.org/en-US/docs/Web/API/IDBRequest/error_event
4. `success` https://developer.mozilla.org/en-US/docs/Web/API/IDBRequest/success_event

`blocked`

> 当一个网页或应用程序尝试打开一个已经被其他网页或应用程序打开并正在执行写入事务的数据库时，会触发 blocked 事件。

所以这个事件的应用场景就需要考虑了, 我目前要写的场景是不需要这个事件的.

如果有这个多网页使用 indexDB 的情况, 就需要考虑了.

```js
addEventListener("blocked", (event) => {});
```

`upgradeneeded`

> The upgradeneeded event is fired when an attempt was made to open a database with a version number higher than its current version. 

字面意思, 在尝试用一个更高版本版本号打开数据库的时候, 就会触发这个事件.

其实还有一个情况, 就是首次打开的时候.




### 05. IDBFactory





