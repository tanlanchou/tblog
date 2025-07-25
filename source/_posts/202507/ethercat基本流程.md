### 配置流程

01ecrt_request_master 连接主站

ecrt_master_create_domain 创建数据域 => 类似新建文件夹内，后续PDO之类的会进来

ecrt_master_get_slave获取从站信息(这里可以批量)

ecrt_master_slave_config 把从站信息告诉主站



ecrt_slave_config_pdos 配置pdo 规范

* **目的**：这是最关键的配置步骤之一。对于每个从站，你需要精确地定义：

* **同步管理器 (Sync Managers)**：配置哪些“邮箱”用于输入（从站 -> 主站）和输出（主站 -> 从站）。

* **过程数据对象 (PDOs)**：指定你希望通过这些“邮箱”交换的具体数据是什么。例如，“我希望将‘目标位置’这个PDO映射到输出邮箱，并将‘实际位置’这个PDO映射到输入邮箱”。

* **信息来源**：这些配置信息（PDO索引、同步管理器设置）通常来自于从站设备的ESI (EtherCAT Slave Information) 文件，或者通过 `ethercat` 命令行工具扫描得到



ecrt_slave_config_dc 设置分布式时钟



| 数值       | 含义说明                   |
| -------- | ---------------------- |
| `0x0001` | 启用 DC 支持               |
| `0x0300` | 启用 Sync0 输出 + 同步激活（常用） |
| `0x0700` | 启用 Sync0 和 Sync1 输出    |



ecrt_master_select_reference_clock 设置参考时钟（可选）

ecrt_domain_reg_pdo_entry_list 注册pdo







ecrt_master_sdo_download 通过SDO 获取和设置字典对象.



ecrt_slave_config_emcy_handler 注册 EMCY 回调处理函数

| 组成                             | 作用                | 举例                           |
| ------------------------------ | ----------------- | ---------------------------- |
| **对象字典（Object Dictionary）**    | 定义设备的数据结构         | `0x6040`、`0x6060`、`0x607A` 等 |
| **SDO（Service Data Object）服务** | 读/写对象字典参数（非实时）    | 修改加速度、读取固件版本等                |
| **PDO（Process Data Object）服务** | 实时数据传输（周期性）       | 控制字、目标位置、反馈位置                |
| **Emergency（EMCY）报文**          | 异常报警机制            | 电机过载、编码器错误等                  |
| **SYNC 同步机制**                  | 时间同步（如果使用同步模式）    | 主站发同步触发信号                    |
| **CiA 301/40x 设备配置规范**         | 设备行为标准（如 CiA 402） | 电机状态切换逻辑、模式设置                |



##### 📂 控制与状态相关对象（CiA 402）

| Index      | Sub | Name               | 类型     | 含义与作用                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | --- | ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0x603F** | 0   | Error code         | UINT16 | 最近一次错误码，比如过流、过压等 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/42/documentation_html/object_htmls/603F/index.html?utm_source=chatgpt.com "0x603F Error code - Synapticon Documentation"))                                                                                                                                                                                 |
| **0x6040** | 0   | Controlword        | UINT16 | 控制状态机，例如 Enable/RUN/Reset ([kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"), [download.variodrive.nl](https://download.variodrive.nl/ACS/product_guides/EtherCAT-DS402-Products-User-Guide.pdf?utm_source=chatgpt.com "[PDF] EtherCAT DS402 Products User Guide - My Document"))       |
| **0x6041** | 0   | Statusword         | UINT16 | 状态反馈，如 Fault/Operation enabled等 ([kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"), [download.variodrive.nl](https://download.variodrive.nl/ACS/product_guides/EtherCAT-DS402-Products-User-Guide.pdf?utm_source=chatgpt.com "[PDF] EtherCAT DS402 Products User Guide - My Document")) |
| **0x6060** | 0   | Modes of operation | SINT8  | 设置运行模式：CSP/CST/CSV等 ([kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"), [download.variodrive.nl](https://download.variodrive.nl/ACS/product_guides/EtherCAT-DS402-Products-User-Guide.pdf?utm_source=chatgpt.com "[PDF] EtherCAT DS402 Products User Guide - My Document"))             |
| **0x6061** | 0   | Modes display      | SINT8  | 当前运行模式反馈 ([kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"), [download.variodrive.nl](https://download.variodrive.nl/ACS/product_guides/EtherCAT-DS402-Products-User-Guide.pdf?utm_source=chatgpt.com "[PDF] EtherCAT DS402 Products User Guide - My Document"))                        |
| **0x6071** | 0   | Target torque      | INT16  | 设置目标转矩 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"), [kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"))                                       |
| **0x607A** | 0   | Target position    | INT32  | 设置目标位置 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"), [kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"))                                       |
| **0x60FF** | 0   | Target velocity    | INT32  | 设置目标速度 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"), [kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"))                                       |
| **0x6064** | 0   | Actual position    | INT32  | 实际位置反馈 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"), [kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"))                                       |
| **0x606C** | 0   | Actual velocity    | INT32  | 实际速度反馈 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"), [kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"))                                       |
| **0x6077** | 0   | Actual torque      | INT16  | 实际转矩反馈 ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"), [kollmorgen.com](https://www.kollmorgen.com/sites/default/files/public_downloads/RGM_CANopen_PDF.pdf?utm_source=chatgpt.com "[PDF] RGM CANopen - Kollmorgen"))                                       |
| **0x60B0** | 0   | Position offset    | INT32  | CSP 模式下的位置偏移（可选） ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"))                                                                                                                                                                                            |
| **0x60B1** | 0   | Velocity offset    | INT32  | CSV 模式下的速度偏移（可选） ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"))                                                                                                                                                                                            |
| **0x60B2** | 0   | Torque offset      | INT16  | CST 模式下的转矩偏移（可选） ([doc-legacy.synapticon.com](https://doc-legacy.synapticon.com/software/41/object_dict/all_objects/index.html?utm_source=chatgpt.com "List of all Objects - Synapticon Documentation"))                                                                                                                                                                                            |



##### ⚙️ 设备配置与诊断类对象（通用）

| 索引         | 名称                        | 用途说明           |
| ---------- | ------------------------- | -------------- |
| **0x1000** | Device Type               | 设备类型标识         |
| **0x1001** | Error Register            | 错误状态           |
| **0x1018** | Identity Object           | 厂商ID、产品ID、版本号等 |
| **0x1020** | Verify Configuration Date | 配置校验           |
| **0x10F1** | Firmware Version（非标准）     | 某些厂商扩展的固件信息    |



强烈建议查询这个，基本的该有的都有。
