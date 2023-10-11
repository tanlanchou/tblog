---
title: IFC 布局模型
date: 2023-07-03 22:09:01
tags: 
    - web
    - css
    - ifc
description: ifc 是一个顺序排列的模型，水平顺序排列，简单用就 `text-align`, 水平方向使用 margin, padding 就ok了。如果遇到问题，还是需要知道line box 和 line 这个概念。
---

### 1. 简介

官方解释

> An inline formatting context is a formatting context that contains inline-level boxes. It is used to determine the layout for the inline-level boxes and their relationships with the line boxes they participate in.

简单来说，IFC 是一种用于确定行内元素的布局和与所在行盒子之间关系的渲染上下文。它定义了行内元素如何排列、如何处理文本换行和溢出等问题，同时还控制了行内元素与周围元素之间的间距和对齐方式。

### 2. 特性

* 行内元素在 IFC 中从左到右排列，直到占满一行，然后换行继续排列。
* IFC 中的元素在垂直方向上以基线对齐（默认情况下）。
* IFC 的宽度由其包含的行内元素的宽度决定，不会超出其父容器的宽度。
* IFC 中的元素可以通过设置 vertical-align 属性来调整垂直对齐方式。
* IFC 中的元素可以通过设置 text-align 属性来调整水平对齐方式。

### 3. line-box

这里有一个line-box的概念，在形成 IFC 以后，就有这个玩意儿。

> 在IFC中，盒子水平放置，一个接着一个，从包含块的顶部开始。水平margins,borders,和padding在这些盒子中被平分。这些盒子也许通过不同的方式进行对齐:他们的地步和顶部也许被对齐，或者通过文字的基线进行对齐。矩形区域包含着来自一行的盒子叫做line box。

有多少个line box，取决于你 IFC 长度和显示的宽度。

> line box的宽度由浮动情况和它的包含块决定。line box的高度由line-height的计算结果决定。
> 
> 一个line box总是足够高对于包含在它内的所有盒子。然后，它也许比包含在它内最高的盒子高。(比如，盒子对齐导致基线提高了)。当盒子B的高度比包含它的line box的高度低，在line box内的B的垂值对齐线通过'vertical align'属性决定。当几个行内级盒子在一个单独的line box内不能很好的水平放置，则他们被分配成了2个或者更多的垂直重叠的line boxs.因此,一个段落是很多个line boxs的垂直叠加。Line boxs被叠加没有垂直方向上的分离(特殊情况除外)，并且他们也不重叠。

这里是直接翻译官方的英文

1. 高度自适应：line box 的高度会根据行内元素的高度来自适应，以包含所有行内元素的内容。行内元素可以具有不同的高度，但 line box 的高度会根据最高的行内元素来确定。
2. 垂直对齐：line box 会根据基线（baseline）对齐行内元素。行内元素的基线可以是不同的，但 line box 会根据这些基线来对齐它们。这可以实现行内元素的垂直对齐。
3. 水平布局：line box 内的行内元素会水平排列。当 line box 的宽度不足以容纳所有行内元素时，会根据相应的排列规则进行换行。
4. 边界计算：line box 的边界由其中的行内元素决定。line box 的顶部和底部边界会根据行内元素的上边界和下边界来计算。
5. 内联盒子集合：line box 实际上是一组包含行内盒子（inline boxes）的矩形框，每个行内盒子对应一个行内元素。行内盒子会根据其具体的尺寸和位置排列在 line box 内部。

这个比较抽象，换成一个实际的代码

```
EM {
padding: 10px;
margin: 1em;
border-width: medium;
border-style: dashed;
line-height: 2.4em;
}

<div>
  <p>Several <em>emphasized words</em> appear here.</p>
</div>
```

这里就有3个 `line box`.

![alt text](/img/截图 2023-06-05 16-41-10.png)

其中两个匿名，一个 em， 其实我刚才是很疑惑为什么要知道这个？然后资料中给了一个例子

```
.dib-baseline {
	display: inline-block;
	width: 150px;
	height: 150px;
	border: 1px solid #cad5eb;
	background-color: #f0f3f9;
}
	  
<div>
  <span class="dib-baseline"></span>
  <span class="dib-baseline">x-baseline</span>
</div>
```

我薄弱的知识中道理上去说，应该是并排的，其实不是。

![alt text](/img/截图 2023-06-05 16-45-18.png)

结果是这个样子。

> 没有内联元素的框框：
> 当容器没有内联元素时，基线会被设置为容器的下边缘（即下边框下面的位置）。这是因为在没有内联元素的情况下，基线的位置没有具体的参考物，因此默认被设置为容器的下边缘。
>
> 有字符的框框：
> 当容器内有字符作为内联元素时，基线会根据字符的具体形状和字体特性进行计算，并被设置为字符的基线位置。基线的位置通常是字符底部与字符主要部分的对齐线，用于对齐字符的位置和其他行内元素。

有一个中心线的概念，也就是 `baseline`, ifc 容器基于 baseline 进行定位。

所以出现了这种情况，当容器没有内联元素时，基线会被设置为容器的下边缘，当容器内有字符作为内联元素时，基于字体作为 baseline 位置。

### 4. line 线

![alt text](/img/css-ifc-baseline.jpg)

理论上我们都是通过默认的基线水平排列，就是baseline这条线， top, middle, bottom 通过 vertical-align 设置。

那么这个时候我就产生了一个疑问，怎么影响 baseline呢？

首先 baseline 和 middle line 是不一样的，如果字体越大差距越大，所以想要完全居中，直接 `font-size:0` 就可以了。

同样，图片的 bottonline 和 baseline，你要么设置为 vertical-align 为 bottom, 或者还是设置 `font-szie：0` 线自然就重合了。

### 5. 总结

ifc 是一个顺序排列的模型，水平顺序排列，简单用就 `text-align`, 水平方向使用 margin, padding 就ok了。

如果遇到问题，还是需要知道line box 和 line 这个概念。

### 6. 资料

* [CSS深入理解vertical-align和line-height的基友关系](https://www.zhangxinxu.com/wordpress/2015/08/css-deep-understand-vertical-align-and-line-height/)
* [css 格式化上下文布局——BFC和IFC【详解】](https://blog.csdn.net/weixin_41192489/article/details/120197275)
* [[译]:BFC与IFC](https://segmentfault.com/a/1190000004466536)
* [CSS IFC 总结](https://mengsixing.github.io/blog/css-ifc.html#css-%E5%86%85%E8%81%94%E6%A0%BC%E5%BC%8F%E5%8C%96%E4%B8%8A%E4%B8%8B%E6%96%87)
