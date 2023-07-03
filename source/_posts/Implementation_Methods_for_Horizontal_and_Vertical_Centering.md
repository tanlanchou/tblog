---
title: css 垂直居中方案
date: 2023-07-03 22:09:01
tags: 
    - web
    - css
    - flex
    - grid
    - table
    - transform
description: 4种垂直居中的方案, 如果不存在浏览器兼容问题，就直接 flex
---

一般方案上来说很多。

1. flex
2. grid
3. table
4. absolute

### 01. flex 基本知识

做这个之前需要先简单知道一下 flex 是做什么的，阮一峰的那一篇就挺好。

![alt text](/home/tommy/tCode/record/blog/img/bg2015071004.png)

> 容器默认存在两根轴：水平的主轴（main axis）和垂直的交叉轴（cross axis）。主轴的开始位置（与边框的交叉点）叫做main start，结束位置叫做main end；交叉轴的开始位置叫做cross start，结束位置叫做cross end。
> 
> 项目默认沿主轴排列。单个项目占据的主轴空间叫做main size，占据的交叉轴空间叫做cross size。

这个是基本概念，由这些点来控制 flex 布局，接下来就是基本的属性

* flex-direction 方向，main axis & cross axis 切换
* flex-wrap 控制换行
* flex-flow 前两个的简写
* justify-content 定义了项目在主轴上的对齐方式。
* align-items 交叉轴的对齐方式
* align-content 多根轴线的对齐方式

在这个基础只上，就基本理解了, flex 运作方式

`display:flex` 声明容器布局方式，他按照从左到又一次排列，你可以根据属性来修改主轴，以及轴的对齐方式。

上面的都是对容器进行设置，除此之外，我们还可以设置以下属性。

* order 设置优先级，用于排序
* flex-grow 可以放大，原本每个单元格都是1, 你可以单独设置他
* flex-shrink 缩小的比例
* flex-basis
* flex 上面的简写
* align-self 单独设置对齐方式，一般用不到，你要玩花活的时候就需要了

### 02. flex 垂直居中

在上面的基础之上，就可以知道如何写了

1. display: flex
2. 设置交叉轴对齐方式居中
3. 设置水平轴对齐方式居中

```
    <style>
      .box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 500px;
        height: 500px;
        border: 1px black solid;
      }

      .item {
      }
    </style>
	
	<div class="box">
      <div class="item">a</div>
    </div>
```

就完成了。

### 03. grid 布局基本知识

grid 的概念和 flex 区别很大，flex只关心 item, grid 是在于 row 和 column,

* grid-template-columns 指定每一列的列宽
* grid-template-rows 指定每一行的行高
* repeat 重复，不用每个都写
* auto-fill 自动计算，类似于自动换行，这个是针对于 repeat(个数, 宽度)
* fr 百分比
* auto 自行决定宽度
* grid-row-gap 行间距
* grid-column-gap 列间距
* grid-gap 上面两位集合
* grid-template-areas 合并单元格所用。
* grid-auto-flow 先行后列，还是先列后行
* justify-items item内部水平位置
* align-items item内部垂直位置
* place-items 上面两个集合
* justify-content item本身对于容器的水平位置
* align-content item本身对于容器的垂直位置
* place-content 上面两个集合
* grid-auto-columns 设置额外网格打小
* grid-auto-rows

这里就很明确了，区别。

一个是一维，一个是二维。grid 明显更适合布局，然而flex更适合局部的布局。

### 04. grid 垂直居中

如果只是垂直居中的话很简单

```
.box {
	display: grid;
	grid-template-columns: 100px;
	grid-template-rows: 100px;
	justify-content: center;
	align-content: center;
}
```

原理都一样。

### 05. table 

其实就是使用 td 的 `vertical-align: middle & text-align: center`.

这里需要知道一个概念 重绘 和 回流, 这个概念如果要讲清楚，需要从浏览器加载过程说起。

简单说，就是

> 重绘（Repaint）：当元素的样式发生改变，但不影响其布局时，浏览器会执行重绘操作。重绘意味着浏览器会重新绘制元素的可视部分，以反映新的样式，但并不会影响元素的大小和位置。重绘操作比回流操作更加轻量级，对性能影响较小。
> 
> 回流（Reflow）：当页面的布局发生改变，例如元素的尺寸、位置、显示/隐藏状态等改变时，浏览器会执行回流操作。回流会重新计算并应用所有受影响元素的几何属性，然后重新排列页面中的元素。回流操作相对较为昂贵，会引起页面重新布局，对性能有较大的影响。

也就是说，当你更改一个元素的宽高，或者背景颜色都可能触发，关键是 table 特别容易触发。

> table 及其内部元素可能需要多次计算才能确定好其在渲染树中节点的属性值，比同等元素要多花两倍时间，这就是我们尽量避免使用 table 布局页面的原因之一

这是table我查到的问题，但是现代浏览器优化做的很好，并且怎么去使用table，比如包含大量的嵌套或跨行/跨列的单元格时确实很复杂，确实会计算很多。

但是如果你通过其他方式去实现，比如 grid 或者 flex，在这种复杂度下，是否性能会比table好，这个我没有做过测试，但是我觉得很难说。

另外，如果只是简单的为了居中 `display:table` 也是一种方案。

### 06. absolute

这个比较简单，就是说

```
.container {
  position: relative;
}

.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

这种方式主要点在于 ` transform: translate(-50%, -50%);` 上。

top & left 计算的是父结点，所以是300px，如果再加上元素本身高和宽，那么就不是正确的。

但是加上了 transform: translate，这里的百分比是根据当前元素计算的，这个移动就能保证居中

### 07. 总结

这里记录了4种垂直居中的方案, 如果在没有浏览器兼容性问题的情况下还是使用 flex，因为他基本没有什么缺点。

使用绝对定位是需要确定父级高度的。而且需要设置容器的定位属性，可能会对其他布局属性产生影响。

使用 display:table,对于一些特殊布局要求可能不适用。

### 08. 引用

* [Flex 布局教程：语法篇](https://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)
* [flex-layout](https://github.com/Coffcer/flex-layout)
* [CSS Grid 网格布局教程](https://www.ruanyifeng.com/blog/2019/03/grid-layout-tutorial.html)
* [CSS布局中Grid 和Flex 该用哪个比较好？](https://www.duidaima.com/Group/Topic/CSS/9504)
* [一文教会你何为重绘、回流？](https://blog.csdn.net/JHXL_/article/details/124046715)
* [CSS 变形(CSS3) transform](https://blog.csdn.net/chunxiaqiudong5/article/details/104049484)


