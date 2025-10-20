---
title: 简单的todoList
date: 2023-07-14 13:40:51
tags: 
    - 微信小程序
    - todolist
---

### 01. 简单版本

**wsml**

```html
<view class="container">
  <view class="input-container">
    <input class="input-text" bindinput="inputChange" placeholder="输入任务" value="{{inputValue}}" />
    <button class="add-button" bindtap="addTask">添加</button>
  </view>
  <view class="task-list">
    <block wx:for="{{taskList}}" wx:key="index">
      <view class="task-item">
        <text class="task-item-text">{{item.task}}</text>
        <text class="task-item-time">{{item.time}}</text>
      </view>
    </block>
  </view>
</view>
```

**wxss**

```css
.container {
  width: 100%;
  padding: 20px
}

.input-container {
  width: 100%;
}

.input-text {
  display: block;
  height: 40px;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  margin: 10px 0;
}

.add-button {
  height: 40px;
  padding: 0 15px;
  border: none;
  border-radius: 5px;
  background-color: #007AFF;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-list {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 15px 0;
}

.task-item {
  width: 100%;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f7f7f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-item-text {
  padding-right: 5px;
  flex: 2;
  font-size: 16px;
  font-weight: bold;
  overflow: hidden;
  word-break: break-all;
}

.task-item-time {
  flex: 1;
  width: 100px;
  font-size: 14px;
  color: #666;
}
```

**wxs**

```js
Page({
  data: {
    inputValue: '',
    taskList: []
  },

  inputChange: function(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  addTask: function() {
    var task = {
      task: this.data.inputValue,
      time: this.getRemindTime()
    };

    var newList = this.data.taskList.concat(task);

    this.setData({
      taskList: newList,
      inputValue: ''
    });
  },

  getRemindTime: function() {
    var currentTime = new Date();
    var remindTime = new Date(currentTime.getTime() + 5 * 60 * 1000); // 5分钟后提醒
    return remindTime.toLocaleTimeString('en-US');
  }
});
```

简单解释一下，现在就是一个简单的添加文字，到列表的一个过程。

现在包含了当前时间和提醒时间，以及文字两个字段。

效果大概就是下图这样

![alt text](/img/2023-07-11-211057.png)

### 02. 本地化存储

先限制一下输入，小于3个字符，或者多余40个字符，都不允许输入

```js
let txt = this.data.inputValue.trim();
if (txt.length > 40 || txt.length < 3) {
  wx.showToast({
	title: '任务长度不正确',
	icon: 'error'
  })
  return;
}
```

找到生命周期的页面，发现 onload 这个生命周期最适合

```js
onLoad: function () {
	// 页面加载时读取本地存储的任务列表数据
	wx.getStorage({
	  key: 'taskList',
	  success: (res) => {
		this.setData({
		  taskList: res.data
		});
	  }
	});
},
```

然后在保存的地方加入

```js
// 保存更新后的任务列表数据到本地存储
wx.setStorage({
  key: 'taskList',
  data: newList
});
```

最后把 key 定义为常亮

```js
const key = 'taskList';
```

### 03. 删除。

![alt text](/img/2023-07-11-211057.png)

我想实现卡片式删除，也就是那种左滑删除。那么思路是什么？

https://developer.mozilla.org/zh-CN/docs/Web/CSS/transform
https://developer.mozilla.org/zh-CN/docs/Web/CSS/transform-function/translateX

```css
transform: translateX(10px); /* 等同于 translate(10px) */
```

右边看不见的地方隐藏菜单, 然后就当捕获到事件，就可以显示菜单。

在此之前，先修改一下样式，毕竟圆滚滚灰色背景不太舒服。

```css
.task-item {
  width: 100%;
  margin-bottom: 20px;
  padding: 10px;
  border-bottom: 1px solid gray;
  position: relative;
  height: 20px;
  overflow: hidden;
}

.task-item-text {
  padding-right: 5px;
  flex: 2;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 使用省略号代表被截断的文本 */
}
```

这里加入了一个白底灰边，然后如果超出文字省略号 **...**， 然后开始创建删除

```html
<view class="task-item" >
  <view class="task-item-container" data-index='{{index}}' bindtouchstart='touchstart' bindtouchmove='touchmove' bindtouchend='touchend' style="transform:translateX(-{{item.distance}}px);">
    <text class="task-item-text">{{item.task}}</text>
    <text class="task-item-time">{{item.time}}</text>
  </view>
  <button class="delete"></button>
</view>
```

这里在外面套了一层 task-item-container ，并且加入了事件和 `transform:translateX(-{{item.distance}}px);` 以及新增一个删除按钮。

```css
.task-item-container {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  background-color: #fff;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  width: 20px !important;
  height: 100%;
  color: gray;
  background-color: white;
}
```

然后在事件中加入，设置的代码

```js
touchstart: function (e) {
  this.setData({
    _start: e.changedTouches[0].pageX
  })
},
```

开始的时候集录起始位置。

```js
touchmove: function (e) {
  let d = this.data._start - e.changedTouches[0].pageX;
  const newTaskList = this.data.taskList;
  d = d > maxX ? maxX : d;

  if (d > minDistance) {
    newTaskList[e.currentTarget.dataset.index].distance = d;
    this.setData({
      taskList: newTaskList
    });
  } else {
    newTaskList[e.currentTarget.dataset.index].distance = 0;
    this.setData({
      taskList: newTaskList
    })
  }
},
```

移动的过程中，设置最新位置。

```js
touchend: function (e) {
  console.log(`start1:${this.data._start}`);
  console.log(`pageX:${e.changedTouches[0].pageX}`);
  let d = this.data._start - e.changedTouches[0].pageX;

  const newTaskList = this.data.taskList;
  d = d > maxX ? maxX : d;
  console.log(d);
  if (d > minDistance) {
    newTaskList[e.currentTarget.dataset.index].distance = d;
    this.setData({
      _start: 0,
      taskList: newTaskList
    });
  } else {
    newTaskList[e.currentTarget.dataset.index].distance = 0;
    this.setData({
      _start: 0,
      taskList: newTaskList
    })
  }
}
```

结束代码差不多，只是重置开始位置。

基本ok以后，需要引入 iconfont. 总得加点图标才好看，我从 iconfont.com 引入，微信小程序无法共享某些css，也就是说每个 page 都是完全单独的样式，就算使用

```css
@import '...'
```

然后加入 css

```html
<button class="delete icon iconfont icon-icon-delete-fill"></button>
```

看下效果

![alt text](/img/2023-07-12-150046.png)

过程就是这样，接下来删除, 首先新增一个删除方法。

```js
deleteTaskItem: function (e) {
  const index = e.currentTarget.dataset.index;
  console.log(index);
  this.data.taskList.splice(index, 1);

  try {
    wx.setStorage({
      key: key,
      data: this.data.taskList
    });

    this.setData({
      taskList: this.data.taskList
    });
  } catch (e) {
    wx.showToast({
      title: '删除失败',
      icon: 'error'
    });
  }
}
```

然后添加到事件中即可，再加一个提示。

```js
wx.showModal({
  content: '确认删除？删除之后不可恢复',
  success: (res) => {
    if (res.confirm) {
      //...
    }
  }
})
```

ok, 就这样，删除也有了。

### 04. 新增添加页面

现在只输入了名字这个数据，所以要增加一些数据。

- 标题
- 添加时间
- 提醒时间
- 描述

简单就先用这个，我们需要一个新的页面，并且需要路由以及 `form`, 以及页面之间如何通信？

- [页面路由](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html)
- [navigator](https://developers.weixin.qq.com/miniprogram/dev/component/navigator.html)

> 框架以栈的形式维护了当前的所有页面

```json
"pages": [
  "pages/index/index",
  "pages/add/index"
],
```

首先增加连接，然后根据指南当中在 index 中增加一个链接。

```js
<navigator url="/pages/add/index">到添加页面去</navigator>
```

然后 `form` ，这个时候突然想到，其实还可以使用框架，不用全部自己写..., 于是直接用官方的 `weui` 吧.

```html
<form class="weui-form" bindsubmit="formSubmit">
  <view class="weui-form__bd">
    <view class="weui-form__text-area">
      <view class="weui-cells__title">
        <h2 class="weui-form__title">添加任务</h2>
      </view>
    </view>
    <view class="weui-form__control-area">
      <view class="weui-cells__group weui-cells__group_form">
        <view class="weui-cells">
          <label for="title-input" class="weui-cell weui-cell_active">
            <view class="weui-cell__hd"><text class="weui-label">标题</text></view>
            <view class="weui-cell__bd">
              <input id="title-input" class="weui-input" placeholder="任务标题" value="{{title}}" bindinput="handleInput" />
            </view>
          </label>
          <label for="curDay" class="weui-cell weui-cell_active">
            <view class="weui-cell__hd"><text class="weui-label">创建时间</text></view>
            <view class="weui-cell__bd">
              <input id="curDay" class="weui-input" value="{{curDay}}" disabled="{{true}}" />
            </view>
          </label>
          <picker mode="date" value="{{taskDay}}" bindchange="bindTaskDay" start="{{curDay}}">
            <view class="weui-cell weui-cell_active weui-cell_select">
              <view class="weui-cell__bd">
                <view class="weui-select">任务日期: {{taskDay}}</view>
              </view>
            </view>
          </picker>
          <picker mode="time" value="{{taskTime}}" bindchange="bindTaskTime">
            <view class="weui-cell weui-cell_active weui-cell_select">
              <view class="weui-cell__bd">
                <view class="weui-select">任务时间: {{taskTime}}</view>
              </view>
            </view>
          </picker>
          <label for="description-input" class="weui-cell weui-cell_active">
            <view class="weui-cell__hd"><text class="weui-label">描述</text></view>
            <view class="weui-cell__bd">
              <input id="description-input" class="weui-input" value="{{description}}" placeholder="请输入描述（选填）" bindinput="handleDescription" />
            </view>
          </label>
          <view class="weui-form__ft weui-bottom-fixed-opr-page__tool">
            <view class="weui-form__opr-area">
              <button class="weui-btn weui-btn_primary" formType="submit">提交</button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</form>
```
我没有加入表单验证组件，懒得去看其他组件了，生成了一些判断.

```js
const dateHelper = require('../js/common');
const key = 'taskList';

Page({
  data: {
    title: '',
    curDay: dateHelper.formatDate(new Date()),
    taskDay: '',
    taskTime: '',
    description: '',
    map: {}
  },
  bindTaskDay({
    detail: {
      value
    }
  }) {
    this.setData({
      taskDay: value
    });
  },
  bindTaskTime({
    detail: {
      value
    }
  }) {
    this.setData({
      taskTime: value
    });
  },

  handleInput({
    detail: {
      value
    }
  }) {
    this.setData({
      title: value
    });
  },

  handleDescription({
    detail: {
      value
    }
  }) {
    this.setData({
      description: value
    });
  },

  formSubmit(e) {

    let result = {
      title: this.data.title,
      curDay: this.data.curDay,
      taskDay: this.data.taskDay,
      taskTime: this.data.taskTime,
      description: this.data.description
    }

    // 校验 title
    if (!result.title || result.title.trim().length < 3 || result.title.trim().length > 40) {
      wx.showToast({
        title: '标题长度应在3到40个字符之间',
        icon: 'none'
      });
      return;
    }

    // 校验任务日期
    if (!result.taskDay) {
      wx.showToast({
        title: '请填写任务日期',
        icon: 'none'
      });
      return;
    }

    // 校验任务时间
    if (!result.taskTime) {
      wx.showToast({
        title: '请填写任务时间',
        icon: 'none'
      });
      return;
    }

    // 校验描述长度
    if (result.description && result.description.trim().length > 100) {
      wx.showToast({
        title: '描述长度不能超过100个字符',
        icon: 'none'
      });
      return;
    }

    let taskList = wx.getStorageSync(key);
    if (!taskList) taskList = [];
    taskList.push(result);

    wx.setStorage({
      key: key,
      data: taskList
    });

    // 清空表单数据
    this.setData({
      title: '',
      curDay: '',
      taskDay: '',
      taskTime: '',
      description: ''
    });

    wx.showToast({
      title: '提交成功',
      icon: 'success'
    });
  }
});
```

![alt text](/img/2023-07-13-112344.png)

看到这里 title 间距过高，日期选择以后时间间距也有问题，修改一下。


```html
<form class="weui-form" bindsubmit="formSubmit" style="padding-top: 0px;">

<picker mode="date" value="{{taskDay}}" bindchange="bindTaskDay" start="{{curDay}}">
  <label for="taskDay" class="weui-cell weui-cell_active">
    <view class="weui-cell__hd"><text class="weui-label">任务日期</text></view>
    <view class="weui-cell__bd">
      <text>{{taskDay}}</text>
    </view>
  </label>
</picker>
```

最后，增加一个跳转在添加成功以后

```js
wx.navigateBack();
```

### 05. 更新列表页面

当我准备改造的时候，发现 https://weui.io/#list 已经实现了这个功能，我之前还自己写。。

于是我借助他的样式，改了一下。

![](/img/2023-07-13-163917.png)

并且加入了导航

![](/img/2023-07-13-164021.png)

为了解决来回切换，列表不刷新的问题，将原本的 `onload` 改为 `onshow`.

基本上开始有点样子了。

然后将时间，写一个方法，转换为 刚刚，小时前这种模式，不要动不动就是 **2023-09-20** 之类的

```js
function getTimeRemaining(endTime) {
  const currentTime = new Date();
  const targetTime = new Date(endTime);
  const timeDifference = targetTime - currentTime;

  if (timeDifference <= 0) {
    return "已过期";
  }

  const oneMinute = 60 * 1000; // 1分钟的毫秒数
  const oneHour = oneMinute * 60; // 1小时的毫秒数
  const oneDay = oneHour * 24; // 1天的毫秒数
  const oneMonth = oneDay * 30.436875; // 1个月的毫秒数，按平均每月30.436875天计算
  const oneYear = oneMonth * 12; // 1年的毫秒数

  const years = Math.floor(timeDifference / oneYear);
  const months = Math.floor((timeDifference % oneYear) / oneMonth);
  const days = Math.floor((timeDifference % oneMonth) / oneDay);
  const hours = Math.floor((timeDifference % oneDay) / oneHour);
  const minutes = Math.floor((timeDifference % oneHour) / oneMinute);

  let remainingTime = "";

  if (years > 0) {
    remainingTime += `${years}年 `;
  }
  if (months > 0) {
    remainingTime += `${months}个月 `;
  }
  if (days > 0) {
    remainingTime += `${days}天 `;
  }
  if (hours > 0) {
    remainingTime += `${hours}小时 `;
  }
  if (minutes > 0) {
    remainingTime += `${minutes}分钟`;
  }

  return remainingTime.trim();
}
```

这个时候，我想到了，既然这么像 Vue，那么是不是有可能性，他也有指令。

https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/query.html

查了一下发现，他似乎没有这样的东西，只能通过原生的指令去解决问题，或者组件使用 slot, 从而实现封装，有点恶心

然后继续测试发现不能直接在 `{{func}}` 这样直接使用方法，最后查到了

https://blog.csdn.net/weixin_39015132/article/details/82767312

```html
<wxs module="filter" src="./numberToFixed.wxs"></wxs>
```

这个真的沉默了，太别扭了，这边产生了一个疑问，比如同样一个方法，我在 `{{}}` 和 js 中都需要使用，那是不是要区分 wxs, 果然要区分，因为。

> 因为 WXS 中不能调用 javascript 中定义的函数或者变量，也不能调用小程序提供的, API，他的运行环境和 javascript 是隔离的。

https://blog.csdn.net/Umbrella_Um/article/details/107253834 真的深深的嫌弃

用 getDate 解决了问题，现在是这样

![](/img/2023-07-13-233949.png)


### 06. 编辑

增加编辑按钮，加入跳转事件

传值的方法 https://www.cnblogs.com/bushui/p/11633766.html，不过例子中没有告诉你如何接收。

```html
<view class="weui-cell__ft">
  <view class="weui-swiped-btn weui-btn_primary"  data-index='{{index}}' aria-role="button" bindtap="editTaskItem" url="javascript:">编辑</view>
  <view class="weui-swiped-btn weui-swiped-btn_warn" data-index='{{index}}' aria-role="button" bindtap="deleteTaskItem">删除</view>
</view>
```

```js
editTaskItem(e) {
  const index = e.currentTarget.dataset.index;
  wx.navigateTo({
    url: '/pages/add/index?index=' + index,
  });
}
```

在 add 增加 onLoad

```js
onLoad(option) {
  let index = option.index;
  if (!!index) {
    index = Number.parseInt(index);
    wx.getStorage({
      key: key,
      success: (res) => {
        const d = res.data[index];
        if (!!d) {
          this.setData({
            title: d.title,
            curDay: d.curDay,
            taskDay: d.taskDay,
            taskTime: d.taskTime,
            description: d.description,
            map: d.map,
            index: index
          });
        }
      }
    });
  }
},

//在添加的位置
let taskList = wx.getStorageSync(key);
if (!taskList) taskList = [];
if (this.data.index === -1) {
  taskList.push(result);
} else {
  taskList[this.data.index] = result;
}
```

搞定。

### 07. 提醒

这里似乎就有麻烦了，因为微信切到后台以后，只驻留5分钟，如果内存紧张，5分钟都没有，所以在微信里写一个

```js
setInterval(this.timerTask, 1000);
```

似乎是不科学的，也就是说还是需要一个服务端，数据上传，写一个定时任务，然后和微信关联通知，还需要再打开的时候一次性通知用户。

https://www.zhihu.com/question/52719661 这篇文章说了一个清楚。

https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html

如果想要长期订阅 https://developers.weixin.qq.com/community/develop/doc/00008a8a7d8310b6bf4975b635a401

todolist 算是民生吗？。

另外就算需要一个有服务器以及域名，并且支持 https. 或者直接使用微信的云服务。

这个就后面来了。




