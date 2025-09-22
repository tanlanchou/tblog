---
title: CIA402 SDO
date: 2025-09-21 23:30:22
tags: 
    - canopen
    - 机器人
    - cia402
    - SDO
---

# CIA402 SDO



### 01. 基本信息

| 对象   | 比喻     | 用途                 |
| ---- | ------ | ------------------ |
| SDO  | 客户服务柜台 | 配置参数，读写对象字典，准确但慢   |
| PDO  | 大喇叭广播  | 实时数据，传输位置/速度，快但无确认 |
| NMT  | 系统管理员  | 控制网络，启动/停止/复位设备    |
| SYNC | 节拍器    | 同步动作，让所有设备步调一致     |
| EMCY | 急救警报   | 报告故障，设备主动上报严重错误    |

SDO = Service Data Object（服务数据对象)。

他的目的是读写对象字典。



> SDO 是请求-响应模式：Master 发请求 → Slave 解析 → Slave 响应 → Master 接收 → 完成。每个操作都要等待应答。

他能做什么呢？

比如你一开始要确定电机状态，使能3步？你一开始要电机走什么模式？

总是就是初始化配置类，就走SDO。

配置完 `SDO`，`SDO` 会把部分字段映射成 `PDO` 能访问的, 让 `PDO` 能改，所以看起来，他们有些重叠，其实改的是不一眼的东西

他的好处是稳定，可靠，但是比 `PDO` 慢,  这里有一个表格对比可以看下.



| 特性   | PDO               | SDO          |
| ---- | ----------------- | ------------ |
| 实时性  | 高                 | 低            |
| 确认机制 | 无                 | 有            |
| 数据长度 | 1~8 字节            | 1~4 GB（可分段）  |
| 数据类型 | 通常是过程数据（位置/速度/IO） | 配置/参数/对象字典数据 |
| 传输效率 | 高                 | 低            |
| 触发方式 | 同步/异步             | 请求/响应        |



### 02. SDO 的写法

下面的表格是一些基础信息

| 操作   | COB‑ID       | Byte0(CS) | Byte1  | Byte2  | Byte3    | Byte4..7       |
| ---- | ------------ | --------- | ------ | ------ | -------- | -------------- |
| 写4B  | 0x600+NodeID | 0x23      | index低 | index高 | subindex | data4B         |
| 写3B  | 0x600+NodeID | 0x27      | index低 | index高 | subindex | data3B + 1B 填0 |
| 写2B  | 0x600+NodeID | 0x2B      | index低 | index高 | subindex | data2B + 2B 填0 |
| 写1B  | 0x600+NodeID | 0x2F      | index低 | index高 | subindex | data1B + 3B 填0 |
| 成功应答 | 0x580+NodeID | 0x60      | index低 | index高 | subindex | 0x00 × 4       |
| 失败应答 | 0x580+NodeID | 0x80      | index低 | index高 | subindex | 4B Abort Code  |

| 操作    | COB‑ID       | Byte0(CS) | Byte1  | Byte2  | Byte3    | Byte4..7       |
| ----- | ------------ | --------- | ------ | ------ | -------- | -------------- |
| 读请求   | 0x600+NodeID | 0x40      | index低 | index高 | subindex | 0x00 × 4       |
| 读应答4B | 0x580+NodeID | 0x43      | index低 | index高 | subindex | data4B         |
| 读应答3B | 0x580+NodeID | 0x47      | index低 | index高 | subindex | data3B + 1B 填0 |
| 读应答2B | 0x580+NodeID | 0x4B      | index低 | index高 | subindex | data2B + 2B 填0 |
| 读应答1B | 0x580+NodeID | 0x4F      | index低 | index高 | subindex | data1B + 3B 填0 |
| 失败应答  | 0x580+NodeID | 0x80      | index低 | index高 | subindex | 4B Abort Code  |

他告诉了我们第一个问题

就是 `SDO` 写是 `0x600` ，读取是 `0x580`

`COD-ID` 是 **读写 + NodeID**

之前讲过， `COD-ID` 是对于 **canopen** 仲裁协议的一个决定性规则，由他来确定从站是显性还是隐性。

NodeId 修改起来比较麻烦，参考 [http://blog.callmetommy.cn/2025/08/11/202508/can_arbitration/](http://blog.callmetommy.cn/2025/08/11/202508/can_arbitration/)

目前我暂时没考虑折腾 `LSS`

| 字节  | 内容   | 含义         | 说明                                                      |
| --- | ---- | ---------- | ------------------------------------------------------- |
| 0   | 0x23 | CCS + n    | **Command Specifier**：0x23 表示写 4 字节（expedited transfer） |
| 1   | 0x40 | Index 低字节  | 对象字典索引低 8 位 → 0x6040 的低字节 0x40                          |
| 2   | 0x60 | Index 高字节  | 对象字典索引高 8 位 → 0x6040 的高字节 0x60                          |
| 3   | 0x00 | SubIndex   | 子索引 → 0（控制字一般只有一个 SubIndex）                             |
| 4   | 0x01 | Data Byte0 | 数据最低字节 → 小端序最低位，控制字 = 1                                 |
| 5   | 0x00 | Data Byte1 | 数据次低字节 → 控制字高 8 位                                       |
| 6   | 0x00 | Data Byte2 | 数据高 16\~23 位 → 对 32 位对象填充                               |
| 7   | 0x00 | Data Byte3 | 数据最高字节 → 对 32 位对象填充                                     |



```shell
cansend can0 605#240600001000000
```

这是一个例子.

1. **CCS + n** 为什么是 `2F` 或者 `23` 之类的，在上麦你已经解释过了。

2. Index 低字节 这个需要你用到的，比如 `6040` 我要改状态字，他对应就是 6040, 然后这边是小端。

3. Index 高字节

4. SubIndex 这个需要自己查

剩下的就是数据



写就是这么写

### 03. 配置PDO

一般来说 PDO 是厂家默认的，但是你查 `eds` 文档

```shell
[2002]
ParameterName=MotorPara
ObjectType=7
AccessType=RW
DataType=0x0007
PDOMapping=1
ObjFlags=0x00000000
DefaultValue=0
```

当这个 PDOMapping = 1 的时候，表示他是可以配置的

这个时候你可以用 `SDO` 去配置它，当然 `PDO` 也是可以。只是如果你区分功能在配置的时候做这件事儿，那么就用 `SDO` 去做。



```shell
# 禁用 RPDO1（0x1400:01 = 0x80000205）
cansend can0 605#2300140105020080
# 传输类型=255（事件驱动）
cansend can0 605#2F001402FF000000
# 清映射计数
cansend can0 605#2F00160000000000
```

类似这样。



| PDO 编号    | Communication Parameter Index | Mapping Parameter Index |
| --------- | ----------------------------- | ----------------------- |
| **RPDO1** | 0x1400                        | **0x1600**              |
| **RPDO2** | 0x1401                        | **0x1601**              |
| **RPDO3** | 0x1402                        | **0x1602**              |
| **RPDO4** | 0x1403                        | **0x1603**              |



那这里就需要具体讲讲了

```shell
cansend can0 605#2300140105020080   # 0x1400:1 禁用，COB-ID=0x205
cansend can0 605#2F00140201000000   # 0x1400:2 传输类型=1（同步）
cansend can0 605#2F00160000000000   # 0x1600:0 = 0（清映射）
cansend can0 605#2300160110004060   # 0x1600:1 = 0x6040:00, 16b
cansend can0 605#2300160208006060   # 0x1600:2 = 0x6060:00, 8b
cansend can0 605#2F00160002000000   # 0x1600:0 = 2（两项）
cansend can0 605#2300140105020000   # 0x1400:1 使能，COB-ID=0x205

```

我这里做了什么呢？

我设置我的 **RPDO1** 只需要2个参数，**6040** 和 **6060**.

我们来对应一下

**6040** 是控制字

**6060** 是模式



所以说**PDO**应该怎么传？

```shell
cansend can0 205#0F0008
```
