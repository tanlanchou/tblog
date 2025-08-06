---
title: ethercat CIA4.2 运动模式
date: 2025-08-05 09:36:22
tags: 
    - ethercat
    - igh
    - igb
    - 机器人
    - 运动模式
    - CIA4.2
---

# ethercat CIA4.2 运动模式

| 模式值 | 模式名称                                   | 说明                         |
| --- | -------------------------------------- | -------------------------- |
| 1   | Profile Position Mode (PP)             | 位置模式：根据目标位置运动，自动插值。        |
| 3   | Profile Velocity Mode (PV)             | 速度模式：控制目标速度。               |
| 4   | Profile Torque Mode (PT)               | 转矩模式：控制目标转矩。               |
| 6   | Homing Mode                            | 回零模式：通过限位开关或机械基准点进行零点校准。   |
| 7   | Interpolated Position Mode (CSP)       | 插值位置模式：控制器发送插值位置点，实现高精度运动。 |
| 8   | Cyclic Synchronous Velocity Mode (CSV) | 同步速度模式：主站周期性发送速度指令。        |
| 9   | Cyclic Synchronous Torque Mode (CST)   | 同步转矩模式：主站周期性发送转矩指令。        |



一般用的其实就是

PP, PV,CSP,CSV



### 01. 轮廓控制模式(PP)

先说第一种

> 主站写一次目标位置 `0x607A`（Target Position），然后发送启动命令（ControlWord 触发），  
> 驱动器自己“规划路径”，按内部设置的加减速参数运动。



他的意思其实类似于按电梯。

我在1楼，要去11楼。

那么我只是告电梯(从站)我要去10楼（目的地），其他的我不用管





当然速度你也可以进行一些干预

| 对象       | 含义                        | 是否必需         |
| -------- | ------------------------- | ------------ |
| `0x607A` | 目标位置 Target Position      | ✅ 必须         |
| `0x6081` | Profile Velocity（期望速度）    | ✅ 必须（限制最大速度） |
| `0x6083` | Profile Acceleration（加速度） | ✅ 必须         |
| `0x6084` | Profile Deceleration（减速度） | ✅ 必须         |
| `0x6086` | Motion Profile Type（插值曲线） | 可选（线性或梯形）    |

总的来说就是，一开始给一个指令，剩下从站自己解决.





### 02. 轮廓速度模式(PV)

这个模式呢？就是只关注他的速度

> 主站告诉从站一个“目标速度”，从站内部根据给定的加减速值，**平滑地加速到这个速度，并持续转动**。



| 参数   | EtherCAT 对象                   | 含义              |
| ---- | ----------------------------- | --------------- |
| 目标速度 | `0x60FF` Target Velocity      | 要达到的速度（正负值可控方向） |
| 加速度  | `0x6083` Profile Acceleration | 加速时的斜率          |
| 减速度  | `0x6084` Profile Deceleration | 减速时的斜率          |

这个很好理解



### 03. 同步位置(CSP)

他和PP其实类似。

但是他控制的更细

> CSP 模式要求主站在固定周期（通常 1ms）下，持续发送位置点，驱动器只负责执行，不做路径插值。



| 对象       | 名称                        | 类型          | 用途                 |
| -------- | ------------------------- | ----------- | ------------------ |
| `0x6060` | Modes of Operation        | int8        | 写入 `8` → 进入 CSP 模式 |
| `0x6061` | Modes of Op Display       | int8        | 当前运行模式反馈（只读）       |
| `0x607A` | Target Position           | int32       | 每周期写入目标位置          |
| `0x6064` | Position Actual Value     | int32       | 当前实际位置反馈           |
| `0x60C2` | Interpolation Time Period | uint8/int16 | 表示主站周期时间（比如 1ms）   |
| `0x60C4` | Interpolation Time Index  | int8        | 表示插值类型（一般为 0）      |
| `0x6040` | Controlword               | uint16      | 控制状态机，开始/停止        |
| `0x6041` | Statusword                | uint16      | 状态反馈，用于确认伺服就绪      |

也就是说他每个位置都需要自己控制。基本上是1ms一个循环，不停的控制

pp 不会控制这么频繁，可能发一次，及时毫秒甚至更久都不用控制



### 04. 同步速度(CSV)

| 对象       | 名称                    | 类型     | 用途                |
| -------- | --------------------- | ------ | ----------------- |
| `0x6060` | Modes of Operation    | int8   | 设置为 `9` 进入 CSV 模式 |
| `0x6061` | Modes of Op Display   | int8   | 当前运行模式反馈（只读）      |
| `0x60FF` | Target Velocity       | int32  | 每周期写入的目标速度        |
| `0x606C` | Velocity Actual Value | int32  | 实际速度反馈            |
| `0x6040` | Controlword           | uint16 | 控制字（开机、启用等）       |
| `0x6041` | Statusword            | uint16 | 状态字，运行状态反馈        |

同样，和PV的区别就是是否每个周期去控制



### 
