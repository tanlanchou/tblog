---
title: css 如何实现左侧固定 300px，右侧自适应的布局
date: 2023-07-08 11:26:01
tags: 
    - 做题
    - html
---

### 01. flex

主要利用 flex 特性, 如果只有一个 flex: 1 撑满

https://codesandbox.io/s/frosty-haze-wqmm8l

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .main {
            display: flex;
        }

        .one {
            height: 300px;
            width: 300px;
            background-color: red;
        }

        .two {
            flex: 1;
            height: 300px;
            background-color: blue;
        }
    </style>
</head>

<body>
    <div class="main">
        <div class="one"></div>
        <div class="two"></div>
    </div>
</body>

</html>
```

### 02. float

https://codesandbox.io/s/fancy-dream-nktwvm?file=/%5BQ017%5DHow_does_css_achieve_a_fixed_300px_on_the_left_and_an_daptive_layout_on_the_right_two.html

```html
    <style>
        .main {
            overflow: hidden;
            height: 300px;
        }

        .one {
            float: left;
            width: 300px;
            height: 100%;
            background-color: red;
        }

        .two {
            float: left;
            background-color: blue;
            height: 100%;
            width: calc(100% - 300px);
        }
    </style>
```