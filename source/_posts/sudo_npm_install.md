---
title: 为什么 npm install 需要 sudo
date: 2023-08-27 11:13:01
tags: 
    - linux
    - npm
---

其实以前我在linxu下开发都是直接

```shell
sudo npm install
```

但是有时候会遇到一个问题，在运行

```shell
npm start 
```

或者其他命令的时候会遇到 `permission` 问题, 这个时候我一般选用两种解决办法

```shell
sudo npm install
sudo chmod -R 755 /path/to/your/project/node_modules
```

问题解决。

但是这次我想知道是为什么，这些问题原因都是因为我必须 `sudo npm install` 导致的, 那么为什么需要 `sudo`

### 01. 为什么需要 sudo

正常只是访问，安装当前项目是不需要 sudo 的，但是有一个东西是全局的，就是全局安装的东西

```
npm install xxx -g
```

你项目中可能有一些依赖，一些共享的东西，在安装过程中就遇见了。

然而全局安装一般安装地址是在 `/usr/local` 这种系统目录下，所以需要 `sudo`

### 02. 解决办法

就是移动全局安装包的位置

https://blog.csdn.net/m0_59757074/article/details/130893787

我查看了这篇文章

```shell
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
source ~/.bashrc
```

搞定。