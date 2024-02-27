---
title: 前端请求模拟
date: 2023-12-7 14:25:00
tags: 
    - 前端
    - axios-mock-adapter
---

这个迭代后端很麻烦, 所以接口不太可能第一时间提供给我.

于是我先开会约定了接口, 就开始找网上的模拟解决办法.

## 要求

1. 能够模拟请求
2. 能够模拟数据

模拟的原因很简单, 我不想后端来了我又需要改很多代码.

所以最好的方式就是其他都一样, 只是请求的具体代码变一下.

简单的方式自己写 `settimeout`, 然后 `promise` 封装一下. 

但是我怕我想不全, 而且网上应该有轮子, 于是找到了它

`axios-mock-adapter`

模拟请求搞定了, 还要模拟数据, 这一步其实可以不用. 如果要使用的话 `Mock.js` 我简单测试了一下也够用了.

## axios-mock-adapter

[npm: axios-mock-adapter](https://www.npmjs.com/package/axios-mock-adapter)

他好用的点在于它可以直接拦截, 不入侵你原有的代码, 你原有的代码该怎么写就怎么写

```tsx
if (process.env.NODE_ENV === 'development') {
  Promise.all([import('axios-mock-adapter'), import('@/api/system')]).then(results => {
    const MockAdapter = results[0].default
    const mock = new MockAdapter(service)
    const systemApi = results[1].default

    mock.onGet(systemApi.getSystemVerify).reply(200, { code: 0, data: { machineCode: 'djalksdjlaksjd123111sda' } })
    mock.onPost(systemApi.getSystemUpload).reply(config => {
      const data = config.data

      // 检查是否有文件被上传
      if (data.has('file')) {
        // 获取上传的文件
        const file = data.get('file')
        return [200, { code: 0, data: { expireDate: '2025-01-01 11:22:33', mateMaxNum: 100 } }]
      } else {
        return [500, { error: 'No file provided' }]
      }
    })
    mock.onAny().passThrough()
  })
}
```

我就是在请求的位置加了一段代码.

上传和获取的接口就被我模拟了, 其他地方正常写

这段代码的逻辑就是,  当遇到 `systemApi.getSystemVerify` 和 `systemApi.getSystemUpload` 这两个 **API** 的时候拦截, 其他 **pass**

这是他最常用最简单的功能

他还有各种玩法, 比如模拟网络超时, 网络错误, 正则匹配路径, 甚至还可以做单元测试.

这种在定了接口但是没有API的时候太好用.