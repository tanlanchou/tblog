---
title: ethercat 运行电机代码流程解析
date: 2025-10-20 16:05:05
mathjax: true
tags: 
    - ethercat
    - CIA402
    - robot
---

# ethercat 运行电机代码流程解析


### 前提
目前是C开发的代码，基于ethercat 1.6.x 版本使用

到现在为止没有发现 1.6.x 不兼容的情况。

明确不兼容 1.5.x



### 前提配置
```cpp
//通过索引连接 ethercat主站
ec_master_t *master = ecrt_request_master(master_index);

//创建域，PDO 的过程数据通道
ec_domain_t *domain = ecrt_master_create_domain(master);
```
输入索引，创建域



### 获取主站和从站的基本信息
```cpp
//ethercat/include/ecrt.h
typedef struct {
    unsigned int slave_count; /**< Number of slaves in the network. */
    unsigned int link_up : 1; /**< \a true, if the network link is up. */
    uint8_t scan_busy; /**< \a true, while the master is scanning the network.
                        */
    uint64_t app_time; /**< Application time. */
} ec_master_info_t;

ec_master_info_t master_info;
if (ecrt_master(master, &master_info)) {}
 size_t num_slaves = master_info.slave_count;

//获取从站信息
//对象信息如下
//ethercat/include/ecrt.h
typedef struct {
    uint16_t position; /**< Offset of the slave in the ring. */
    uint32_t vendor_id; /**< Vendor-ID stored on the slave. */
    uint32_t product_code; /**< Product-Code stored on the slave. */
    uint32_t revision_number; /**< Revision-Number stored on the slave. */
    uint32_t serial_number; /**< Serial-Number stored on the slave. */
    uint16_t alias; /**< The slaves alias if not equal to 0. */
    int16_t current_on_ebus; /**< Used current in mA. */
    struct {
        ec_slave_port_desc_t desc; /**< Physical port type. */
        ec_slave_port_link_t link; /**< Port link state. */
        uint32_t receive_time; /**< Receive time on DC transmission delay
                                 measurement. */
        uint16_t next_slave; /**< Ring position of next DC slave on that
                               port.  */
        uint32_t delay_to_next_dc; /**< Delay [ns] to next DC slave. */
    } ports[EC_MAX_PORTS]; /**< Port information. */
    uint8_t al_state; /**< Current state of the slave. */
    uint8_t error_flag; /**< Error flag for that slave. */
    uint8_t sync_count; /**< Number of sync managers. */
    uint16_t sdo_count; /**< Number of SDOs. */
    char name[EC_MAX_STRING_LENGTH]; /**< Name of the slave. */
} ec_slave_info_t;

//具体的获取方法
if (ecrt_master_get_slave(master, i, &info[i]) < 0)
{
    LOG_ERROR("未找到从站 %zu，请检查连接\n", i);
    ecrt_release_master(master);
    return 1;
}
```
这一步其实也是获取基本信息。有几个从站，能拿到主站和从站的对象



### 从站的基本配置
```cpp
//配置从站, 这一步只是“拿到从站配置句柄”。返回值就是一个 ec_slave_config_t*，后续你再用它去做 PDO/SDO/DC 等配置
//下面是对象
struct ec_slave_config {
    struct list_head list; /**< List item. */
    ec_master_t *master; /**< Master owning the slave configuration. */

    uint16_t alias; /**< Slave alias. */
    uint16_t position; /**< Index after alias. If alias is zero, this is the
                         ring position. */
    uint32_t vendor_id; /**< Slave vendor ID. */
    uint32_t product_code; /**< Slave product code. */

    uint16_t watchdog_divider; /**< Watchdog divider as a number of 40ns
                                 intervals (see spec. reg. 0x0400). */
    uint16_t watchdog_intervals; /**< Process data watchdog intervals (see
                                   spec. reg. 0x0420). */

    ec_slave_t *slave; /**< Slave pointer. This is \a NULL, if the slave is
                         offline. */

    ec_sync_config_t sync_configs[EC_MAX_SYNC_MANAGERS]; /**< Sync manager
                                                   configurations. */
    ec_fmmu_config_t fmmu_configs[EC_MAX_FMMUS]; /**< FMMU configurations. */
    uint8_t used_fmmus; /**< Number of FMMUs used. */
    uint16_t dc_assign_activate; /**< Vendor-specific AssignActivate word. */
    ec_sync_signal_t dc_sync[EC_SYNC_SIGNAL_COUNT]; /**< DC sync signals. */

    struct list_head sdo_configs; /**< List of SDO configurations. */
    struct list_head sdo_requests; /**< List of SDO requests. */
    struct list_head soe_requests; /**< List of SoE requests. */
    struct list_head voe_handlers; /**< List of VoE handlers. */
    struct list_head reg_requests; /**< List of register requests. */
    struct list_head soe_configs; /**< List of SoE configurations. */
    struct list_head flags; /**< List of feature flags. */
    struct list_head al_timeouts; /**< List of specific AL state timeouts. */

#ifdef EC_EOE
    ec_eoe_request_t eoe_ip_param_request; /**< EoE IP parameters. */
#endif

    ec_coe_emerg_ring_t emerg_ring; /**< CoE emergency ring buffer. */
};

//下面是具体操作方法
sc[i] = ecrt_master_slave_config(master, info[i].alias, info[i].position, info[i].vendor_id, info[i].product_code);
```
这里其实是创建了从站的配置.



### PDO
这里开始就比较关键了。

有两种方式可以拿到从站的配置信息

1. ethercat xml -p -m

```xml
user@ak41-ubuntu:~$ ethercat xml -m3 -p0
<?xml version="1.0" ?>
<EtherCATInfo>
  <!-- Slave 0 -->
  <Vendor>
    <Id>4247</Id>
  </Vendor>
  <Descriptions>
    <Devices>
      <Device>
        <Type ProductCode="#x00002406" RevisionNo="#x0000008f">EYOU_ServoModule_V143</Type>
        <Name><![CDATA[EYOU_ServoModule_ECAT_V143]]></Name>
        <Sm Enable="1" StartAddress="#x1000" ControlByte="#x26" DefaultSize="128" />
        <Sm Enable="1" StartAddress="#x1100" ControlByte="#x22" DefaultSize="128" />
        <Sm Enable="1" StartAddress="#x1200" ControlByte="#x64" DefaultSize="20" />
        <Sm Enable="1" StartAddress="#x1300" ControlByte="#x20" DefaultSize="14" />
        <RxPdo Sm="2" Fixed="1" Mandatory="1">
          <Index>#x1600</Index>
          <Name>csp/csv/cst RxPDO</Name>
          <Entry>
            <Index>#x6040</Index>
            <SubIndex>0</SubIndex>
            <BitLen>16</BitLen>
....
```
他就会把从站的ESI信息给你，你就可以完全按照这个来操作.

但是... 这里有一个坑。

首先这是是不全的，他只是厂商的默认的。

有的厂商默认的比较好，有的厂商默认的比较差。所以光看这个是看运气的。

因为之前想要做一个通过 ESI文件自适应，让电机能直接跑的工具。

直接上了 `ethercat xml`  导致了后续的很多问题，目前都还没有去修改回ESI文件，因为没时间



另外就是有些电机厂商对于ESI文件分的比较细，按照我的想法，所有都允许传就行了，我遇见过最极端的分了30多个...

为什么真多个我不理解，ESI文件都给我看的脑袋疼。



所以建议还是第二种方法.



**ESI文件分析**

这个我已经写了一篇ESI文件简单结构和内容的文章, 需要的可以查一下

基本开发基本ok，但是需要Ethercat官方那个文件，需要边搞边查.



我就拿我其中一台来举例子了

[https://blog.callmetommy.cn/2025/08/05/202507/ethercat\_yundong\_model/](https://blog.callmetommy.cn/2025/08/05/202507/ethercat_yundong_model/)

这个是我之前写的文章

现在我列出EYOU电机的ESI部分

```xml
<RxPdo Fixed="0" Sm="2">
	<Index DependOnSlot="true">#x1600</Index>
	<Exclude>#x1601</Exclude>
	<Exclude>#x1602</Exclude>
	<Name LcId="1033">Outputs</Name>
	<Entry>
		<Index DependOnSlot="true">#x6040</Index>
		<SubIndex>0</SubIndex>
		<BitLen>16</BitLen>
		<Name LcId="1033">Control Word</Name>
		<Comment>object 0x6040:0</Comment>
		<DataType>UINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x607A</Index>
		<SubIndex>0</SubIndex>
		<BitLen>32</BitLen>
		<Name LcId="1033">Target Position</Name>
		<Comment>object 0x607A:0</Comment>
		<DataType>DINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x60FF</Index>
		<SubIndex>0</SubIndex>
		<BitLen>32</BitLen>
		<Name LcId="1033">Target Velocity</Name>
		<Comment>object 0x60FF:0</Comment>
		<DataType>DINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x6071</Index>
		<SubIndex>0</SubIndex>
		<BitLen>16</BitLen>
		<Name LcId="1033">Target Torque</Name>
		<Comment>object 0x6071:0</Comment>
		<DataType>INT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x6060</Index>
		<SubIndex>0</SubIndex>
		<BitLen>8</BitLen>
		<Name LcId="1033">Mode Of Operation</Name>
		<Comment>object 0x6060:0</Comment>
		<DataType>SINT</DataType>
	</Entry>
	<Entry>
		<Index>#x0</Index>
		<SubIndex>0</SubIndex>
		<BitLen>8</BitLen>
	</Entry>
</RxPdo>
<TxPdo Fixed="0" Sm="3">
	<Index DependOnSlot="true">#x1a00</Index>
	<Exclude>#x1a01</Exclude>
	<Exclude>#x1a02</Exclude>
	<Name LcId="1033">Inputs</Name>
	<Entry>
		<Index DependOnSlot="true">#x6041</Index>
		<SubIndex>0</SubIndex>
		<BitLen>16</BitLen>
		<Name LcId="1033">Status Word</Name>
		<Comment>object 0x6041:0</Comment>
		<DataType>UINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x6064</Index>
		<SubIndex>0</SubIndex>
		<BitLen>32</BitLen>
		<Name LcId="1033">Actual Position</Name>
		<Comment>object 0x6064:0</Comment>
		<DataType>DINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x606C</Index>
		<SubIndex>0</SubIndex>
		<BitLen>32</BitLen>
		<Name LcId="1033">Actual Velocity</Name>
		<Comment>object 0x606C:0</Comment>
		<DataType>DINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x6077</Index>
		<SubIndex>0</SubIndex>
		<BitLen>16</BitLen>
		<Name LcId="1033">Actual Torque</Name>
		<Comment>object 0x6077:0</Comment>
		<DataType>INT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x6061</Index>
		<SubIndex>0</SubIndex>
		<BitLen>8</BitLen>
		<Name LcId="1033">Mode Of OperationDisplay</Name>
		<Comment>object 0x6061:0</Comment>
		<DataType>SINT</DataType>
	</Entry>
	<Entry>
		<Index DependOnSlot="true">#x603F</Index>
		<SubIndex>0</SubIndex>
		<BitLen>16</BitLen>
		<Name LcId="1033">Error Code</Name>
		<Comment>object 0x603F:0</Comment>
		<DataType>UINT</DataType>
	</Entry>
	<Entry>
		<Index>#x0</Index>
		<SubIndex>0</SubIndex>
		<BitLen>8</BitLen>
	</Entry>
</TxPdo>
```
一步一步来

```xml
<Sm DefaultSize="20" StartAddress="#x1200" ControlByte="#x64" Enable="1">Outputs</Sm>
<Sm DefaultSize="14" StartAddress="#x1300" ControlByte="#x20" Enable="1">Inputs</Sm>
```
这个单位是字节，所以是

`RxPDO` 是 160bit

`TxPDO` 是 112bit



第一步列出所需要的数据

```cpp
static ec_pdo_entry_info_t eyou_pdo_entries[] = {
    // RxPDO-1 (Total 160 bits / 20 bytes)
    {0x6040, 0x00, 16}, // Control Word
    {0x607A, 0x00, 32}, // Target Position
    {0x60FF, 0x00, 32}, // Target Velocity
    {0x6071, 0x00, 16}, // Target Torque
    {0x6060, 0x00, 8},  // Modes of Operation
    {0x0000, 0x00, 56}, // Padding

    // TxPDO-1 (Total 112 bits / 14 bytes)
    {0x6041, 0x00, 16}, // Status Word
    {0x6064, 0x00, 32}, // Position Actual Value
    {0x606C, 0x00, 32}, // Velocity Actual Value
    {0x6077, 0x00, 16}, // Torque Actual Value
    {0x6061, 0x00, 8},  // Modes of Operation Display
    {0x603F, 0x00, 8}   // Error Code (恢复为8-bit)
};
```
唯一需要注意的是 

```cpp
{0x0000, 0x00, 56}, // Padding
```
160 - 16 - 32 - 32 - 16 - 8 = 56.

剩下的其实是从 ESI 文件照搬下来的。

继续

```cpp
static ec_pdo_info_t eyou_pdos[] = {
    {0x1600, 6, eyou_pdo_entries + 0}, // RxPDO
    {0x1A00, 6, eyou_pdo_entries + 6}  // TxPDO
};

static ec_sync_info_t eyou_syncs[] = {
    {0, EC_DIR_OUTPUT, 0, NULL, EC_WD_DISABLE},
    {1, EC_DIR_INPUT, 0, NULL, EC_WD_DISABLE},
    {2, EC_DIR_OUTPUT, 1, eyou_pdos + 0, EC_WD_ENABLE},
    {3, EC_DIR_INPUT, 1, eyou_pdos + 1, EC_WD_DISABLE},
    {0xff}
};

// 实现函数，返回静态的syncs数组
ec_sync_info_t* get_eyou_syncs(void) {
    return eyou_syncs;
}
```
这里是重新组织了一下

你可以理解为最后的结果类似于

```javascript
eyouSyncs = [
  { index: 0, dir: "output", pdos: [], watchdog: "disable" },
  { index: 1, dir: "input", pdos: [], watchdog: "disable" },
  { index: 2, dir: "output", pdos: [{ index: 0x1600, entries: eyouPdoEntries.slice(0, 6) }], watchdog: "enable" },
  { index: 3, dir: "input", pdos: [{ index: 0x1A00, entries: eyouPdoEntries.slice(6, 12) }], watchdog: "disable" }
];
```


ok. 我有东西了，那就告诉从站，我会怎么传数据

```cpp
 LOG_INFO("MT电机 (从站 %zu) 配置PDO\n", i);
 if (ecrt_slave_config_pdos(sc[i], EC_END, get_mt_syncs()))
 {
	LOG_ERROR("MT电机 (从站 %zu) 配置PDO失败\n", i);
	ecrt_release_master(master);
	return 1;
}
```
讲一个特殊的

```cpp
else if (info[i].vendor_id == VENDOR_ID_TAISHAN && info[i].product_code == PRODUCT_CODE_TAISHAN) {
             LOG_INFO("TAISHAN电机 (从站 %zu) 配置PDO\n", i);
             if (ecrt_slave_config_pdos(sc[i], EC_END, get_taishan_syncs()))
             {
                LOG_ERROR("TAISHAN电机 (从站 %zu) 配置PDO失败\n", i);
                ecrt_release_master(master);
                return 1;
            }
             // 在 PREOP 通过 SDO 设定模式为 CSP
             if (ecrt_slave_config_sdo8(sc[i], 0x6060, 0x00, OP_MODE_CSP)) {
                 LOG_ERROR("TAISHAN电机 (从站 %zu) 设置SDO 0x6060 失败\n", i);
             }
        }
```
ecrt\_slave\_config\_sdo8 这个就是没有InitCmd的后果.





### DC设置
```cpp
    //配置分布式时钟 (DC)
    LOG_INFO("配置分布式时钟 (DC)...\n");
    for (size_t i = 0; i < num_slaves; i++)
    {
        if (ecrt_slave_config_dc(sc[i], 0x0300, CYCLE_TIME_NS, 2 * CYCLE_TIME_NS / 3, 0, 0) != 0)
        {
            LOG_ERROR("从站 %zu 配置分布式时钟失败\n", i);
            ecrt_release_master(master);
            return 1;
        }
    }
    LOG_INFO("配置分布式时钟成功\n");

    // **新增：选择此从站作为总线的参考时钟**
    LOG_INFO("选择参考时钟...\n");
    if (ecrt_master_select_reference_clock(master, sc[0]))
    {
        LOG_ERROR("选择参考时钟失败\n");
        ecrt_release_master(master);
        return 1;
    }
    else
    {
        LOG_INFO("选择参考时钟成功\n");
    }
```
```xml
<OpMode>
	<Name>DC</Name>
	<Desc>DC-Synchron</Desc>
	<AssignActivate>#x300</AssignActivate>
	<CycleTimeSync0 Factor="1">0</CycleTimeSync0>
	<ShiftTimeSync0>0</ShiftTimeSync0>
	<CycleTimeSync1 Factor="1">0</CycleTimeSync1>
</OpMode>
```
这里讲一下参数

```cpp
ecrt_slave_config_dc(sc[i], 0x0300, CYCLE_TIME_NS, 2 * CYCLE_TIME_NS / 3, 0, 0)
ecrt_slave_config_dc(从站配置对象, ESI文件AssignActivate, SYNC0 的周期(我设置的是一毫秒
), SYNC0 的相位偏移，相对于周期起点的时间偏移（可为负, SYNC1 的周期, SYNC1 的相位偏移)
```
这里其实是我的知识盲点

> SYNC0 的相位偏移，相对于周期起点的时间偏移（可为负

```Plain Text
时间 →
0                 t_send            φ0(SYNC0)                  T
|------------------|------------------|-------------------------|
  收包→计算→发包          前余量 M_pre=φ0−t_send        后空档 M_post=T−φ0
说明：
- 相位偏移 φ0：本周期内 SYNC0 发生的时刻（由 sync0_shift 决定）。
- 前余量 M_pre：你完成发送到 SYNC0 到来之间的空档。只要 M_pre > 0（且留安全裕量），
  本圈输出会在本圈的 SYNC0 被从站锁存/应用。


时间 →
0                             φ0(SYNC0)         t_send             T
|------------------------------|------------------|-----------------|
  收包→计算→发包耗时过长          （本圈已错过）         发送完成太晚→晚一圈生效

下一周期（k+1）：
T                      T+φ0(SYNC0)
|----------------------|
此时才在下一圈的 SYNC0 锁存/应用上一圈发出的输出
```


### ecrt\_domain\_reg\_pdo\_entry\_list
之前的

* ecrt\_slave\_config\_pdos：配置“从站硬件发什么/收什么”（线上布局）。
* ecrt\_domain\_reg\_pdo\_entry\_list：配置“主站本地怎么访问它们”（内存偏移）。



```cpp
// EYOU电机PDO注册
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6040, 0, &off_control_word[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x607A, 0, &off_target_position[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x60FF, 0, &off_target_velocity[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6071, 0, &off_target_torque[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6060, 0, &off_modes_of_operation[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6041, 0, &off_status_word[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6064, 0, &off_position_actual_value[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x606C, 0, &off_velocity_actual_value[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6077, 0, &off_torque_actual_value[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x6061, 0, &off_modes_of_operation_display[i]};
domain_regs[reg_idx++] = (ec_pdo_entry_reg_t){info[i].alias, info[i].position, VENDOR_ID_EYOU, PRODUCT_CODE_EYOU, 0x603F, 0, &off_error_code[i]};
```
其实就是按照

```xml
static ec_pdo_entry_info_t eyou_pdo_entries[] = {
    // RxPDO-1 (Total 160 bits / 20 bytes)
    {0x6040, 0x00, 16}, // Control Word
    {0x607A, 0x00, 32}, // Target Position
    {0x60FF, 0x00, 32}, // Target Velocity
    {0x6071, 0x00, 16}, // Target Torque
    {0x6060, 0x00, 8},  // Modes of Operation
    {0x0000, 0x00, 56}, // Padding

    // TxPDO-1 (Total 112 bits / 14 bytes)
    {0x6041, 0x00, 16}, // Status Word
    {0x6064, 0x00, 32}, // Position Actual Value
    {0x606C, 0x00, 32}, // Velocity Actual Value
    {0x6077, 0x00, 16}, // Torque Actual Value
    {0x6061, 0x00, 8},  // Modes of Operation Display
    {0x603F, 0x00, 8}   // Error Code (恢复为8-bit)
};
```
去注册.

需要注册的是 &off\_error\_code\[i\], 基本都是偏移的值，后续循环的时候需要使用。

```cpp
ecrt_domain_reg_pdo_entry_list(domain, domain_regs)
```
最后给主站注册这些地址.



### 一些核心配置
```cpp
    // 设置实时调度策略
    struct sched_param param = {};
    param.sched_priority = sched_get_priority_max(SCHED_FIFO);
    if (sched_setscheduler(0, SCHED_FIFO, &param) == -1) {
        perror("error: sched_setscheduler failed");
        // Don't exit. This can fail if the user is not root.
    }

    // **新增：锁定内存，防止分页（swapping）导致的延迟**
    LOG_INFO("锁定内存...\n");
    if (mlockall(MCL_CURRENT | MCL_FUTURE) == -1) {
        perror("error: mlockall failed");
    }

    // **新增：将进程绑定到单个CPU核心以提高实时确定性**
    int core_to_bind = 3; // 默认核心
    if (argc > 4) {
        char* endptr;
        long core_long = strtol(argv[4], &endptr, 10);
        if (endptr == argv[4] || *endptr != '\0' || core_long < 0) {
            LOG_ERROR("无效的CPU核心号 '%s'。将使用默认核心 %d。\n", argv[4], core_to_bind);
        } else {
            core_to_bind = (int)core_long;
        }
    }

    LOG_INFO("将进程绑定到CPU核心%d...\n", core_to_bind);
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(core_to_bind, &cpuset); // 使用变量
    if (sched_setaffinity(0, sizeof(cpu_set_t), &cpuset) == -1) {
        perror("error: sched_setaffinity failed");
    }
```
这些其实主要是为了提高系统的实时性。

按需取用即可，甚至你可以不用。



### 激活主站
```cpp
crt_master_activate(master)
```


### 过程数据指针
```cpp
uint8_t *domain_pd = ecrt_domain_data(domain)
```
用`domain_pd` + 之前注册得到的偏移 off\_，在实时循环里直接读/写 PDO 条目。



### 开始循环
```cpp
    LOG_INFO("设置初始应用时间...\n");
    struct timespec wakeupTime;
    clock_gettime(CLOCK_MONOTONIC, &wakeupTime);
```
初始化时间



```cpp
    unsigned int cycle_counter = 0;
    int32_t initial_position[num_slaves];
    int initialized[num_slaves];
    uint64_t start_motion_cycle[num_slaves];
    // 为每个从站创建独立的当前速度变量
    double current_velocity[num_slaves];
    // 新增: 仅写一次操作模式
    int op_mode_written[num_slaves];
    // VLAs cannot be initialized with {}, so we use memset.
    memset(initialized, 0, sizeof(initialized));
    memset(start_motion_cycle, 0, sizeof(start_motion_cycle));
    memset(current_velocity, 0, sizeof(current_velocity));
    memset(op_mode_written, 0, sizeof(op_mode_written));

    struct timespec before_sleep;
    long sleep_duration_us;
    // 新增: 用于测量网络往返时间 (RTT)
    struct timespec last_send_time_rtt;
    long rtt_us;

```
初始化参数



> * EC\_WC\_ZERO：本周期“未交换任何已注册的过程数据”。常见原因：域未激活/未queue+send、PDO 注册或映射不匹配、链路/从站掉线。
> * EC\_WC\_INCOMPLETE：本周期“只交换了部分过程数据”。常见原因：丢帧、个别从站未响应、周期超时/系统过载、拓扑或电缆问题。
> * EC\_WC\_COMPLETE：本周期“已交换全部注册的过程数据”。理想状态。



开始循环

```cpp
while (keep_runing)
{
	//加一毫秒
	wakeupTime.tv_nsec += CYCLE_TIME_NS;
	while (wakeupTime.tv_nsec >= 1000000000) {
		wakeupTime.tv_nsec -= 1000000000;
		wakeupTime.tv_sec++;
	}

	//设置 before_sleep
    clock_gettime(CLOCK_MONOTONIC, &before_sleep);
	
	//让当前线程睡眠到wakeupTime 时间
	clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &wakeupTime, NULL);
	
	//计算出计划睡多久
	//sleep_duration_us = (wakeupTime.tv_sec - before_sleep.tv_sec) * 1000000 + (wakeupTime.tv_nsec - before_sleep.tv_nsec) / 1000;
	
	//设置这个周期开始时间
	ecrt_master_application_time(master, wakeupTime.tv_sec * 1000000000LL + wakeupTime.tv_nsec);
	
	ecrt_master_receive(master);
    ecrt_domain_process(domain);
	
	//查看域的状态.
	ec_domain_state_t domain_state;
    ecrt_domain_state(domain, &domain_state);
	
	//可以简单理解为 EC_WC_COMPLETE 是最理想的状态
	if (domain_state.wc_state == EC_WC_COMPLETE) {
		for (size_t i = 0; i < num_slaves; i++)
        {
			uint16_t status_word;
			int32_t pos_val;
			int32_t vel_val;
			int16_t tor_val;
			uint8_t op_mode_display;
			
			status_word = EC_READ_U16(domain_pd + off_status_word[i]);
			pos_val = EC_READ_S32(domain_pd + off_position_actual_value[i]);
			vel_val = EC_READ_S32(domain_pd + off_velocity_actual_value[i]);
			tor_val = EC_READ_S16(domain_pd + off_torque_actual_value[i]);
			op_mode_display = EC_READ_U8(domain_pd + off_modes_of_operation_display[i]);
			
			//先处理各种状态,初始化等等
			//https://doc-legacy.synapticon.com/software/44/documentation_html/object_htmls/6041/index.html
			//表示8,也就是 1000，表示有错误
			uint16_t control_word = 0;
            if ((status_word & 0x0008) == 0x0008)
            { 
				// Fault	//https://doc-legacy.synapticon.com/software/44/documentation_html/object_htmls/6040/index.html
				//第七位设置成1.
                control_word = 0x0080; // Fault reset
            }
			//判断是否使能
			else if ((status_word & 0x006F) == 0x0027)
            {   
                // Operation enabled
                // --- 修复: 如果错过了 "Switched on" 状态，在此处进行初始化 ---
                if (!initialized[i])
                {
                    initial_position[i] = pos_val; //初始化未知
                    initialized[i] = 1; //从站初始化,具体哪个从站
                }

                if (start_motion_cycle[i] == 0)
                { // 仅记录一次运动开始时间
                    start_motion_cycle[i] = cycle_counter;
                }
				//维持使能状态
                control_word = 0x000F; // Keep enabled
            }
			else if ((status_word & 0x006F) == 0x0023)
            { 
                // Switched on
                if (!initialized[i])
                {
                    initial_position[i] = pos_val;
                    initialized[i] = 1;
                    LOG_INFO("周期 %u - 从站 %zu 已锁定初始位置: %d\n", cycle_counter, i, initial_position[i]);
                    fflush(stdout);
                }
                control_word = 0x000F; // Enable operation
            }
			else if ((status_word & 0x006F) == 0x0021)
            { 
                // Ready to switch on
                control_word = 0x0007; // Switch on
            }
			else if ((status_word & 0x004F) == 0x0040)
            { 
                // Switch on disabled
                control_word = 0x0006; // Shutdown
            }
			
			int32_t target_pos = 0;
            int32_t target_vel = 0;
			
			//如果前面初始化了
			if (initialized[i])
            {
				// 根据所选模式计算目标值
                switch (selected_mode) {
                    case MODE_CSP:
                        target_pos = csp_run(
                            cycle_counter,
                            start_motion_cycle[i],
                            initial_position[i],
                            csp_params_ptr, // 传递指针
                            CYCLE_TIME_NS
                        );
						
						// 这个是通过传入的基础速度并且根据圈数然后返回一个最新的位置，从而达到一直旋转的地步
						// int32_t csp_run(
						//     uint64_t cycle_counter, 
						//     uint64_t start_motion_cycle,
						//     int32_t initial_position,
						//     const Csp_Params_t *params, // 接收参数指针
						//     double cycle_time_ns
						// ) {
						//     int32_t target_pos = initial_position; // 默认为初始位置
						//     const Csp_Params_t *p = (params == NULL) ? &default_csp_params : params;

						//     if (start_motion_cycle > 0)
						//     { // 电机已使能并准备好运动
						//         // --- 恒速运动控制 ---
						//         double elapsed_time_s = (cycle_counter - start_motion_cycle) * (cycle_time_ns / 1e9);
						//         target_pos = initial_position + (int32_t)(p->velocity * elapsed_time_s);
						//     }
							
						//     return target_pos;
						// }
                        break;
                    case MODE_CSV:
						//csv_run 同理，返回一个速度
                        target_vel = csv_run(csv_params_ptr, &current_velocity[i], CYCLE_TIME_NS);
                        break;
                    case NUM_MODES: // 处理枚举警告
                        break;
                }
			}
			
			//这个PDO再设置一次模式.
			//确保进入 OP 后模式确实生效。部分驱动在 PREOP/SAFEOP 用 SDO写的模式，切到 OP 或复位后可能被覆盖/忽略。
			//覆盖厂家 ESI 里的默认/InitCmd（有的 ESI会把 0x6060 设为 0x08 等），用 PDO 在OP里再写一次更稳。
			//实时安全：SDO 属于邮箱通信，慢且不适合实时环；PDO 写一次即可（用 op_mode_written[i] 防止每周期反复写导致状态抖动）。

			if (!op_mode_written[i]) {
				// TAISHAN 无 0x6060 PDO，避免写入
				if (!(info[i].vendor_id == VENDOR_ID_TAISHAN && info[i].product_code == PRODUCT_CODE_TAISHAN)) {
					EC_WRITE_S8(domain_pd + off_modes_of_operation[i], op_mode_code);
				}
				op_mode_written[i] = 1;
			}
			
			//写入控制字
			//每次都写入。
			EC_WRITE_U16(domain_pd + off_control_word[i], control_word);
			
			// 根据模式写入不同的目标值
			switch (selected_mode) {
				case MODE_CSP:
				
					//这个很简单写入位置信息到域里面
					EC_WRITE_S32(domain_pd + off_target_position[i], target_pos);
					break;
				case MODE_CSV:
				
					// TAISHAN 无 0x60FF/0x6071，跳过CSV写入
					//这个是
					if (!(info[i].vendor_id == VENDOR_ID_TAISHAN && info[i].product_code == PRODUCT_CODE_TAISHAN)) {
						//写入速度
						EC_WRITE_S32(domain_pd + off_target_velocity[i], target_vel);
						//这个扭矩这个我其实不太清楚。
						//为什么需要增加扭矩?
						//可能是因为有些ESI文件有要求。
						if (!(info[i].vendor_id == VENDOR_ID_JXZN && info[i].product_code == PRODUCT_CODE_JXZN)) {
							EC_WRITE_S16(domain_pd + off_target_torque[i], 500);
						} else {
							EC_WRITE_S16(domain_pd + off_target_torque[i], 0);
						}
					}
					break;
				case NUM_MODES: // 处理枚举警告
					break;
			}
			
			//这个是因为其他ok，但是MT必须要一个这个，他是必填的
			//所以单独发一下他
			if (info[i].vendor_id == VENDOR_ID_MT && info[i].product_code == PRODUCT_CODE_MT) {
				EC_WRITE_U16(domain_pd + off_max_torque[i], 1000); // 示例值: 设置一个最大转矩
			}
			
            // 保存当前发送时间作为下一个周期的上一次发送时间
            last_send_time = send_time;
		}
		
		// 新增：同步参考时钟。这是让DC同步正常工作的最关键一步。
        // 它会读取参考从站的时钟，并调整主站的逻辑时钟以消除漂移。
        ecrt_master_sync_reference_clock(master);

        // 原有的从站时钟同步，现在跟在参考时钟同步之后，以确保正确的同步顺序。
        ecrt_master_sync_slave_clocks(master);

        // 将更新后的数据帧放入队列并发送
        ecrt_domain_queue(domain);
        ecrt_master_send(master);
		
		clock_gettime(CLOCK_MONOTONIC, &last_send_time_rtt);

        cycle_counter++;

	}
}
```
然后电机就可以成功运行起来了。

其他模式或者你想怎么更细节的电机控制，比如精细的控制，控制到哪一步。

就看你具体的模式了

