---
title: uni-app 引用插件
date: 2023-07-18 22:02:01
tags: 
    - vue
    - 多端
    - uniapp
    - 插件
---

主要是需要一个UI组件，选择使用这个 https://github.com/FirstUI/FirstUI，插件的安装方式也在上面

安装以后测试一下

https://uniapp.dcloud.net.cn/collocation/pages.html#style
https://doc.firstui.cn/docs/started.html

```js
// 下载安装时easycom配置
"easycom": {
		"autoscan": true,
		"custom": {
			"fui-(.*)": "@/components/firstui/fui-$1/fui-$1.vue"
		}
	}

// 使用npm安装时easycom配置（配置完成后重新编译运行）
"easycom": {
		"autoscan": true,
		"custom": {
			"fui-(.*)": "firstui-uni/firstui/fui-$1/fui-$1.vue"
		}
	}

```

然后引用成功