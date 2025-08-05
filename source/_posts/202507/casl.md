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



通过这样会直接返回前端一个**JSON**对象，前端引入
