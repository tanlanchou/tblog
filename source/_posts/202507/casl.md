---
title: casl 简介
date: 2025-08-08 15:54:18
tags: 
    - 权限
    - 前端
    - vue
    - casl
---

# Casl

之前一直在找Vue有没有权限的合集。

于是找到了这个，大概看了下。他似乎提供了一套权限方案。



### 01. 核心概念

```typescript
can(Action.Update, Article, { authorId: user.id });
```

这个是定义一个规则，规则的前提是你需要定义好实体

```typescript
export class Article {
    id: number;
    isPublished: boolean;
    authorId: number;
}

export class User {
    id: number;
    isAdmin: boolean;
}
```



然后开始定义规则前的准备

```typescript
// 定义应用中的主体
export type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

// 定义应用的能力类型
export type AppAbility = Ability<[Action, Subjects]>;

// 根据定义好的东西生成工具
const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(Ability as AbilityClass<AppAbility>);
```



这个时候就是刚开始的 `can`
    can(Action.Update, Article, { authorId: user.id });

更新 `Article` 这个对象需要做这 `ID` 和 `User.id`  一致, 这个就是规则。



另一个问题就来了，如何调用这个规则？

需要实例化

```typescript
createForUser(user: User) {
    const builder = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>);
    const { can } = builder;

    if (user.isAdmin) {
      can(Action.Manage, 'all'); // 管理员可以对所有内容进行任何操作
    } else {
      can(Action.Read, 'all'); // 非管理员只能读取所有内容
      can(Action.Update, Article, { authorId: user.id });
    }

    return builder.build({
      detectSubjectType: item => item.constructor as ExtractSubjectType<Subjects>
    });
  }
```

这是一个实例化的过程，他会返回一个 `AppAbility` 对象。那么这个对象可以开始检查权限



这个时候就可以开始搞了。

比如，我有一个 `router`

```typescript
@Get(":id")
testPost():string {
    const ability = createForUser(user) //通过token拿到
    const article = //通过ID获取文章对象
    ability.can("update", article)
}
```



大概的过程就是这样，很麻烦对吧。



**到前端**

```typescript
        const ability = this.caslAbilityFactory.createForUser(user);

        // 返回用户的权限规则
        return ability.rules;
```

通过这样会直接返回前端一个**JSON**对象，前端引入。

前端通过自己的规则，然后也能实现

```javascript
ability.can("update", article)
```

类似的操作.



### 02. 为什么要使用casl?

首先就是前后端统一。

前端用什么后端就用什么这个确实香。



另外他可以和其他数据库联动，直接查询可以省一些事情

```typescript
    import { accessibleBy } from '@casl/prisma';

    const where = accessibleBy(ability, 'read').Article;
    const rows = await prisma.article.findMany({ where, select: { id: true, title: true } });
```

我可以直接把权限直接放在查询里面.

虽然其实如果你自己来也不是很麻烦，毕竟我也没有那么复杂的逻辑..



casl 本质上是一种权限引擎。

比如现在后台权限系统，一个树形的权限 => 基于菜单来做管理，基于文字类似于 `User:view` 其实很类似

只是他给你做了一部分功能



并且他可以进行灵活的配置，甚至可以管理到具体资源的级别。

如果做一个大型的管理系统还是不错的.

小型的，你根据角色权限直接写死也是不错的。

比如我有一个权限表 permissions

id: 42
action: "update"
subject: "Article"
inverted: false
conditions: {"authorId":"${user.id}"}

这是后端的权限表，比如说如果直接写死应该是这样的

```typescript
cannot('delete', 'Article', { isPublished: true }); 
```

那么我们去实例化

```typescript
const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>);

//拿到权限
const dbPermissions: PermissionFromDB[] = await this.permissionsService.findAllForUser(user);

//我懒得写了 dbPermissions 遍历得到 => permission
if (permission.conditions) {
  // 将 JSON 字符串解析为对象
  const parsedConditions = JSON.parse(permission.conditions);
  // !! 关键步骤: 替换占位符 !!
  conditions = this.replacePlaceholders(parsedConditions, user);
}

// 4. 根据 inverted 字段决定调用 can 还是 cannot
if (permission.inverted) {
  // inverted: true -> cannot
  cannot(permission.action as Action, permission.subject, conditions);
} else {
  // inverted: false -> can
  can(permission.action as Action, permission.subject, conditions);
}
```

看规则就有了，剩下的就是需要做一些其他的铺垫，怎么传给前端，怎么生成。

因为他是写json的，有一套自己的规则，比如：`{"authorId":"${user.id}"}` 。

他就是其他的 "user:view" 之类的纯粹的是和否这种机制相比，就强大很多，可以给很多权限。



### 03. 核心优势，动态复杂权限

```javascript
{ "authorId": "${user.id}" }
```

这个是最简单的，仅自己可见对吧？



```javascript
{ "action": "update", "subject": "Article", "fields": ["title", "summary"], "conditions": { "authorId": "${user.id}" } }
```

我甚至可以通过字段进行全权限控制



```typescript
  { "$or": [ { "isPublic": true }, { "sharedWith": { "$in": ["${user.id}"] } } ] }
```

多条件



```javascript
{ "tags": { "$all": ["tech", "ai"] } }
```

数组匹配



```typescript
  { "inverted": true, "action": "delete", "subject": "Article", "conditions": { "isLocked": true } }
```

他还可以玩优先级覆盖





等等等等等，他可以动态管理复杂的资源。各种动态权限。

剩下的就要看文档了，目前还没有开始做项目。

有机会我已经要试试。


