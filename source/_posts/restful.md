---
title: restful
date: 2023-06-15 13:40:51
tags: 
    - web
    - 后端
description: restful = Representational State Transfer = 表现层状态转化.
---

# restful

restful 在我之前基础的理解之下其实就是对资源的增删查改。

例如

```
/list/1
/user/abcdefg
```

get 对应获取
post 对应创建和更新
put 更新
delete 删除

http 的四种类型对应四种动作。

理解基本上是正确的。


### 01. 语义解释

restful = Representational State Transfer = 表现层状态转化.

这里少了一个主语资源，这个理论都是为了资源服务，可以把网上的一切理解为资源，图片，文本，文件，视频，api接口，获取的列表等等

然而通过 uri 来解释这个资源。

```
get /user/abcdefg
```

获取名字叫abcdefg的用户信息

### 02. 状态转换

表现层状态转化的意思是 http 是无状态的，如果需要状态，就需要借助 `get`,`post`,`delete`,`put` 来操作服务器，这个就叫做状态转化。

### 03. 总结

1. 每个 uri 都代表一种资源
2. 可以通过 http 的不同 type，来表达动作，也就是对服务器资源进行操作

### 04. 误区

1. 不能新增的动作
2. 不要加无用信息，要精准描述资源和操作

比如

```
/2.0/user/1
/tommy/msg/liya
```

版本号应该放在 http 请求里面
**msg** 属于新的动作，应该是

```
post /msg
```

在 data 中表明数据。

这里是参考阮一峰的文章

[理解RESTful架构](https://www.ruanyifeng.com/blog/2011/09/restful.html)

其他文章里，对于是否加入 api 版本号之类的方式是ok的，并且强调使用状态码。

