---
title: electron sudo 以及管理员权限
date: 2025-08-06 15:54:18
tags: 
    - electron
    - 前端
    - sudo
    - 管理员权限
---

# electron sudo 以及管理员权限

很多时候你难免会用到这个东西。

比如我正在写的东西，他需要调整这个程序的优先级，比如他需要访问网口，他调用的c代码需要 `sudo`

windows 也一样，难免需要访问需要权限的目录

这个时候问题就来了，你如果获取权限？



### 01. 整个sudo

这个很麻烦，首先就是 `electron` 反对整个 `sudo`



##### 01.01 --no-sandbox

我在linux下使用首先第一个点就是需要加  `--no-sandbox`

相当于关闭了  `Chromium` 沙箱隔离机制。

这玩意儿有什么用呢？

理论上现在 渲染进程 和 主进程是隔离的对吧？这个就是取消隔离的，你取消那么渲染进程和主进程就有一样的权限，如果用户想到办法插入到吗，任何bug，或者你有第三方的网页程序之类的

他就有可能会直接攻击到你的程序，你的电脑对吧。



##### 01.02 图形界面访问问题

我发创建界面。发现不行

因为你登录的用户是 **user**, 但是 `sudo` 是 **root**, **root**用户没有权限在 **user** 用户的 `display server`

```shell
xhost +SI:localuser:root  # 允许 root 访问当前显示服务器
sudo DISPLAY=:0 XAUTHORITY=/home/your_user/.Xauthority electron
```



##### 01.03 环境变量丢失的问题

**root** 用户和 **user** 用户的环境变量是不一致的, 举个例子

**root** 用户可能连 **npm** 都没有，你开发的时候就没法调试, 你还得装两个.

还有一些其他的环境变量

```shell
sudo -E
```

当然你可以通过这个传递



##### 01.04 用户目录问题

这个无需多言，你只能固定目录安装后者指定**root**安装



### 02. 解决方案



##### 02.01 pkexec

他的优势是他有gui图形， **由系统弹出**标准 GUI 认证窗口

```javascript
const { exec } = require('child_process');
exec('pkexec bash -c ....', ...);
```

他的好处是原生的，linux 原生直接支持。



##### 02.02 electron-sudo

他和 `pkexec` 一样 但是他跨平台， 他在linux下调用的也是 `pkexec`



##### 02.03 前两种方案的缺点

问题是他们都有一个缺点，因为他们的密码是不缓存的，就是说你一次要启用5个命令，那么他需要弹5次。

这个是很蛋疼的事情。



对于用户来说，他可能只能接受1次, 并且后续再也不能再弹了，经常弹会死人的。



##### 02.04 守护进程

需要高权限的东西，让另一个东西来做。然后和他通信，来解决这个问题

比如我用 `pkg` 或者 直接用 **nodejs** 绿色版 写一个 **nodejs** 程序

是使用 **02.01** 或者 **02.02** 的方式

```javascript
exec("pkexec /xxx/xxx/xxx")
```

我启动了他以后，就可以和他通信了对吧。比如 `scoket` 比如其他通信协议。

那么就实现了一次授权，多次使用。

只是关闭的时候需要同时关闭进程，并且为了安全性，通信最好加密对吧。



##### 02.05 setuid

这也是我目前使用的方法。

```shell
sudo chown root:root myhelper
sudo chmod 4755 myhelper
```

同样实现了高权限调用。

思路是和守护进程一个路子，我给他提权

```shell
#!/bin/bash

INSTALL_DIR="/opt/myapp"

chown root:root "$INSTALL_DIR/myhelper"
chmod 4755 "$INSTALL_DIR/myhelper"
echo "SUID 设置完成"
```



然后进入程序判断是否已经有 `SUID` 如果没有，那么

```javascript
exec('pkexec /opt/myapp/setup-root.sh', (error, stdout, stderr) => {
  if (error) {
    console.error(`提权失败: ${error.message}`);
    return;
  }
  console.log(`提权成功: ${stdout}`);
});
```



### 03. 总结

主要还是用 **守护进程** 和 `setuid` 的方式

在这种方式之下相对简单的解决问题。



当然还有其他方式，不过都是需要系统配合.

linux 可以通过 systemd 来进行提权

/etc/polkit-1/rules.d/50-myapp.rules 也可以，当用户请求权限时根据规则来.




还有一些特殊的权限 Udev

总之是根据你的需要的权限来，虽然给 `root` 最省事儿，但是也最危险, 不是所有需求都需要 `root` 权限，需要分析情况



windows 也是，你可以创建服务，定时任务等等方式去绕过




