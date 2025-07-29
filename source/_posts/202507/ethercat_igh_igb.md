---
title: ethercat igb模式 无法发现从站
date: 2025-07-29 14:28:01
tags: 
    - ethercat
    - igh
    - igb
    - 机器人
---





# ethercat igb模式 无法发现从站



### 01. 原理

其实之前就讲过了

> * Generic 模式: EtherCAT 主站像一个普通应用程序一样，通过 Linux 内核标准的网络协议栈（raw socket）来收发数据包。内核的 igb 驱动在工作，但它之上还有整个网络层。
> 
> * igb 模式（原生驱动模式）: EtherCAT 主站需要完全绕过 Linux 内核的网络协议栈，直接控制 igb 网卡硬件。为了实现这一点，它必须首先将内核中标准的 igb 驱动从 eth4 接口上“踢掉”，然后由 EtherCAT 自己的模块来接管。



### 02. 分析

首先在同样的配置下，我使用 Generic 模式 已经跑通了。 7个电机转了起来.

所以不存在什么网口问题，从站问题



其次他的现象是

```shell
root@ak41-ubuntu:/home/user/ethercat#     ethercat master
Master0
  Phase: Waiting for device(s)...
  Active: no
  Slaves: 0
  Ethernet devices:
    Main: c4:83:72:12:1d:78 (waiting...)
      Link: DOWN
```



并且

```shell
root@ak41-ubuntu:/home/user/ethercat#     dmesg
[ 8232.014835] systemd-journald[365]: Successfully sent stream file descriptor to service manager.
[ 8234.707024] EtherCAT: Master driver 1.6.6 1.6.6-5-g64899015
[ 8234.707289] EtherCAT: 1 master waiting for devices.
[ 8234.732129] ec_igb: Intel(R) Gigabit Ethernet Network Driver (EtherCAT enabled)
[ 8234.732138] ec_igb: Copyright (c) 2007-2014 Intel Corporation.
[ 8237.265485] systemd-journald[365]: Successfully sent stream file descriptor to service manager.
```

内核日志没错，系统日志也没错。

整个人有点儿不好了。



因为我绑定的是 **eth4**

所以

```shell
ethtool -i eth4

user@ak41-ubuntu:~/myethcat$ ethtool -i eth4
driver: igb
version: 5.15.148-rt-tegra
firmware-version: 3.25, 0x800005d0
expansion-rom-version: 
bus-info: 0005:07:00.0
supports-statistics: yes
supports-test: yes
supports-eeprom-access: yes
supports-register-dump: yes
supports-priv-flags: yes
```

这个时候就很明确错误在哪里了

```shell
driver: igb
```

因为这种模式其实是需要 EtherCAT 主站直接接管网口

但是没有，也就是说 EtherCAT 接管失败了



### 02. 临时的解决方案

```shell
ethtool -i eth4 | grep bus-info

sudo sh -c 'echo "0000:04:00.0" > /sys/bus/pci/drivers/igb/unbind'
```

这样去屏蔽网卡，让系统不知道这个东西.

这样就算你 

```shell
ifconfig
```

你会发现没有了 `eth4`

有一点需要注意，在 ethercat 1.6.x 版本中，是允许网卡名和mac地址在配置中的

**但是要执行这个是不能用网卡名的，他会报错说找不到这个网卡 eth4**

只能提前配置好mac地址.



那么 `igb` 就接管成功了。

```shell
root@ak41-ubuntu:/home/user/myethcat# ethercat slaves
0  0:0  PREOP  +  EYOU_ServoModule_ECAT_V143
1  0:1  PREOP  +  EYOU_ServoModule_ECAT_V143
2  0:2  PREOP  +  EYOU_ServoModule_ECAT_V143
3  0:3  PREOP  +  EYOU_ServoModule_ECAT_V143
4  0:4  PREOP  +  EYOU_ServoModule_ECAT_V143
5  0:5  PREOP  +  MT_Device
```



### 03. 终极解决方案

可惜，目前没有。

按照我的理解，ethercat 通过sudo去运行就应该拿到控制权，而不是通过自己的拿。

尝试简单看了下 ethercat 启动脚本，也没有做任何相关的事情。

并且网上查了下，也没人遇到类似的问题...

就算遇到其实也是内核配置问题

```shell
CONFIG_IGB=y
```

这个没写之类的



但是这个 `CONFIG_IGB=y` 提醒了我

这玩意儿似乎是被直接搞在内核里了，所以可能导致 `ethercat` 内部代码无法去抢夺控制权。

所以需要重新编译一个 `CONFIG_IGB=m` 

后续有更新再来把.



### 04. 目前的解决方案

就是开机把你要的网口


```shell
ethtool -i eth4 | grep bus-info
sudo sh -c 'echo "0000:04:00.0" > /sys/bus/pci/drivers/igb/unbind'
```

通过脚本绑定上去，然后就可以临时解决了。甚至可以说是永久解决。


### 05. 更新


`CONFIG_IGB=m` 有效，不会再出现这个问题。

只是没有测试，这个选项的副作用，是否会导致其他问题。 后续在测试吧