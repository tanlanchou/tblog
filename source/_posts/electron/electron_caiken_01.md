---
title: electron url启动, 注册表, 打包
date: 2023-12-7 11:35:00
tags: 
    - electron
    - 环境
    - 打包
---

最近一直在做 electron 项目, 遇到了一些问题, 这里记录一下

### 01. url启动.

首先原生就有方法能够写, 本质上就是在注册表写入.

![自定义协议](https://github.com/tanlanchou/tblog/blob/view/img/Snipaste_2023-12-07_11-41-01.png?raw=true)

上图自定义协议

![软件路径](https://github.com/tanlanchou/tblog/blob/view/img/Snipaste_2023-12-07_11-41-37.png?raw=true)

上图具体软件路径

```js
app.setAsDefaultProtocolClient(protocol[, path, args])
```

> app.setAsDefaultProtocolClient(protocol[, path, args])
> 
> protocol string - The name of your protocol, without ://. For example, if you want your app to handle electron:// links, call this method with electron as the parameter.
> 
> path string (optional) Windows - The path to the Electron executable. Defaults to process.execPath
> 
> args string[] (optional) Windows - Arguments passed to the executable. Defaults to an empty array
Returns boolean - Whether the call succeeded.

其实这个方法是最好的, 因为他不需要其他操作. 你写就好了. 并且跨平台.

但是他有一个缺点, 就是必须软件启动一次以后, 因为他是在你主进程里面, 比如我这个软件就不行, 因为必须支持不打开就能触发.

所以我尝试了另一种方式. `nsis`

```json
"nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": false,
    "include": "./installer.nsh"
},
```

下面是 installer.nsh 内容

```shell
!macro customInstall
  DeleteRegKey HKCR "ipc.vnc.loader"
  WriteRegStr HKCR "ipc.vnc.loader" "" "URL:ipc.vnc.loader"
  WriteRegStr HKCR "ipc.vnc.loader" "URL Protocol" ""
  WriteRegStr HKCR "ipc.vnc.loader\shell" "" ""
  WriteRegStr HKCR "ipc.vnc.loader\shell\Open" "" ""
  WriteRegStr HKCR "ipc.vnc.loader\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend

!macro customUnInstall
  DeleteRegKey HKCR "ipc.vnc.loader"
!macroend
```

就可以了, 这种写法同样万金油, 只是麻烦.

### 02. icon

更改图标, 查了很多资料, 在 **electron-builder.json** 中 win 下面加了 icon 还是会报错, 会使用默认图片.

后来在看这个issue的时候 https://github.com/ElectronNET/Electron.NET/issues/292 给了我启发.

也就是说, 打包以后他其实是在打包下的一个目录. 于是我测试了一下

```json
win: {
    "icon": "../dist/icon.ico"
}
```

解决.


