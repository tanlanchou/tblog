---
title: javascript 中的进制转换
date: 2023-06-15 15:25:01
tags: 
    - web
    - javascript
    - 进制转换
description: javascript中如何表现进制 0x,0o,0b，原生有那些转换方法, parseInt(v, n), Number(), +()，Number.prototype.toString()，以及自己写一个支持小数处理的方法
---

进制转换，javascript 有哪些进制转换的方式？

### 01. 进制在 javascript 中是如何表现的？

1. 十六进制 `0x` or `0X`
2. 八进制 `0o` or `0O`
3. 二进制 `0b` or `0B`

在后面跟数据就可以了，常用的最多就这些了

明白进制转换首先需要知道，什么是进制

### 02. 原生的转换

javascript 默认10进制，其他进制转10进制很方便

```
parseInt(v, 2 or 8 or 16...) //other => 10进制
Number() //other => 10进制
+() //other => 10进制
Number.prototype.toString() //十进制 => other 支持小数。
```

其实用法都很简单

```
const C161 = 0xaa;
const C162 = "0xAA";

console.log(C161);
console.log(C162);
console.log(`----------------`);

console.log(Number(C161));
console.log(Number(C162));
console.log(`----------------`);

console.log(parseInt(C161));
console.log(parseInt(C162));
console.log(`----------------`);

console.log(parseFloat(C161));
console.log(parseFloat(C162));
console.log(`----------------`);

console.log(+C161);
console.log(+C162);
console.log(`----------------`);

`11.11`.toString(2);
```

需要注意的是，如果使用 parseInt 转换， 16进制ok 

```
parseInt(`0xAA`)
parseInt(`0b111`)
```

二进制不识别前面的 `0b`, 还是需要写入完整参数，最好都写

```
parseInt(`0xAA`, 16)
parseInt(`0b111`, 2)
```

相比之下, Number or + 没有这种限制。但是却又无法主动选择进制基数。

所以区分了应用场景。

### 03. 如何处理小数

如果在javascript中直接写 `0b111.111` 是会报错了， 必须写 `'0b111.111'`.

也就是说原生 javascript 是无法处理小数的，当然可以自己去写，遵循以下原则

> 从二进制数的最低位开始，每一位乘以对应的2的幂数，然后将最终的结果小数部分与整数部分分别相加
> 对应的2的幂，以个位为0，向高位依次增1，向地位依次减1；

对应关系

```
1010.1010
```
0 * 2的0次方 + 1 * 2的一次方，以此类推


### 03. 如果自己去写，有什么思路?

首先写一个二进制的整数转换

```
function twoToTen(str) {
  if (typeof str !== `string`) return NaN;

  let count = 0;
  for (let i = 0; i< str.length;i++) {
    count += Math.pow(2, i) * str.charAt(str.length - i -1);
  }

  console.log(`输入:${str}`);
  console.log(`输出:${count}`);
  return count;
}

twoToTen(`111`);
```

如果加入小数点

```
function twoToTen(str) {
  if (typeof str !== `string`) return NaN;

  let arr = str.split(`.`);
  let a = arr[0];
  let b = arr[1];

  let count = 0;
  for (let i = 0; i < a.length; i++) {
    count += Math.pow(2, i) * a.charAt(a.length - i - 1);
  }

  let count1 = 0;
  for (let i = 0; i < b.length; i++) {
    count1 += Math.pow(2, -(i + 1)) * a.charAt(i);
  }

  console.log(`输入:${str}`);
  console.log(`输出:${count + count1}`);
  return count + count1;
}
```

具体的百度一下就有公式，并不复杂。

我这里并没有进行检查，以及错误处理，如果需要，还是要加上的。

### 03. link

1. [搞懂JavaScript中的进制与进制转换](https://juejin.cn/post/7035844421522292750)
2. [百度百科 二进制](https://baike.baidu.com/item/%E4%BA%8C%E8%BF%9B%E5%88%B6/361457?fromModule=lemma_search-box)
3. [百度百科 八进制](https://baike.baidu.com/item/%E5%85%AB%E8%BF%9B%E5%88%B6?fromtitle=8%E8%BF%9B%E5%88%B6&fromid=17712662&fromModule=lemma_search-box)
4. [百度百科 十六进制](https://baike.baidu.com/item/%E5%8D%81%E5%85%AD%E8%BF%9B%E5%88%B6/4162457?fromModule=lemma_search-box)