---
title: flex 属性详解
date: 2023-09-01 21:00:01
tags: 
    - flex
    - html
    - css
description: 写这个的目的是为了详细解释一下 flex 每个属性的意义和用法, 原因是因为突然发觉我自己对于 flex 细节并不是完全清楚

---

写这个的目的是为了详细解释一下 flex 每个属性的意义和用法, 原因是因为突然发觉我自己对于 flex 细节并不是完全清楚

### 01. flex-direction

flex-direction 决定主轴的方向（即项目的排列方向）

首先需要注意的是主轴的方向, 默认是水平方向, 即从左到右, 水平方向是主轴, 垂直方向是交叉轴

![alt text](img/bg2015071004.png)

也就是上图中 main axis, 交叉轴是 cross axis.

两个可以相互交换

也就是说 main axis 为交叉轴, cross axis 为主轴.

其中 flex-direction 属性有 4 个取值

- row-reverse 
- column-reverse
- row
- column

默认值是 row, 也就是普通的水平排列, 如果 column 就是垂直排列.

如果是反转 row-reverse, column-reverse .

row-reverse 就是从右到左, column-reverse 就是从下到上

只是需要注意的是 row-reverse 是真的全部从右到左, 整个布局都是右对齐了.

但是 column-reverse 只是数据从下到上, 对齐方式还是从上到下

### 02. flex-wrap

flex-wrap 决定如果一行排不下, 是否换行.

flex-wrap 属性有 3 个取值

- nowrap
- wrap-reverse
- wrap

默认值是 nowrap, 也就是不换行.
wrap-reverse 就是从下到上, 也就是从左到右
wrap-reverse 换行, 从上到下, 从左到右.

```html
<style>
    .main {
        display: flex;
        flex-direction: row;
    }

    .box {
        width: 200px;
        border: 1px solid red;
        background-color: black;
        color:white
    }
</style>

<div class="main">
    <div class="box">1</div>
    <!-- ... -->
</div>
```

当 `flex-warp: nowrap` 时, 也就是默认值. 不管我有多少个 `box`, 都只会在一行显示, 他只会按比例缩小每一个 `box`.

如果采用 `flex-warp: wrap`, 也就是自动换行. 这个时候就会出现换行的情况. 排不下了就自动换.

`wrap-reverse` 自动换行, 只是第一行在左下方, 也是从左到右.

### 03. flex-flow

这个比较简单

```css
.box {
  flex-flow: <flex-direction> || <flex-wrap>;
}
```

就是前面两个的结合

### 04. justify-content

justify-content 属性定义了项目在主轴上的对齐方式.

只是主轴的对齐方式, 这个和 flex-direction 有关.

justify-content 属性有 6 个取值,

- flex-start
- flex-end
- center
- space-between
- space-around
- space-evenly

默认值是 flex-start, 也就是从左到右

flex-end 就是从右到左

center 就是居中

space-between 就是两端对齐, 也就是两边留白, 中间对齐

space-around 就是两边留白, 两边对齐, 中间对齐

space-evenly 就是两边留白, 两边对齐, 中间对齐

![Alt text](/image/image.png)

### 05. align-items

`align-items` 属性定义项目在交叉轴上如何对齐。

```css
.box {
  align-items: flex-start | flex-end | center | baseline | stretch;
}
```

> flex-start 交叉轴的起点对齐.
> 
> flex-end 交叉轴的终点对齐.
> 
> center 交叉轴的中点对齐.
> 
> baseline 项目的第一行文字的基线对齐.
> 
> stretch 如果项目未设置高度或设为auto, 将占满整个容器的高度.

![Alt text](/image/image01.png)

这里只是针对交叉轴, 需要明白之前那张图,没有设置高度的情况下, 默认是占满整个容器的高度.

所以交叉轴就是在这个高度下去浮动.

这里 baseline 比较特殊, 他是根据文字的基线去对齐.

这个在需要文字,图片,icon 对齐的时候就有用了.

> stretch 如果项目未设置高度或设为auto, 将占满整个容器的高度.

`stretch` 是默认值, 不管你是否设置 `align-items`, 都会触发.

也就是说 `flex` 容器如果设置了高度, 比如 **600px** , `flex` 容器内容有三行. 那么每个容器都是 **200px** 高度

### 06. align-content

这个其实是我当时的一个疑惑点

> align-content属性定义了多根轴线的对齐方式。如果项目只有一根轴线，该属性不起作用。

首先什么事多个轴线? 不是有多个主轴或者多个交叉轴. 而是单行的情况, 就认为没有交叉轴,也就是只有主轴.

所以 `align-content` 换句话说,就是单行情况下不生效. 至少两行才能生效

那么 `align-items` 和 `align-content` 有什么区别呢?

`align-items` 是针对单个容器内容在交叉轴的对齐方式.

`align-content` 的设置对象是所有行.


> flex-start：与交叉轴的起点对齐。
> 
> flex-end：与交叉轴的终点对齐。
> 
> center：与交叉轴的中点对齐。
> 
> space-between：与交叉轴两端对齐，轴线之间的间隔平均分布。
> 
> space-around：每根轴线两侧的间隔都相等。所以，轴线之间的间隔比轴线与边框的间隔大一倍。
> 
> stretch（默认值）：轴线占满整个交叉轴。

可以看下这个图

![Alt text](/img/image02.png)

### 07. 容器总结

上面的所有属性都是基于容器的

1. `flex-direction` 主轴方向
2. `flex-warp` 容器是否换行和换行的方式
3. `flex-flow` 是上面两个属性的合并
4. `justify-content` 主轴对齐方式
5. `align-items` 交叉轴对齐方式
6. `align-content` 交叉轴多行对齐方式

上面已经能做很多事情了

比如我们常用的垂直居中， 就只需要 

`justify-content` 主轴对齐方式
`align-items` 交叉轴对齐方式

两个对齐就ok了。

### 08. order

这个属性是我之前完全忽略的属性

> order属性定义项目的排列顺序。数值越小，排列越靠前，默认为0。

经过一个简单的测试 

```html
<div class="box">1</div>
<div class="box">2</div>
<div class="box">3</div>
<div class="box">4</div>
<div class="box" style="order:99">5(order 99)</div>
<div class="box" style="order:100">6(order 100)</div>
```

也就是说 `order` 排序越小越在前面，但是前提是在有order设置里面。也就是说，如果我将 order 设置为0 或者不设置，那么他们永远是根据dom顺序来。设置 `order` 只能排后面

### 09. flex-grow

flex-grow 放大比例

> flex-grow属性定义项目的放大比例，默认为0，即如果存在剩余空间，也不放大。

这个属性是针对剩余空间的，如果空间不足，那么就按照比例分配

于是我按照这个思路写了一个

```html
</head>
    <style>
        .main {
            display: flex;
            flex-direction: row;
            height: 800px;
            border:1px solid black
        }

        .box {
            border: 1px solid red;
            background-color: black;
            color:white;
            flex-grow: 1,
        }
    </style>
</head>

<body>
    <div class="main">
        <div class="box">1</div>
        <div class="box">2</div>
        <div class="box" style="flex-grow: 3">3</div>
        <div class="box">4</div>
        <div class="box">5</div>
        <div class="box">6</div>
        <div class="box">7</div>
    </div>
</body>
```

结果我发现不对， 因为3并没有其他的两倍，但是下面这个链接又是ok的

https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex-grow

这点我非常疑惑，后续再研究吧。

### 10. flex-shrink

> flex-shrink属性定义了项目的缩小比例，默认为1，即如果空间不足，该项目将缩小。

怎么理解呢？

> 子元素当父元素宽度不够用时，自己调整自己所占的宽度比，这个flex-shrink设置为1时，表示所有子元素大家同时缩小来适应总宽度。当flex-shrink设置为0时，表示大家都不缩小适应

和 `flex-grow` 类似, 只是有一个前提, 如果空间不够的话.

比如

```html
<style>
    .main {
        align-items: center;
        display: flex;
        justify-content: center;
    }

    .box {
        background-color: rgba(0, 0, 255, .2);
        border: 3px solid #00f;
        margin: 10px;
        flex-shrink: 1;
        width: 200px;
    }
</style>
<body>
    <div class="main">
        <div class="box">1</div>
        <div class="box">2</div>
        <div class="box" style="flex-shrink:2">3</div>
    </div>
</body>
```

还有就是也出现了, 并没有等比缩小. 这个具体还要后面学习

### 11. flex-basis

https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex-basis

> CSS 属性 flex-basis 指定了 flex 元素在主轴方向上的初始大小。如果不使用 box-sizing 改变盒模型的话，那么这个属性就决定了 flex 元素的内容盒（content-box）的尺寸。
>
> 它可以设为跟width或height属性一样的值（比如350px），则项目将占据固定空

### 12. flex

```css
flex: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]
```

### 13. align-self

> align-self属性允许单个项目有与其他项目不一样的对齐方式，可覆盖align-items属性。默认值为auto，表示继承父元素的align-items属性，如果没有父元素，则等同于stretch。

这个没什么好说的, 如果你前面理解了后面也理解了.

### 14. 总结.

flex 分为主轴和交叉轴, 两者可相互交换, 可以使用 flex-dirction 进行控制.

flex 默认不换行, 你可以使用 flex-wrap 进行换行控制.

flex-flow 对上面两个进行组合. flex-flow: flex-direction flex-wrap

justify-content 控制主轴对齐方式.

align-items 控制交叉轴对齐方式.

align-content 控制多根轴线的对齐方式(也就是整体项目, 而不是单独某个box)

上面就是 flex 项目整体的操作, 接下来是每个容器操作

order 可以规定容器显示顺序

flex-grow 可以规定容器放大比例

flex-shrink 可以规定容器缩小比例

flex-basis 可以规定容器初始大小

flex 可以规定容器放大缩小比例和初始大小

align-self 可以规定容器单独交叉轴对齐方式

大概得语法就是这样了, 后续我会基于我的疑惑点在学习


















https://www.cnblogs.com/cblx/p/12272729.htm

