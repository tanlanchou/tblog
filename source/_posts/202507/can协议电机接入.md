---
title: can 电机是否接入
date: 2025-07-21 21:30:22
tags: 
    - can2.0
    - canopen

---

# can协议电机接入

### 01. 接入电机

插好电机，通电，并且和支持can协议那个双绞线接好，高低确认好

这一步我是考硬件的同事完成的.

### 02. 确认是否正确接入

##### 02.01 确认网口是否正常

```bash
ip link show
```

你得有 **can** 协议的网口出现

```bash
3: can0: <NOARP,UP,LOWER_UP,ECHO> mtu 16 qdisc pfifo_fast state UP mode DEFAULT group default qlen 10
    link/can 
4: can1: <NOARP,UP,LOWER_UP,ECHO> mtu 16 qdisc pfifo_fast state UP mode DEFAULT group default qlen 10
    link/can 
```

并且也需要是 up 状态

> up 状态表示该接口**已经被启用**，并且**处于活动状态**

有这个只能表明你有带双通道的CAN接口，CAN控制器驱动应该正常。

还可以再细节的查一下

```shell
ip -details link show can0
ip -details link show can1
```

拿我的返回来说

```shell
user@ak41-ubuntu:~/canopen$ ip -details link show can0
3: can0: <NOARP,UP,LOWER_UP,ECHO> mtu 16 qdisc pfifo_fast state UP mode DEFAULT group default qlen 10
    link/can  promiscuity 0 minmtu 0 maxmtu 0 
    can state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 0 
          bitrate 1000000 sample-point 0.740 
          tq 20 prop-seg 18 phase-seg1 18 phase-seg2 13 sjw 1
          mttcan: tseg1 2..255 tseg2 0..127 sjw 1..127 brp 1..511 brp-inc 1
          mttcan: dtseg1 1..31 dtseg2 0..15 dsjw 1..15 dbrp 1..15 dbrp-inc 1
          clock 50000000 numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 parentbus platform parentdev c310000.mttcan 
user@ak41-ubuntu:~/canopen$ ip -details link show can1
4: can1: <NOARP,UP,LOWER_UP,ECHO> mtu 16 qdisc pfifo_fast state UP mode DEFAULT group default qlen 10
    link/can  promiscuity 0 minmtu 0 maxmtu 0 
    can state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 0 
          bitrate 1000000 sample-point 0.740 
          tq 20 prop-seg 18 phase-seg1 18 phase-seg2 13 sjw 1
          mttcan: tseg1 2..255 tseg2 0..127 sjw 1..127 brp 1..511 brp-inc 1
          mttcan: dtseg1 1..31 dtseg2 0..15 dsjw 1..15 dbrp 1..15 dbrp-inc 1
          clock 50000000 numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535 parentbus platform parentdev c320000.mttcan 
```

**`state ERROR-ACTIVE`** 说明can控制器工作正常

**`berr-counter tx 0 rx 0`** 说没没有错误

**`bitrate 1000000`** 比特率 **1,000,000 bps**

这个很重要，因为我们需要确认电机的比特率是多少，并且这里要同步。

因为电机的波特率可能是另一个值（比如 500kbps, 250kbps 等），所有CAN设备必须使用完全相同的波特率才能通信。

如果明确不一样，需要修改

```shell
# 1. 先关闭can0接口
sudo ip link set can0 down
# 2. 设置新的波特率
sudo ip link set can0 type can bitrate 500000
# 3. 重新打开can0接口
sudo ip link set can0 up
```

 这里只是举个例子

##### 02.02 确认电机是否连接上

确认肯定就需要通信了。

首先需要安装一个东西，才能通过命令行和电机通信

```shell
sudo apt-get update
sudo apt-get install can-utils
```

安装完成就可以开始了

一个终端

```shell
candump any
```

他用来监听所有的信息

然后开另一个终端

```shell
cansend can0 000#0100
```

can 的发送协议里 **[CAN-ID] # [Data]**

**000** 表示系统广播，就是所有的设备都必须监听的

**01** 表示启动远程节点

**00** 表示所有节点

但是我没有收到回复

```shell
user@ak41-ubuntu:~/canopen$     candump any
  can0  000   [2]  01 00
  can1  000   [2]  01 00
  can1  000   [2]  01 00
  can0  000   [2]  01 00
```

这个只能代表我的can接口之间通信没问题, 接口都连接到了同一个CAN总线上, 物理连接没问题.

理论上来说, 我有配置文件之类的东西，我可以确定节点是什么。但是供应商还没有回复我。

所以

```shell
for i in $(seq 1 127); do
  printf "Pinging Node ID %d...\n" "$i"
  # This sends a request to read a standard object (Vendor ID)
  # The CAN ID is 0x600 + the node ID we are trying
  cansend can0 $(printf "%X#4018100000000000" $((0x600 + i)) )
  sleep 0.05  # wait a tiny bit for a response
done
```

这个就是循环去请求不同的**Can-ID**, 让他给我发设备的身份信息

于是得到了一个结果

```shell
  can0  601   [8]  40 18 10 00 00 00 00 00
  can0  581   [8]  4F 18 10 00 04 00 00 00
```

 **4Fh** 是应答码

**18 10 00** 确认地址没问题

**04 00 00 00** 是小端，翻过来 **0x00000004** 

ok. 这里其实就是基本确认了通信成功了，也就是确定了 can 协议的电机连接上了

这个东西是 **CANopen 默认标识符（COB-ID）列表**

https://en.wikipedia.org/wiki/CANopen

### 03. 最最最基本的概念

| 对象   | 比喻     | 用途                 |
| ---- | ------ | ------------------ |
| SDO  | 客户服务柜台 | 配置参数，读写对象字典，准确但慢   |
| PDO  | 大喇叭广播  | 实时数据，传输位置/速度，快但无确认 |
| NMT  | 系统管理员  | 控制网络，启动/停止/复位设备    |
| SYNC | 节拍器    | 同步动作，让所有设备步调一致     |
| EMCY | 急救警报   | 报告故障，设备主动上报严重错误    |

后面我们需要一个SDO, 所以优先知道他的概念

https://www.can-cia.org/can-knowledge/sdo-protocol

> CAN ID: 0x601  （0x600 + NodeID 0x01） ← 发给 node 1 的 SDO 请求
> DLC: 8
> Data:
>    Byte 0: command specifier（控制字节）
>    Byte 1-2: index（对象字典索引，低字节在前）
>    Byte 3: subindex（子索引）
>    Byte 4-7: data（数据，4 字节以内）

详细的命令可以通过这个网站查询，比如我接下来要修改模式 

[List of all Objects &#8212; Synapticon Documentation](https://doc-legacy.synapticon.com/software/44/object_dict/all_objects/index.html#all-objects)

> | [0x6060](https://doc-legacy.synapticon.com/software/44/documentation_html/object_htmls/6060/index.html) | [Modes of operation](https://doc-legacy.synapticon.com/software/44/documentation_html/object_htmls/6060/index.html) |
> | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |

然后详细点进去

| Value | Definition                          |
| ----- | ----------------------------------- |
| -2    | Commutation offset detection mode   |
| -1    | Cogging compensation recording mode |
| +1    | Profile position mode               |
| +3    | Profile velocity mode               |
| +4    | Torque profile mode                 |
| +6    | Homing mode                         |
| +8    | Cyclic sync position mode           |
| +9    | Cyclic sync velocity mode           |
| +10   | Cyclic sync torque mode             |

应该怎么设置大概就知道了。

### 04. 让电机动起来

这个时候就需要电机厂商提供的eds文件了，我测试用的是 EYOU的电机

##### 04.01 进入轮廓速度模式

> [6060]
> ParameterName=Modes of operation
> ObjectType=7
> AccessType=RW
> DataType=0x0002
> PDOMapping=1
> ObjFlags=0x00000000
> DefaultValue=1

然后根据文档

> 轮廓位置模式,profile position mode(1)
> 
> 轮廓速度模式,profile velocity mode(3)
> 
> 轮廓扭矩模式,profile torque mode(4)
> 
> 插补位置模式,interpolated position mode(7)
> 
> 循环同步位置模式,cyclic synchronous position mode(8)
> 
> 循环同步速度模式, cyclic synchronous velocity mode(9)
> 
> 循环同步扭矩模式, cyclic synchronous torque mode(10)

| 操作  | COB-ID       | Byte0(CS) | Byte1(Byte2) | Byte3    | Byte4         | Byte5 | Byte6 | Byte7 |
| --- | ------------ | --------- | ------------ | -------- | ------------- | ----- | ----- | ----- |
| 写   | 0x600+NodeID | 0x23      | index        | subindex | data          |       |       |       |
| 写   | 0x600+NodeID | 0x27      | index        | subindex | data          |       |       | /     |
| 写   | 0x600+NodeID | 0x2B      | index        | subindex | data          |       | /     | /     |
| 写   | 0x600+NodeID | 0x2F      | index        | subindex | data          | /     | /     | /     |
| 返回  | 0x580+NodeID | 0x60      | index        | subindex | -             |       |       |       |
| 返回  | 0x580+NodeID | 0x80      | index        | subindex | aborting code |       |       |       |

那我们用 **CANopen SDO** 命令, 基于 **03** 中的规则, 我们的命令就很清晰了

```shell
601#2F60600003000000
```

那么我们进入了 **轮廓速度模式,profile velocity mode(3)**

##### 04.02 复位故障状态

这一步主要是为了万一上次有错误，先复位

> [6040]
> ParameterName=Controlword
> ObjectType=7
> AccessType=RW
> DataType=0x0006
> PDOMapping=1
> ObjFlags=0x00000000
> DefaultValue=0

这次是两个字节了

| 位 (Bit) | 15-11                 | 10       | 9                       | 8    | 7           | 6-5                     | 4                | 3          | 2              | 1         | 0         |
| ------- | --------------------- | -------- | ----------------------- | ---- | ----------- | ----------------------- | ---------------- | ---------- | -------------- | --------- | --------- |
| 你的缩写    | ms                    | r        | oms                     | h    | fr          | oms                     | eo               | qs         | ev             | so        | so        |
| 完整名称    | Manufacturer Specific | Reserved | Operation Mode Specific | Halt | Fault Reset | Operation Mode Specific | Enable Operation | Quick Stop | Enable Voltage | Switch On | Switch On |
| 中文解释    | 厂商自定义                 | 保留       | 操作模式特定                  | 暂停   | 故障复位        | 操作模式特定                  | 运行使能             | 快速停止       | 电压使能           | 上电        | 上电        |

然后我尝试去复位了他的状态, 大概如下

```shell
${SDO_ID}#2B40600008000000
${SDO_ID}#2B40600006000000
${SDO_ID}#2B40600007000000
${SDO_ID}#2B4060000F000000
```

作为一个玩机器人的前端，刚开始真的懵了。
`0F` 是个十六进制的值，所以这里是 `0000 1111`

所以代表着 上电，电压使能，快速停止

##### 04.03 设置速度转动

| Name            | Index:Sub | Type | Bit Size | Min Data | Max Data | Default Data | Unit | Access    | PDO Mapping           |
| --------------- | --------- | ---- | -------- | -------- | -------- | ------------ | ---- | --------- | --------------------- |
| Target velocity | 0x60FF:0  | DINT | 32       |          |          | 0            | rpm  | readwrite | Receive PDO (Outputs) |

于是

```shell
cansend $INTERFACE "${SDO_ID}#23FF6000${SPEED_HEX}"
```

电机就这么转起来了co
