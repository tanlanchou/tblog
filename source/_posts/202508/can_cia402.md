# Can & CIA402

这篇文章是为了梳理整个 **Can** 电机和 **Cia402** 的流程



### 01. 基本的前提 SDO

首先来说就是一些基本的工作要先确定。

比如说你运行这个电机需要走哪些模式？

[ethercat CIA4.2 运动模式](http://blog.callmetommy.cn/2025/08/05/202507/ethercat_yundong_model/) 之前我写了一个这个东西，说了4种常用模式。



比如我需要 **PP** 这种模式

| 对象       | 含义                        | 是否必需         |
| -------- | ------------------------- | ------------ |
| `0x607A` | 目标位置 Target Position      | ✅ 必须         |
| `0x6081` | Profile Velocity（期望速度）    | ✅ 必须（限制最大速度） |
| `0x6083` | Profile Acceleration（加速度） | ✅ 必须         |
| `0x6084` | Profile Deceleration（减速度） | ✅ 必须         |
| `0x6086` | Motion Profile Type（插值曲线） | 可选（线性或梯形）    |



那么我首先需要在控制字中写入

```shell
cansend $INTERFACE "${SDO_ID}#2F60600001000000"
```



如果是 **pv**

```shell
cansend $INTERFACE "${SDO_ID}#2F60600003000000"
```



如果是 **CSP**, 就完全以它作为对象

| 对象       | 名称                        | 类型          | 用途                 |
| -------- | ------------------------- | ----------- | ------------------ |
| `0x6060` | Modes of Operation        | int8        | 写入 `8` → 进入 CSP 模式 |
| `0x6061` | Modes of Op Display       | int8        | 当前运行模式反馈（只读）       |
| `0x607A` | Target Position           | int32       | 每周期写入目标位置          |
| `0x6064` | Position Actual Value     | int32       | 当前实际位置反馈           |
| `0x60C2` | Interpolation Time Period | uint8/int16 | 表示主站周期时间（比如 1ms）   |
| `0x60C4` | Interpolation Time Index  | int8        | 表示插值类型（一般为 0）      |
| `0x6040` | Controlword               | uint16      | 控制状态机，开始/停止        |
| `0x6041` | Statusword                | uint16      | 状态反馈，用于确认伺服就绪      |

首先需要设置

```shell
cansend $INTERFACE "${SDO_ID}#2F60600008000000"
```

另外可以设置 `0x1006` 这个是设置是设置同步周期.

比如我使用 **CSP**， 那么周期就很重要。我使用的 **EYOU** 电机默认值是 0



> [1006]
> ParameterName=Communication Cycle Period
> ObjectType=7
> AccessType=RW
> DataType=0x0007
> PDOMapping=0
> ObjFlags=0x00000000
> DefaultValue=0



还可以设置



```shell
0x607F（最大轮廓速度，上限）
0x6080（最大电机转速，如需）
0x6065（最大跟随误差），0x6067/0x6068（位置窗口/时间）
0x607D:1/2（软限位），0x6085（急停减速）
```



这个主要保护安全边界，可以不设置用默认值。

比如 **EYOU** `0x608` 就没有，自定义了 



> [2025]
> ParameterName=over speed time
> ObjectType=7
> AccessType=RW
> DataType=0x0006
> PDOMapping=0
> ObjFlags=0x00000000
> LowLimit=0
> HighLimit=65536
> DefaultValue=100





### 02. 402 使能三步

* 写 0x0006 → 等 0x6041 到 Ready to switch on

* 写 0x0007 → 等到 Switched on

* 写 0x000F → 等到 Operation enabled

* 故障时先脉冲 Fault reset（Controlword bit7=1），待 0x6041 清故障后再走三步。
  
  

```shell
    # 步骤 2: 尝试故障复位 (新增)
    # 这一步很重要，如果电机处于一个可复位的故障状态，这条指令会清除它。
    echo "[2/5] 尝试发送故障复位指令..."
    # 对象 6040h (Controlword), 写入 0x80
    cansend $INTERFACE "${SDO_ID}#2B40600080000000"
    sleep 0.1 # 等待复位完成

    # 步骤 3: 通过状态机使能电机
    echo "[3/5] 正在使能电机..."
    # 发送 "Shutdown" 指令 (Controlword = 6)
    cansend $INTERFACE "${SDO_ID}#2B40600006000000"
    sleep 0.1
    # 发送 "Switch On" 指令 (Controlword = 7)
    cansend $INTERFACE "${SDO_ID}#2B40600007000000"
    sleep 0.1
    # 发送 "Enable Operation" 指令 (Controlword = 15 or 0x0F)
    cansend $INTERFACE "${SDO_ID}#2B4060000F000000"
    sleep 0.1
```

中间其实可以监控状态字, 当出错的时候

最简单的方式就是写入控制字

```shell
cansend $INTERFACE "${SDO_ID}#2B40600008000000"
```

另外一种就是直接写 0。

我的代码中是直接先复位..



### 03. PDO



```shell
#!/usr/bin/env bash
set -euo pipefail

INTERFACE=can0
NODEID=1

# COB-IDs
RPDO2_ID=$((0x300 + NODEID))   # RPDO2 (maps 0x607A + 0x6081)
SYNC_ID=0x80                   # SYNC

# 周期（微秒），需与 0x1006 一致，例如 1000us=1kHz
PERIOD_US=1000

# 小端32位十六进制
u32le() { printf '%08X' "$1" | sed 's/\(..\)\(..\)\(..\)\(..\)/\4\3\2\1/'; }

# 目标位置生成（示例：匀速递增）
pos=0
step=1000                      # 每周期位置增量（单位按厂商定义）

# 建议：PDO先发→SYNC触发锁存
while true; do
  pos=$((pos + step))
  POS_HEX=$(u32le "$pos")
  VEL_HEX=$(u32le 0)           # RPDO2第二段是0x6081；CSP通常忽略，填0即可

  cansend "$INTERFACE" "$(printf '%03X' "$RPDO2_ID")#${POS_HEX}${VEL_HEX}"
  cansend "$INTERFACE" "$(printf '%03X' "$SYNC_ID")#"

  usleep "$PERIOD_US"          # 若无 usleep，可用: python -c "import time; time.sleep($PERIOD_US/1e6)"
done
```



`RPDO2_ID` 这个虽然我没有在文章中写,  这个是 **CIA402** 中实时性要求比较高，实时传递消息都需要用的

`RPDO` 主站 => 从站

`TPDO` 从站 => 主站



因为我这里只用


