---
title: Prisma 基本应用
date: 2025-07-25 09:45:01
tags: 
    - Prisma
    - Orm
    - Nestjs
---
## Prisma Nestjs

[Prisma 文档 - Prisma 中文](https://prisma.org.cn/docs)

这里主要是要记一个简单的 prisma 在 nestjs 上应用的教程.

主要是懒得记。

### 01. 初始化

    npx prisma init

这一步主要是实例化一个初始化的脚本。

**prisma\schema.prisma**

他会在这个直接生成一个这个文件

```javascript
generator client { provider = "prisma-client-js" } datasource db { provider = "mysql" url = env("DATABASE_URL") }
```

类似于这样，`provider` 根据数据库来.

### 02. 设置DATABASE_URL

可以直接在环境变量中设置，`env(”DATABASE_URL”)` , **docker** 打包的时候直接传入环境变量

但是对于我来说是一个问题，因为我是在公共环境中存储代码的，虽然仓库是私有的..

并且我还希望能够统一的通过 **consul** 来管理，所以写了一个 `module`

PrismaModule

```javascript
import { Module, Global, DynamicModule } from '@nestjs/common';
import { PrismaService } from './service';
import { ConfigService } from 'src/common/config/config.service';

export interface PrismaModuleOptions {
  configKey: string;
}

@Global()
@Module({})
export class PrismaModule {
  static register(options: PrismaModuleOptions): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: 'DATABASE_URL',
          useFactory: async (consulService: ConfigService) => {
            const config = await consulService.get(options.configKey);
            return config.dbUrl;
          },
          inject: [ConfigService],
        },
        PrismaService,
      ],
      exports: ['DATABASE_URL', PrismaService],
    };
  }
}
```

**PrismaService**

```javascript
import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('DATABASE_URL') private readonly databaseUrl: string) {
    super({ datasources: { db: { url: databaseUrl } } });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

理论上你是不需要这一步的。这是因为我想自动去注入的原因。

### 03. 创建数据库

我个人是更喜欢在数据库中创建好的，因为我觉得他的配置文件学要写的东西太多了。

所以我是在数据库中创建好表同步到代码中

```shell
npx primsa db pull 
npx prisma generate
```

拉去成功之后编一下。

然后就直接可以在项目中使用了

```typescript
constructor(private readonly globalService: GlobalService, private readonly prisma: PrismaService) { }
```

如果是想自己写，就 `push` 一下或者有自动同步的，这个需要自己查一下。

### 04. 语法

https://prisma.org.cn/docs

查看文档或者直接问ai也行。

### 05. 结束

使用过程非常的丝滑，虽然现在我基本上用不到所谓的高性能这一块，多数据源，连接池之类的

但是接入过程及其丝滑，除了数据库连接接本上0配置，完全不用写 `entity` 之类的东西。

体验非常好。

只是，在这个AI的时代，其实用啥感觉都一样，毕竟很多都不需要你自己写。cursor 会帮你搞定。
