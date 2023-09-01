---
title: windows docker 安装遇到的坑
date: 2023-08-29 16:00:01
tags: 
    - docker
    - windows
    - update
---

公司电脑 docker windows 安装完成以后, 打开docker报错, wsl报错

于是命令行查看 wsl --list 发现安装了 wsl, 只是没有分发版本

那就安装呗, 于是遇到了第一个问题

**microsoft store 打不开, 一直转圈**

于是各种查资料, 比如改 dns, 改网络设置, 改一系列的, 加代理也不行.

搞的沉默了.

于是算了直接命令行安装吧

```shell
wsl -d Ubuntu-20.04
```

能下载, 但是安装报错, 还是 WSL 报错, 真的沉默了.

于是为了解决问题, 继续查为什么 WSL 不行, 试一试 

```shell
wsl --update
```

结果无法启动, 为什么无法启动, google一查, 是因为 windows update 没有打开.

以为问题解决了, 结果无法打开, 因为没有权限..

直接注册表也不行 

**HKEY_LOCAL_MACHINESYSTEMCurrentControlSetServicesWaaSMedicSvc**

没有 wuauserv 完全控制权限。

根源是权限来源不对，改成对应权限组就ok了

详情可以看下这篇文章 

https://www.bilibili.com/read/cv11939860/

允许 update 以后， 商店也能打开了。

解决