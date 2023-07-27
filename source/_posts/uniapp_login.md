---
title: uni-app 登录
date: 2023-07-19 23:02:01
tags: 
    - vue
    - 多端
    - uniapp
    - login
---

总是要登录的，每个平台的登录方式都不一样。

h5, app 只需要 token 就可以了，其他小程序，比如wx小程序，就是由他自己的流程，也就是说，如何去统一不同的登录方式？

如何整合，比如我是小程序和app都在使用，那么手机号就是很重要的点，但是尴尬的是，我并没有购买短信发送服务，只是似乎可以都不用短信，而是直接通过平台获取手机号(除了h5)

### 01. 获取手机号

uniapp 一键登录 https://ask.dcloud.net.cn/article/37965

单次收费 0.02

微信小程序 https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html

> 目前该接口针对非个人开发者，且完成了认证的小程序开放（不包含海外主体）；
> 该能力使用时，用户可选择绑定号码，或自主添加号码。平台会基于中国三大运营商提供的短信等底层能力对号码进行验证，但不保证是实时验证；
> 请开发者根据业务场景需要自行判断并选择是否使用，必要时可考虑增加其他安全验证手段。
> 开发者需合理使用，若被发现或用户举报开发者不合理地要求用户提供手机号等个人信息，中断了正常的使用流程，影响了用户的使用体验，微信有权依据《微信小程序平台运营管理规范》对该小程序进行处理。常见违规事例和具体解析；

也就是说个人开发者是无法获取到手机号的，而且必须认证.

而且要收费，单次 0.03

支付宝小程序 https://opendocs.alipay.com/mini/api/getphonenumber

> 目前只支持商家会员卡功能的 alipay.user.info.share（支付宝会员授权信息查询接口）和小程序获取会员手机号功能的 getPhoneNumber 获取用户手机号，其他应用功能暂无法获取敏感信息，详见 用户信息申请流程。

```js
my.getPhoneNumber(Object object)
```

抖音小程序 https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/guide/open-capabilities/acquire-phone-number-acquire/

和微信一个路子，不允许个人开发者使用，只允许企业开发者，并且通过了认证的开发者

看到这里，其实个人开发者通过手机号支持全平台的路子已经很麻烦了，你需要去找没有小程序有企业的朋友或者自己搞一个企业(虽然不贵，但是很麻烦)，而且微信和UNIAPP平台还要收费。

所以这个手机号登录流程暂时放弃了。

### 02. 邮箱登录

发送邮件是免费的，可以直接使用个人的邮箱服务来发送邮件，拿 outlook 举例

https://support.microsoft.com/zh-cn/office/%E4%BB%A5-outlook-com-%E5%8F%91%E9%80%81%E9%99%90%E5%88%B6-279ee200-594c-40f0-9ec8-bb6af7735c2e

每日上限是 5000 封邮件，虽然用户会麻烦一些，但是可以在做商业程序的时候，再一个一个打通通道。

也就是，小程序用户不需要登录，只是需要获取平台的唯一ID. 当有整合需求，比如同时开始使用 app 或者其他小程序平台登录，那么就需要邮箱验证，或者通过 APP 生成token的方式整合。

### 03. 微信登录

这种方式就是暂时不考虑其他小程序平台，但是兼容了APP，微信小程序

### 03. 登录

https://zh.uniapp.dcloud.io/api/plugins/login.html#

https://zh.uniapp.dcloud.io/api/plugins/provider.html

首先看这个，这个是根据程序配置来确定。

比如在微信小程序中，只支持 weixin 登录

```json
provider: ['weixin']
```

在 app 当中，不仅仅可以支持 weixin 登录，还有很多其他登录方式。

```json
provider: [`qq`, `sinaweibo`, `xiaomi`, `univerify`]
```

也就是说 

```js
uni.getProvider({
    service: 'oauth',
    success: (res) => { }
})
```

这个代码是为了获取，当前支持哪些登录方式。

问题在于每个平台，每个登录方式都不一样，所以需要写很多不一样的代码, 所以需要兼容性处理。

举个例子，我现在的代码目前打算完全以微信登录为基准，兼容小程序，在这个基础之上我需要做什么？

```ts
uni.getProvider({
    service: 'oauth',
    success: (res) => {
        if (res.provider.indexOf('weixin') > -1) {
            //这里我确认，支持微信
        }
    },
    fail: (res) => {
        console.log("fail", res)
    }
})
```

接下来就是很奇怪的问题了

https://uniapp.dcloud.net.cn/tutorial/app-oauth-weixin.html

https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html

根据文档他们两都是通过一个临时code，然后通过服务器向微信服务器鉴权，但是我在测试的时候直接拿到了数据

app端 通过微信登录返回数据。

```json
{
    "authResult": {
        "access_token": "",
        "expires_in": 7200,
        "refresh_token": "",
        "openid": "",
        "scope": "",
        "unionid": ""
    },
    "errMsg": "login:ok"
}
```

这里直接拿到了 unionid，难道是因为测试基座的问题？这点现在不得而知，那么先实现以下代码。

首先我有一个用于微信登录的接口 **{{todoUrl}}/users/login/wx/dsadas**

然后这个时候就需要 http 请求的接口了。

### http请求

**uniapp** 本身有 `http.request`, 文档在这里 https://uniapp.dcloud.net.cn/api/request/request.html#

当然也可以使用其他请求框架，比如 `axios`.

```ts
import whiteList from './whiteList';

let ajaxTimes = 0;
const timeout = 10000;
const baseUrl = 'http://localhost:3000'

interface requestOptions {
	url : string;
	header? : any;
	method : "POST" | "GET" | "PUT" | "DELET",
	data? : any; 
}

const myRequest = (options : requestOptions) : Promise<any> => {
	let header = { ...options.header };
	if (whiteList.indexOf(options.url) === -1) {
		header["token"] = uni.getStorageSync('token');
	}

	ajaxTimes++;
	uni.showLoading({
		title: "加载中..",
		mask: true,
	});
	return new Promise((resolve, reject) => {
		uni.request({
			url: baseUrl + options.url,
			method: options.method || 'POST',
			data: options.data || {},
			timeout: timeout,
			header,
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				reject(err)
			},
			complete: () => {
				ajaxTimes--;
				if (ajaxTimes === 0) {
					//  关闭正在等待的图标
					uni.hideLoading();
				}
			}
		})
	})
}
export default myRequest
```







https://uniapp.dcloud.net.cn/api/plugins/login.html#getuserinfo

https://uniapp.dcloud.net.cn/api/plugins/login.html#getuserprofile