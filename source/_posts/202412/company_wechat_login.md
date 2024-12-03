---
title: 企业微信登录流程
date: 2024-12-03 22:47:01
tags: 
    - 企业微信
    - javascrip
---

使用登录的前提是，你配置好了回调，信任域名之类的。

## 01. 开始

https://developer.work.weixin.qq.com/document/path/91335

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/c58c4e60-4e7d-412f-8331-564f16cae57b/9131eeda-181c-4487-9edd-557f14553944/image.png)

这个是企业微信给的一张图

也就是说 客户端重定向 ⇒ 微信企业后台 ⇒ 返回 code state ⇒ 客户端 code state ⇒ 自己后台 ⇒ 后台到企业微信后台 ⇒ 返回用户信息 ⇒ 返回用户信息到客户端

这种应该就是静默获取用户信息。

## 获取 code 和 state

https://developer.work.weixin.qq.com/document/path/91022

> https://open.weixin.qq.com/connect/oauth2/authorize?appid=CORPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_base&state=STATE&agentid=AGENTID#wechat_redirect
> 

按照上面的流程图上面，这一步是不需要自己的后台参与的，但是还是需要传 [`REDIRECT_URI`](https://open.weixin.qq.com/connect/oauth2/authorize?appid=CORPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_base&state=STATE&agentid=AGENTID#wechat_redirect) 

理由是需要验证 参数 `CORPID` 和 `REDIRECT_URI` 的合法性

`REDIRECT_URI`  需要是你配置那个域名，我这边使用的是前端地址，你要用后端也行。

```
const redirectUri = encodeURIComponent(window.location.href);
const weChatAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=STATE&agentid=#wechat_redirect`;
window.location.href = weChatAuthUrl;
```

这样服务就会传给你类似这种连接

```
http://api.3dept.com/cgi-bin/query?action=get&code=AAAAAAgG333qs9EdaPbCAP1VaOrjuNkiAZHTWgaWsZQ&state=
```

所以上面的代码他会一直刷新页面，所以这里需要判断是否是在企业微信环境

```
navigator.userAgent.toLowerCase().match(/wxwork/i) == "wxwork"
```

然后写一个判断即可

## 后端消费code

[获取访问用户身份 - 文档 - 企业微信开发者中心 (qq.com)](https://developer.work.weixin.qq.com/document/path/91023)

> https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=ACCESS_TOKEN&code=CODE
> 

需要先获取 `ACCESS_TOKEN`

https://developer.work.weixin.qq.com/document/path/91023#15074

[获取access_token - 文档 - 企业微信开发者中心 (qq.com)](https://developer.work.weixin.qq.com/document/path/91039)

> https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=ID&corpsecret=SECRET
> 

这个后端就好写了。

无非几个请求，唯一觉得神奇的是

```
https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=" + accessToken + "&userid="
                + userId;
```

还是能请求部分用户信息，按理说静默只能获取 `userid` 啊, 不过不重要。

代码通了，不过需要处理用户直接刷新的问题

## 网页登录

这个方案是不需要，但是查的时候顺便测试了一下，也可以，场景就是不在企业微信的环境里，通过扫描登录。

前端

```
        const urlParams = new URLSearchParams(window.location.search);
        const user = urlParams.get('user');
        if (user) {
            // 假设user是一个JSON字符串，可以解析它
            const parsedUser = JSON.parse(decodeURIComponent(user));
            this.$store.commit('setUser', parsedUser);
        } else {
            // 重定向到企业微信认证
            const redirectUri = encodeURIComponent(`${window.location.origin}/wechat/callback`);
            const weChatAuthUrl = `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=wwd93305cfd28429fb&agentid=1000025&redirect_uri=${redirectUri}&state=STATE`;
            window.location.href = weChatAuthUrl;
        }
```

这个 redirectUri  必须是后端的

后端会接收一个 `code`，然后通过 `code + access_token` 获取用户信息，然后生成token或者用户信息，然后做一个浏览器的重定向给前端。

代码量其实差别不大，甚至代码差别也不大

这个方案的问题在于信息直接 **get** 传很丑陋, 虽然这玩意儿也不是什么秘密. 毕竟你 **F12** 或者拦截也能看得到，但是直接 **url** 里面传还是…

## 最后

https://developer.work.weixin.qq.com/document/path/90315#%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%B0%83%E8%AF%95

企业微信可以调试，详情见连接.

这点我觉得比钉钉好多了。