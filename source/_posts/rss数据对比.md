---
title: rss数据对比
date: 2024-02-23 14:48:52
tags: 
    - rss
    - diff
---

做事儿的目的在于我需要对比两个 `xml`, 也就是 `rss` 之间的差异

最开始是自己做对比, 但是还是觉得太麻烦.

`xml` 对比在 `npmjs` 上没有找到特别好的工具, 于是走了歪路, **xml ⇒ json ⇒ diff**

通过 `rss-parser` 获取 `rss` 数据源, 然后回直接转为 `json` 数据, 也就是 `object`

[npm: rss-parser](https://www.npmjs.com/package/rss-parser)

然后就可以对比两个 `json`

https://github.com/andreyvit/json-diff

json-diff工具在比较两个JSON文件或对象后，会生成一个差异报告。这个报告将详细列出两者之间的差异，包括添加、删除和修改的内容。这样，您可以清楚地了解数据的变化情况。

`json-diff` 最好的地方在于他可以明确告诉你添加删除修改

比如 **[1,2,3,4,5,6]** 对比 **[2,3,4,5,6,7]**

一般的对比工具会告诉你 `1 ≠ 2` 这里有变化, 其实是删除了1, 新增了7.

我没有看他对比的算法, 大概率会复杂很多

有了这两个工具的帮助, 这件事儿就简单多了