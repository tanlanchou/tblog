---
title: 防抖和节流
date: 2023-06-15 15:29:01
tags: 
    - web
    - javascript
    - 后端
description: GraphQL 既是一种用于 API 的查询语言也是一个满足你数据查询的运行时。 GraphQL 对你的 API 中的数据提供了一套易于理解的完整描述，使得客户端能够准确地获得它需要的数据，而且没有任何冗余，也让 API 更容易地随着时间推移而演进，还能用于构建强大的开发者工具。
---

# graphgl

### 1. 什么是 graphgl

> GraphQL 既是一种用于 API 的查询语言也是一个满足你数据查询的运行时。 GraphQL 对你的 API 中的数据提供了一套易于理解的完整描述，使得客户端能够准确地获得它需要的数据，而且没有任何冗余，也让 API 更容易地随着时间推移而演进，还能用于构建强大的开发者工具。

### 2. graphgl 和 restful 区别

有本质上区别，restful 更像是一种规则，一种约定。

graphgl 也不一定需要按照 restful 规则，也可以所有都使用 `post`.

所以 graphgl 查询语言，基于这种查询语言沟通数据两边，更像是虚拟dom，是一个中间层。

然而 restful 只是一种规则和约定。

### 3. 基本语法

sechema 描述 graphgl

在描述中定义突变，输入，查询，类型等等。

1. mutation 突变，定义创建和更新
2. query 定义查询的方法
3. input 定义输入的类型
4. type Message 定义一个类型叫做 Message

这些可以是字符串或者通过graphgl方法写。

字符串解析后和使用 graphgly一样

nodejs 版本的使用方式

```
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

var schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return 'world';
        },
      },
    },
  }),
});
```

定义了一个 query, name，返回 string `world`.

这只是一个基础的例子，没有提交，更新之类的方式。

### 4. http调用

```
@post
http://localhost:4000/graphql
{
    "query": "{hello}"
}

//response
{
    "data": {
        "hello": "Hello world!"
    }
}

@get
http://localhost:4000/graphql?query=hello
```
带参数的话

```
http://localhost:3000/info?query={getUser(id:1){name}}

@post
http://localhost:3000/info

{
	query: {
		getUser(id:1) {
			name
		}
	}
}
```


### 5. nodejs 完整示例

**schemaLogin.js**

```
const { buildSchema } = require("graphql");

let schema = buildSchema(
  `
        input LoginInfo {
            name: String,
            passwd: String,
            captcha: String
        }

        type User {
            id: ID,
            name: String,
            sex: String
        }

        type Query {
            getUser(id: ID): User
        }

        type Mutation {
            login(user: LoginInfo): Boolean
            register(user: LoginInfo): Int 
        }
    `
);

const fakeDatabase = {};

class User {
  constructor(id, name, passwd) {
    this.id = id;
    this.name = name;
  }
}

const root = {
  getUser: ({ id }) => {
    let user = fakeDatabase[id];
    if (!user) {
      throw new Error("404");
    }

    return new User(user.id, user.name);
  },
  login: ({ loginInfo }) => {
    if (!loginInfo.captcha) throw new Error("captcha error");
    if (!loginInfo.name || !loginInfo.passwd) throw new Error("params error");

    for (let o in fakeDatabase) {
      if (o.name === loginInfo.name && o.passwd === loginInfo.passwd)
        return true;
    }

    return false;
  },
  register: ({ loginInfo }) => {
    if (!loginInfo.captcha) throw new Error("captcha error");
    if (!loginInfo.name || !loginInfo.passwd) throw new Error("params error");

    for (let o in fakeDatabase) {
      if (o.name === loginInfo.name) {
        throw new Error("name repeat");
      }
    }

    //build id
    var id = require("crypto").randomBytes(10).toString("hex");
    fakeDatabase({
      id,
      name: loginInfo.name,
      passwd: loginInfo.passwd,
    });

    return 1;
  },
};

module.exports = {
  schema,
  root,
};
```

**router/index.js**

```
const { schema, root } = require("../common/graphql/login");

router.use(
  "/info",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
```
`graphiql` 调试时候开启，可以测试验证接口

### 6. 前端调用

首先可以直接使用 axios， 然后获取数据。

如果是前端框架 可以使用 阿波罗 + graqhgl-tag.

阿波罗发起和管理请求，graqhql-tag 解析文本

### 7. 为什么要使用 graqhgl

- 接口数量众多维护成本高接口
- 扩展成本高
- 接口响应的数据格式无法预知
- 减少无用数据的请求
- 按需获取强类型约束（API的数据格式让前端来定义，而不是后端定义）

可以方便进行测试，前端自己决定返回什么，统一的接口，跨平台，确实挺好的。

### 引用

https://www.freecodecamp.org/chinese/news/a-detailed-guide-to-graphql/
https://www.npmjs.com/package/graphql
https://graphql.org/graphql-js/running-an-express-graphql-server/
https://github.com/graphql/graphql-js
https://vue-apollo.netlify.app/zh-cn/guide/
https://github.com/apollographql/graphql-tag#readme
