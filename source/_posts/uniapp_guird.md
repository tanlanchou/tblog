---
title: uni-app 引导图和广告
date: 2023-07-18 23:02:01
tags: 
    - vue
    - 多端
    - uniapp
    - guid
---

### 01. 缓存

https://uniapp.dcloud.net.cn/api/storage/storage.html#clearstorage

> H5端为localStorage，浏览器限制5M大小，是缓存概念，可能会被清理
> App端为原生的plus.storage，无大小限制，不是缓存，是持久化的
> 各个小程序端为其自带的storage api，数据存储生命周期跟小程序本身一致，即除用户主动删除或超过一定时间被自动清理，否则数据都一直可用。
> 微信小程序单个 key 允许存储的最大数据长度为 1MB，所有数据存储上限为 10MB。
> 支付宝小程序单条数据转换成字符串后，字符串长度最大200*1024。同一个支付宝用户，同一个小程序缓存总上限为10MB。
> 百度小程序策略详见、抖音小程序策略详见
> 非App平台清空Storage会导致uni.getSystemInfo获取到的deviceId改变

在 h5 端，每个其实不一样，反正不能存大东西, 如果想要多端兼容，建议还是有服务器，别在这里存东西。

- uni.setStorage
- uni.setStorageSync
- uni.getStorage
- uni.getStorageSync
- uni.getStorageInfo
- uni.getStorageInfoSync
- uni.removeStorage
- uni.removeStorageSync
- uni.clearStorage
- uni.clearStorageSync

具体的自己看文档.

为什么要知道这个？引导页面或者开场的广告需要判断显示，是否需要每次都显示，如果不是第一次怎么显示之类的。

### 02. 有哪些设置项？

manifest.json 中，第一个 **等待首页渲染完毕后再关闭Splash图**

https://uniapp.dcloud.net.cn/tutorial/app-splashscreen.html#

> 勾选“等待首页渲染完毕后再关闭Splash图”，表示需要等待首页渲染完成后再关闭启动界面
> 不勾选“等待首页渲染完毕后再关闭Splash图”，则表示首页加载完成后就会关闭启动界面，此时首页可能没有完成渲染，在部分设备可能>会闪一下白屏，不推荐使用。



```json
"splashscreen": {               //可选，JSON对象，splash界面配置
    "alwaysShowBeforeRender": true,     //可选，Boolean类型，是否等待首页渲染完毕后再关闭启动界面
    "autoclose": true,                  //可选，Boolean类型，是否自动关闭启动界面
    "waiting": true,                    //可选，Boolean类型，是否在程序启动界面显示等待雪花
    "event": "loaded",                  //可选，字符串类型，可取值titleUpdate、rendering、loaded，uni-app项目已废弃
    "target": "defalt",                 //可选，字符串类型，可取值default、second，uni-app项目已废弃
    "dealy": 0,                         //可选，数字类型，延迟自动关闭启动时间，单位为毫秒，uni-app项目已废弃
    "ads": {                            //可选，JSON对象，开屏广告配置
        "backaground": "#RRGGBB",               //可选，字符串类型，格式为#RRGGBB，开屏广告背景颜色
        "image": ""                             //可选，字符串类型，底部图片地址，相对应用资源目录路径
    },
    "androidTranslucent": false         //可选，Boolean类型，使用“自定义启动图”启动界面时是否显示透明过渡界面，可解决点击桌面图标延时启动应用的效果
},
"app-plus": {
    "splashscreen": {               //可选，JSON对象，splash界面配置
        "alwaysShowBeforeRender": true,     //可选，Boolean类型，是否等待首页渲染完毕后再关闭启动界面
        "autoclose": true,                  //可选，Boolean类型，是否自动关闭启动界面
        "waiting": true,                    //可选，Boolean类型，是否在程序启动界面显示等待雪花
        "event": "loaded",                  //可选，字符串类型，可取值titleUpdate、rendering、loaded，uni-app项目已废弃
        "target": "defalt",                 //可选，字符串类型，可取值default、second，uni-app项目已废弃
        "dealy": 0,                         //可选，数字类型，延迟自动关闭启动时间，单位为毫秒，uni-app项目已废弃
        "ads": {                            //可选，JSON对象，开屏广告配置
            "backaground": "#RRGGBB",               //可选，字符串类型，格式为#RRGGBB，开屏广告背景颜色
            "image": ""                             //可选，字符串类型，底部图片地址，相对应用资源目录路径
        },
        "androidTranslucent": false         //可选，Boolean类型，使用“自定义启动图”启动界面时是否显示透明过渡界面，可解决点击桌面图标延时启动应用的效果
    },
}
```

### 03. swiper

https://uniapp.dcloud.net.cn/component/swiper.html

> 一般用于左右滑动或上下滑动，比如banner轮播图。
> 
> 注意滑动切换和滚动的区别，滑动切换是一屏一屏的切换。swiper下的每个swiper-item是一个滑动切换区域，不能停留在2个滑动区域之间。

### 04. 引导图

首先需要明白，如果要兼容小程序，不能有超过200k的静态资源，如果需要就智能第三方或者base64显示。

https://blog.csdn.net/ITold/article/details/124660256

base64 又可能造成文件过大的问题，所以还是自己服务器或者图床最理想。

所以我使用 docker 安装了一个图床 https://hub.docker.com/r/halcyonazure/lsky-pro-docker

于是有了这5张图片

http://60.205.227.108:8089/i/2023/07/18/64b65e55b284e.jpg
http://60.205.227.108:8089/i/2023/07/18/64b65e5652a1a.jpg
http://60.205.227.108:8089/i/2023/07/18/64b65e56d5b91.jpg
http://60.205.227.108:8089/i/2023/07/18/64b65e576749e.jpg
http://60.205.227.108:8089/i/2023/07/18/64b65e58a16df.jpg

现在可以开始引导

```html
<template>
	<view style="height: 100%;">
		<swiper class="swiper" circular
			:duration="duration">
			<swiper-item>
				<view>
				</view>
			</swiper-item>
			<swiper-item>
				<view>
				</view>
			</swiper-item>
			<swiper-item>
				<view>
				</view>
			</swiper-item>
		</swiper>
		<button class="skipButton">跳过</button>
	</view>
</template>
```

这里需要铺满，所以加入样式

```css
.swiper {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0px;
    bottom: 0px;
    z-index:10
}

.swiper img {
    height: 100%;
    width: 100%;
}
```

button 右上角

```css
.skipButton {
    position: fixed;
    top: 20px;
    /* 将 bottom 改为 top */
    right: 20px;
    padding: 10px 20px;
    background-color: #888;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    z-index: 999;
}
```

加入轮播的指示

```html
indicator-dots="true"
```

增加点击跳过的事件

```html
        <!-- ... -->
        <button class="skipButton" @click="skip">跳过</button>
	</view>
</template>

<script setup>
	const skip = function() {
		uni.redirectTo({
			url: '/pages/index/index'
		});
	}
</script>
```

当用户划过第三张图片的时候，也要跳过，所以需要绑定事件

https://uniapp.dcloud.net.cn/component/swiper.html

本来想实现一个右滑进入的，但是有点麻烦，虽然有思路，但是麻烦，所以划到第三张图片1秒后，自动跳转。

```js
@change="swiperChange"
const swiperChange = function(event) {
    if(event.detail.current === 2) {
        setTimeout(() => {
            skip();
        }, 1000)
    }		
}
```

这样，引导页面就ok了，回到首页

```js
const value = uni.getStorageSync('launchFlag');
if (value) {
    // 如何已经有，直接去home首页
    uni.switchTab({
        url: '/pages/index/index'
    });
} else {
    // 没有值，跳到引导页，并存储，下次打开就不会进去引导页
    uni.setStorage({
        key: 'launchFlag',
        data: true
    });
    uni.redirectTo({
        url: '/pages/index/guide'
    });
}
```

这个代码放在 `onLoad` 当中，就成型了。

### 05. 广告

广告就是同样的思路，只是很多广告不需要多张图，所以不需要 `swiper`

所以需要的是什么？

一张图片带有连接和按钮

```html
<template>
	<view class="coverAd" style="height: 100%;">
		<img src="..." />
	</view>
	<button class="skipButton" @click="skip">跳过({{timeCount}})</button>
</template>

<script setup>
	import {
		ref
	} from "vue";

	const timeCount = ref(5);

	const to = () => {
		uni.redirectTo({
			url: '/pages/index/index'
		});
	}

	const skip = () => {
		if (!!t) {
			clearInterval(t);
			t = null;
			console.log('t:', t)
		}
		to();
	}

	let t = setInterval(() => {
		if (timeCount.value > 0) {
			timeCount.value--;
		} else {
			skip();
		}
	}, 1000)

	setTimeout(() => {
		if (!!t) {
			clearInterval(t);
			to();
		}
	}, 7000);
</script>

<style>
	.coverAd {
		height: 100%;
		width: 100%;
		position: absolute;
		top: 0px;
		bottom: 0px;
		z-index: 10
	}

	.coverAd img {
		height: 100%;
		width: 100%;
	}

	.skipButton {
		position: fixed;
		top: 20px;
		/* 将 bottom 改为 top */
		right: 20px;
		padding: 10px 20px;
		background-color: #888;
		color: #fff;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
		z-index: 999;
	}
</style>
```

暂时没有连接，但是我希望这张图能动一下。

```css
@keyframes scaleIn {
    0% {
        transform: scale(1);
    }

    100% {
        transform: scale(1.2);
    }
}

.animate-scale {
    animation: scaleIn 6s infinite alternate;
    transform-origin: center center;
}
```

### 06. 其他的修正

引导轮播图也需要加入倒计时，所以需要考虑代码如何复用。

新建一个组件，封装一下

```vue
<template>
	<button class="skipButton" @click="skip">{{txtName}}({{timeCount}})</button>
</template>

<script setup>
	import {
		ref,
		defineProps
	} from "vue";

	const props = defineProps({
		delay: {
			type: Number,
			required: false, 
			default: 5, 
		},
		jump: {
			type: String,
			required: true, 
		},
		txtName: {
			type: String,
			required: false, 
			default: "跳过"
		},
	});

	const {
		delay,
		jump,
		txtName
	} = props;

	const timeCount = ref(delay);

	const to = () => {
		uni.redirectTo({
			url: jump
		});
	}

	const skip = () => {
		if (!!t) {
			clearInterval(t);
			t = null;
			console.log('t:', t)
		}
		to();
	}

	let t = setInterval(() => {
		if (timeCount.value > 0) {
			timeCount.value--;
		} else {
			skip();
		}
	}, 1000)

	setTimeout(() => {
		if (!!t) {
			clearInterval(t);
			to();
		}
	}, 7000);
</script>

<style>
	.skipButton {
		position: fixed;
		top: 20px;
		/* 将 bottom 改为 top */
		right: 20px;
		padding: 10px 20px;
		background-color: #888;
		color: #fff;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
		z-index: 999;
	}
</style>
```

但是这个存在一个问题，就是如果页面自行跳转，比如引导页，那么中间是没有停止参数的，那么还需要和组件进行通信。

vue 组件通信有很多方法, 反正就是通信停止或者外部不要跳转。

