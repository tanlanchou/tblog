---
title: ethercat igh 安装流程
date: 2025-07-28 13:28:01
tags: 
    - ethercat
    - igh
    - arm
    - 机器人
---

# ethercat igh 安装流程



用这个你可以不用dc，但是如果你不用dc 其实场景就很小了，默认还是要用dc的。

所以注意自己是不是实时核。



### 01 安装流程

```shell
$ sudo apt-get install mokutil
$ mokutil --sb-state
```

这个是必须的

> Etherlab is a kernel module that is not signed by default. To allow the kernel to load unsigned modules, you need to disable secure boot.
> 
>  Etherlab 是一个默认未签名的内核模块。为了让内核能够加载未签名的模块，您需要禁用安全启动



Secure Boot 是一个安全特性，它的作用是防止操作系统加载没有经过数字签名的驱动程序或内核模块，以保护系统免受恶意软件的侵害。

所以先确认一下

如果结果是

```shell
SecureBoot enabled
```

就需要去 `BIOS` 里面改，然后重复这个步骤



```shell
$ sudo apt-get update
$ sudo apt-get upgrade
$ sudo apt-get install git autoconf libtool pkg-config make build-essential net-tools automake 
```



接下来安装 **EtherCat Master**

```shell
$ git clone https://gitlab.com/etherlab.org/ethercat.git
$ cd ethercat
$ ./bootstrap  # to create the configure script
```

这个有1.5 和 1.6 可选，建议统一用1.6.x 版本的

1.6.x 对于环境的要求更低，支持更多的系统，并且原生适配各种实时内核，不需要补丁，而且我看文档的时候记得好像增加了动态帧管理。



```shell
$ ./configure --prefix=/usr/local/etherlab --disable-8139too --disable-eoe --enable-generic --enable-igb

$ make all modules
$ sudo make modules_install install
$ sudo depmod
```



这里有个概念需要说明

> --enable-generic：通用模式。为了兼容性，性能较差，延迟高，实时性不确定。
> 
> --enable-igb：专用驱动模式。为了高性能，延迟极低，实时性好，是生产环境的首选。



正常 ethercat 模式, 他走的是 标准的 Linux 网络协议栈 => 网卡驱动

igb 模式是直接跟网卡硬件进行数据读写，理论上因为不走协议栈了，通信延迟会更低。

实际上，ethercat 现成应该都用的是 **igb**，因为网口多。



```shell
$ sudo ln -s /usr/local/etherlab/bin/ethercat /usr/bin/
$ sudo ln -s /usr/local/etherlab/etc/init.d/ethercat /etc/init.d/ethercat
$ sudo mkdir -p /etc/sysconfig
$ sudo cp /usr/local/etherlab/etc/sysconfig/ethercat /etc/sysconfig/ethercat
```



配置

```shell
$ sudo vim /etc/udev/rules.d/99-EtherCAT.rules
```

然后加入下面

```shell
KERNEL=="EtherCAT[0-9]*", MODE="0666"
```



就是告诉 **udev**， **EtherCAT[0-9]*** 所有人都可以读写

然后接下来是 ethercat 的配置

```shell
sudo vim /usr/local/etherlab/etc/sysconfig/ethercat
```

配网口和模式

```vim
MASTER0_DEVICE="eth4"
DEVICE_MODULES="igb"
```



这个时候就可以启动了

```shell
sudo /etc/init.d/ethercat start //Starting EtherCAT master 1.6.6  done
```







打工告成，后续要让他跑起来。估计要学一些东西了。










