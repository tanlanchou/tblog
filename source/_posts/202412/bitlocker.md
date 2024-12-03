---
title: bitlocker命令行解锁
date: 2024-12-02 22:47:01
tags: 
    - java
    - bitlocker
    - bash
---

需求是不用命令行或者不能直接点击右键U盘输入密码

因为用户不希望点除这个软件以外的东西.

所以需要在软件内解锁bitlocker

目前4种办法

1. unlocker-bitlocker

最简单的方案, 直接一个powershell 传参解决

缺点, 非专业版没有这玩意儿, 操作系统兼容要先想好.

前提是客户系统支持bitlocker, 并且允许安装, 如果不允许或者系统直接不能安装bitlocker

是不能使用这个方法的

而且还需要支持powershell, 并且允许升级

还有其他类似的方案, 但是前提也都是开启了bitlocker功能

还有一个版本在里面, 不同版本的unlocker-bitlocker 高兼容低

但是低版本无法兼容高版本

```powershell
Get-BitLockerVolumeInternal : The management information stored on the drive contained an unknown type. If you are using an old version of Windows, try accessing the drive from the latest version. (Exception from HRESULT: 0x8031009B) At C:\Windows\system32\WindowsPowerShell\v1.0\Modules\BitLocker\BitLocker.psm1:1198 char:40 + ... umeInternal = Get-BitLockerVolumeInternal -MountPoint $MountPoint[$i] + 
```

1. manage-dbe

两种方案

1. 命令行输入

https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/manage-bde-unlock

也只能命令行输入, 因为 manage-bde -unlock F: -password 不支持 管道输入, 也就是 manage-bde does not support piping passwords

1. 通过秘钥进行恢复

需要用户上传秘钥, 证书等等方式

```powershell
manage-bde -unlock X: -RecoveryPassword <恢复秘钥>
manage-bde -unlock D: -RecoveryPassword 123456-789012-345678-901234-567890-123456-789012-345678

manage-bde -unlock X: -KeyProtector <密钥文件路径>
manage-bde -unlock D: -KeyProtector F:\mykey.bek

manage-bde -unlock X: -Cert

manage-bde -unlock X:

```

上传后, 通过密码或者其他方式关联秘钥, 然后输入解锁

可以做, 但是不支持没绑定过的u盘和只知道密码的u盘

1. 通过windows api 自己写
2. 第三方 目前没有找到免费且支持命令行解锁的