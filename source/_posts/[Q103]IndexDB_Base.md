---
title: IndexDB API
date: 2023-11-02 21:21:21
tags: 
    - javascript
    - indexDB
    - 浏览器存储
---

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

### 04. 文档

首先推荐看文档

https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API

这个比较复杂, 简单使用看阮一峰的也行

https://www.ruanyifeng.com/blog/2018/07/indexeddb.html

弄懂, 简单使用是没问题了.

### 05. Indexdb & IDBFactory

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

https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase

IDBDatabase 就是当你使用 open 数据库之后的返回值。

```js
onsuccess = function(event) {
    db = event.target.result
}
```

他可以做什么？

首先获取这个数据库的基本信息

1. name 数据库名称
2. version 数据库版本
3. objectStoreNames 表名称合集

其次，也就是最主要的

1. close()
2. createObjectStore()
3. deleteObjectStore()
4. transaction()
5. versionchange

这里主要说前三个，第四个后面继续看。

`close` 就是关闭数据库链接。在适当的时候关闭数据库，避免阻塞，内存过高等问题

`createObjectStore` 创建表

https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/createObjectStore

```js
createObjectStore(name)
createObjectStore(name, options)
```

创建一下试一试

```js
const db = event.target.result;
const objectStore = db.createObjectStore("user", {
	keyPath: "id",
	autoIncrement: true,
});

objectStore.add({ name: "tommy", age: "18", sex: 1 });
objectStore.add({ name: "tommy1", age: "19", sex: 0 });
objectStore.add({ name: "tommy2", age: "20", sex: 1 });

db.close();
```

需要注意的是，建议 `autoIncrement` 设置，不然你需要自己设置 `id`.

其次，`createObjectStore` 只能在 `upgradeneeded` 阶段使用，不然会报错的.

这样就创建了一个表，并且添加了3条数据。

`deleteObjectStore` 删除表

最开始有点懵，因为删除也不能直接在 `onsuccess`, 会报错，如果想要在 `upgradeneeded` 使用，难道我不更改版本就不能删除吗？

问了AI之后，给了一个方案

```js
// 打开数据库并获取数据库连接
var request = indexedDB.open("myDatabase", 1);

request.onsuccess = function(event) {
    var db = event.target.result;

    // 执行版本更改事务
    var versionChange = db.setVersion(2); // 使用setVersion来创建版本更改事务

    versionChange.onsuccess = function() {
        // 在版本更改事务中删除 Object Store
        if (db.objectStoreNames.contains("myObjectStore")) {
            db.deleteObjectStore("myObjectStore");
            console.log("Object Store 'myObjectStore' deleted.");
        } else {
            console.log("Object Store 'myObjectStore' not found.");
        }

        versionChange = versionChange.transaction;
        versionChange.oncomplete = function() {
            console.log("Object Store deleted successfully.");
        };

        versionChange.onerror = function() {
            console.error("Error deleting Object Store: " + versionChange.error);
        };
    };
};
```

但是我在 MDN 中搜索的时候，没有发现这个方法，于是 google 了一下这不是标准方法。

https://stackoverflow.com/questions/9521689/getting-a-setversion-is-not-a-function-error-when-using-indexeddb

MDN 官方例子当中确实也是版本变更的时候才删除 https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/deleteObjectStore



`versionchange`

> The event is fired when a database structure change (upgradeneeded event send on an IDBOpenDBRequest or IDBFactory.deleteDatabase) was requested elsewhere (most probably in another window/tab on the same computer). versionchange

也就是说如果其他页面触发升级, 那么这个页面也会收到通知.

### 06. IDBDatabase: transaction() method

事务，他可以做什么？

https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction

```js
transaction(storeNames)
transaction(storeNames, mode)
transaction(storeNames, mode, options)
```

`mode`

1. `readonly`
2. `readwrite`
3. `versionchange`

模式3种，1,2 是打开事务以后， 读写还是只读，这里需要说一下，理论上 `readwrite` 可以全覆盖 `readonly`. 但是别一直使用 `readwrite`

> 一次只能打开一个读写事务，它会锁定数据库，防止其他事务同时访问。
> 当有读写事务处于活动状态时，只读事务将被阻塞，直到读写事务完成。

不管是性能上，还是阻塞上，如果只需要读取，都应该选取 `readonly`.

`versionchange` 是我看文档不明白的一个点，为什么需要这个模式？ 而且写测试代码没用

> 这种类型的事务允许读取、修改和删除数据。也能够创建和删除Stores（数据表）和索引。这种类型的事务会在一个upgradeneeded事件被触发的时候自动创建，不能够手动创建。

versionchange 可以执行数据库结构的升级、创建新的对象仓库、添加索引、执行数据迁移等操作

ok，上代码测试一下。



首先是 `readonly`

```javascript
const db = event.target.result;
const transaction = db.transaction("user", "readonly");
const objectStore = transaction.objectStore(`user`);
const results = objectStore.getAll();
results.onsuccess = function (event) {
    const r = event.target.result;
    if (r && r.length > 0) {
      r.forEach((item) => console.log(item.name));
    }
};
```

这是正常的, 在只读情况尝试了一下 `add`, 直接报错

> Uncaught DOMException: Failed to execute 'add' on 'IDBObjectStore': The transaction is read-only.



另外一个模式, `readwrite`

```javascript
const db = event.target.result;
const transaction = db.transaction("user", "readwrite");
const objectStore = transaction.objectStore(`user`);

const data = { name: "tommy3", age: "18", sex: 1 };
objectStore.add(data);
db.close();
```



同样的代码, 如果用在读写上. ok.

[IDBObjectStore - Web APIs | MDN (mozilla.org)](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore)

这里包含了其他还能做的操作, 你使用事务, 最终还是要落在这上面.



需要注意的是 `readwrite` 其实也是可以读的, 但是建议分开, 原因刚才说清楚了.



`versionchange` 

> Allows any operation to be performed, including ones that delete and create object stores and indexes. Transactions of this mode cannot run concurrently with other transactions. Transactions in this mode are known as "upgrade transactions."
>
> 允许执行任何操作，包括删除和创建对象存储和索引的操作。此模式的事务不能与其他事务并发运行。此模式的事务称为“升级事务”。
>
> There is also another type of transactions: . It can do anything, but you can’t generate it manually.versionchange A transaction can be automatically created by IndexedDB while opening the database for the handler. After creating the transaction, it is necessary to add an item to the store as follows:
>
> 还有另一种类型的交易：。它可以做任何事情，但你不能手动生成它。versionchange
>
> 在为处理程序打开数据库时，IndexedDB可以自动创建事务。创建事务后，需要向存储中添加一个项目，如下所示：



也就是说在触发数据库升级的时候, 自动触发这个事务.

我最开始有一个误解， 就是不同版本的数据库, 意味着本地有多个数据库, 你可以访问 **version: 1**, 也可以访问 **version:2**

所以之前找了很久关于数据库迁移的问题, 后来明白了其实只能访问最新版本, 也不存在迁移数据这种做法(除非你是迁移 ObjectStore).

下面是我写的一个列子

```javascript
onupgradeneeded: function (event) {
  const db = event.target.result;
  const transaction = event.currentTarget.transaction;
  const roleObjectStore = db.createObjectStore("role", { keyPath: "id", autoIncrement: true, });
  roleObjectStore.add({ "name": "admin", createTime: "2023-11-11" });
  roleObjectStore.add({ "name": "teacher", createTime: "2023-11-11" });
  roleObjectStore.add({ "name": "student", createTime: "2023-11-11" });

  const myStore = transaction.objectStore("user");
  myStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const updateData = cursor.value;
      updateData.phone = `0000000` + updateData.id;
      cursor.update(updateData).onsuccess = () => {
        console.log(`${updateData.name}更新了数据`);
      }
      cursor.continue();
    } else {
      console.log("Entries all displayed.");
    }
  }
}
```

当执行了这个代码以后, 老版本的数据库就无法访问了.

### 07. IDBTransaction

也就是 `trans1`

```js
const trans1 = db.transaction("foo", "readwrite");
```

有5个属性

1. `db IDBDatabase` 对象的引用
2. `durability` 定义了事务的持久化行为，即事务对数据库状态的持久性影响（但是是只读的，其实我不知道有什么用）
3. `error` 如果事务在执行过程中遇到错误，`error` 属性会返回一个表示该错误的 `DOMError` 对象。
4. `mode` 你创建事务的是 `mode`
5. `objectStoreNames` 包含此事务中所有对象仓库名称的数组。

3个方法

1. abort() 就是直接中断事务， 然后回滚，然后会触发 `abort` 事件
2. commit() 提交事务
3. objectStore() 返回 `IDBObjectStore` 对象

commit 是我比较疑惑的一个点，因为之前我从来没有使用 commit 但是依然可以正常提交

```js
const db = event.target.result;
const transaction = db.transaction("user", "readwrite");
const objectStore = transaction.objectStore(`user`);

const data = { name: "tommy3", age: "18", sex: 1 };
objectStore.add(data);
db.close();
```

我可以不停的添加，但是我并没有写 `transaction.commit()`， 

> Note that commit() doesn't normally have to be called — a transaction will automatically commit when all outstanding requests have been satisfied and no new requests have been made. commit() can be used to start the commit process without waiting for events from outstanding requests to be dispatched.

没必要显式调用。

**三个事件**

1. `abort` 事务报错和取消的时候触发
2. `complete` 事务完成之后触发
3. `error`

### 08. IDBObjectStore

操作数据的核心接口, 包含一堆属性和方法

https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore

这个没什么好说的, 其实你挨个试一试就知道怎么用了. 

唯一值得一说的是游标. 确实在大量数据遍历的时候, 还是建议使用一下.

```js
openCursor()
openCursor(query)
openCursor(query, direction)
```

这里是具体游标的返回, 可以直接编辑或者删除, 详情看下面的链接

https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor

### 09. 总结

其实到这里, 基本使用就应该没有问题. 该知道的方法就都该知道了.

剩下就是灵活应用的问题了.

自己写一个应用吧