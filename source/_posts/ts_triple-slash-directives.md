---
title: 三斜杠指令
date: 2023-07-03 22:47:51
tags: 
    - typescript
---

### 01. 什么是三斜杠指令

```
/// <reference path="..." />
/// <reference types="..." />
/// <reference lib="..." />
/// <reference no-default-lib="true"/>
/// <amd-module />
/// <amd-dependency />
```

官方文档中给出的样例，我也经常在 `typescript` 项目当中看到类似的引用

> 三斜线指令是包含单个XML标签的单行注释。 注释的内容会做为编译器指令使用。
>
> 三斜线指令仅可放在包含它的文件的最顶端。 一个三斜线指令的前面只能出现单行或多行注释，这包括其它的三斜线指令。 如果它们出现在一个语句或声明之后，那么它们会被当做普通的单行注释，并且不具有特殊的涵义。
>
> 三斜线引用告诉编译器在编译过程中要引入的额外的文件。

那么这些东西有什么用呢？

就是为编译和智能提示，比如说，我全局引用了 `Jquery`, 但是我有这么多文件，都没有智能提示，这个时候 `reference` 就出场了。

```
/// <reference types="Jquery" />
/// <reference path="node_modules/jquery/...." />
```

两个的差别就是一个通过名字自己去 `node_modules` 里面找，一个是直接给出地址，都能让 `typescript` 通过编译了。


其他用法

```
/// <reference lib="..." />

此指令允许文件显式包含现有的内置 lib 文件。

/// <reference no-default-lib="true"/>

此指令将文件标记为默认库

/// <amd-dependency path="legacy/moduleA" name="moduleA"/>

默认情况下，AMD 模块是匿名生成的。 当使用其他工具处理生成的模块（例如捆绑器）时，这可能会导致问题。r.js

该指令允许将可选模块名称传递给编译器：amd-module

/// <amd-dependency />

将导致将名称分配给模块作为调用 AMD 的一部分：NamedModuledefine


```

### link

[triple-slash-directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)