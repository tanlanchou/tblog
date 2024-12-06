---
title: jwt实现原理
date: 2024-12-05 22:47:01
tags: 
    - jwt
    - 原理
---

## 前言

虽然我是一个全栈，但是我居然一直没写过jwt。

因为我真的没有从头到尾，从前端到后端去负责过一个项目，全部自己做

以至于我犯了一个低级错误，认为token，也就是jwt生成的token是可以延长时间的。

哈哈哈哈哈，很尴尬

## JWT 的基本机制

JWT（JSON Web Token）是一种用于身份验证和信息交换的开放标准。它的基本机制如下：

1. 组成：JWT 由三部分组成 - 头部（Header）、载荷（Payload）和签名（Signature）
2. 生成：服务器在用户登录成功后创建 JWT
3. 传递：服务器将 JWT 返回给客户端
4. 存储：客户端存储 JWT（通常在本地存储或 Cookie 中）
5. 使用：客户端在后续请求中携带 JWT（通常在 Authorization 头中）
6. 验证：服务器验证 JWT 的有效性和完整性

## 后端怎么做？或者说jwt原理是什么？

一般是引入第三方包。

原理的话，我一开始以为是存储。后面发现不是

因为看了源码`@nestjs/jwt`是用 HS256

也就是通过那个字符串加密解密解决问题

所以创建，刷新，验证，其实是一种加密算法，减小了存储的压力，但是计算的压力？

所以也就不存在延长某个token的登录时间，因为一旦生成就是固定的。

所以，你自己写也不是不行。

## 怎么刷新？

无非就是前端和后端谁做。一般是后端做

就是请求的时候，验证token之后返回新token

但是这个时间就很玩味了

他频繁的请求，你每次都刷新很浪费。

我一般是超过1个小时，继续请求就刷新token

反正你了解了机制，按照你的需求考虑吧

## 前端接入 JWT

前端接入 JWT 的基本步骤如下：

1. 登录：发送用户凭证到服务器，获取 JWT
2. 存储：将获取的 JWT 存储在本地（如 localStorage 或 sessionStorage）
3. 请求拦截：使用 Axios 等库设置请求拦截器，自动在每个请求的 header 中添加 JWT
4. 响应处理：处理 401（未授权）错误，可能需要刷新 token 或重新登录
5. 登出：清除存储的 JWT

示例代码（使用 Axios）：

```jsx
// 存储 JWT
const storeJWT = (token) => {
  localStorage.setItem('jwt', token);
};

// 获取 JWT
const getJWT = () => {
  return localStorage.getItem('jwt');
};

// 设置请求拦截器
axios.interceptors.request.use(config => {
  const token = getJWT();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 处理响应
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      // 处理未授权错误，如刷新 token 或重定向到登录页
    }
    return Promise.reject(error);
  }
);

// 登出
const logout = () => {
  localStorage.removeItem('jwt');
  // 重定向到登录页或首页
};
```

注意：JWT 是无状态的，服务器不能主动使其失效。因此，通常设置较短的过期时间并使用刷新 token 机制来平衡安全性和用户体验。

## 总结

thx