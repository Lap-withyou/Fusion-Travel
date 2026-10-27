# V3：九步体验中的科学原理卡片

核对日期：2026-10-27。数据位于 `dist/js/principles.js`，供交互面板与离线单文件共用。原理文字是面向公众的中文转述，公式用 Unicode 直接显示，不依赖在线数学字体或远程脚本。

## 内容与边界

这是未来 D–T 托卡马克电站的教学概念，不是已经运行的商业聚变电站，也不是 ITER 的发电流程。ITER 的实验目标包括燃烧等离子体、聚变增益和相关技术验证；ITER 不配置发电设备。[ITER：What will ITER do?](https://www.iter.org/fusion-energy/what-will-iter-do)

| 步骤 | 体验中展开的原理 | 必须保留的区别 |
| --- | --- | --- |
| 1 燃料 | 氘、氚的核组成；注气和燃料小丸 | 送入燃料还没有完成电离或聚变 |
| 2 击穿 | 电场加速电子，电子碰撞电离形成雪崩；欧姆热 `P = I²R` | 启动电离与核聚变是不同过程；高温后电阻下降使欧姆加热受限 |
| 3 加热 | 负离子 NBI 全链；快离子库仑碰撞减速；射频共振 | 离子先加速后中性化；入等离子体后再电离；碰撞逐步传热 |
| 4 磁约束 | `F磁 = q(v × B)`；环向与极向场合成螺旋磁场 | 磁力本身不做功；中子不受该项磁力约束；磁面与单粒子回旋不同 |
| 5 聚变 | D–T 反应能量分配；α 自加热；`E = Δmc²` | α 是 17.6 MeV 的一部分，不能重复加算；1 g 完全反应换算是毛电比较 |
| 6 取热 | 中子动能沉积成热；冷却剂经热交换器向发电侧传热 | `6 → 8` 是热量路径；燃料不进入涡轮；ITER 取热后排热 |
| 7 回收 | 未反应 D/T 净化再注入；`⁶Li + n → ⁴He + T` | `7 → 1` 是燃料路径；已消耗燃料不能原样收回；需新燃料和损耗补充 |
| 8 发电 | 蒸汽驱动涡轮；磁通变化产生电动势；毛电减厂用电 | 等离子体 Q 与全厂净电收支不同；没有把转化损耗藏起来 |
| 9 点灯 | LED 将电转为光和热；暖白光可经荧光材料形成；供需平衡 | 灯色是视觉选择；负载与供电必须持续平衡；点灯不证明商业聚变供电 |

表中启动机制来自 [Peng 等的欧姆启动研究](https://doi.org/10.1017/S0022377818001046)和 [ITER 加热系统](https://www.iter.org/machine/supporting-systems/external-heating-systems)。磁约束解释参考 [IPP 磁约束](https://www.ipp.mpg.de/11728/mageinschluss)与 [IPP 托卡马克](https://www.ipp.mpg.de/9778/tokamak)。燃料处理参考 [ITER Fuelling](https://www.iter.org/machine/supporting-systems/fuelling)，包层和热交换参考 [ITER Tritium breeding](https://www.iter.org/machine/supporting-systems/tritium-breeding)。

## 第 3 步的负离子中性束顺序

采用 ITER 类型的负离子路线作为具体案例，不把它说成所有 NBI 的唯一方案：

1. 负离子源制备 D⁻。
2. 电场加速带电粒子，提高动能。
3. 气体中性化器去掉多余电子，使一部分 D⁻ 成为 D⁰。
4. 残余离子收集器偏转并吸收未中性化的带电粒子。
5. 高速中性束穿入托卡马克约束磁场。
6. 在等离子体中电离或电荷交换，形成快 D⁺ 离子。
7. 被约束的快离子经一连串库仑碰撞减速，把能量传给电子和离子。

负离子技术和束线部件已由 [ITER 中性束试验设施](https://www.iter.org/project/iter-neutral-beam-test-facility)及 [Serianni 等，2017](https://doi.org/10.1088/1367-2630/aa64bd)核对。等离子体中的电离和减速参考 [IPP 的中性束研究第 2 章](https://pure.mpg.de/rest/items/item_2139850_1/component/file_2139849/content)。链路是简化的有效功率路径，未逐项画出杂散粒子、提前剥离、束流损失、轨道损失等工程细节，不假定所有注入功率都被吸收。

## 反应式与能量核对

`D + T → ⁴He (3.5 MeV) + n (14.1 MeV)`，共约 17.6 MeV，使用 [IAEA《World Survey of Fusion Devices 2022》表 1（PDF 第 23 页，印刷页 4）](https://www-pub.iaea.org/MTCD/Publications/PDF/CRCP-FUS-001webRev.pdf)的数据。相对于低能入射状态，产物的能量主要是动能；高温等离子体中实际产物能谱并非无限窄的单条线。

α 自加热份额取 `3.5 / 17.6 ≈ 19.9%`，中子份额取 `14.1 / 17.6 ≈ 80.1%`。这与 [ITER 的能量收集解释](https://www.iter.org/fusion-energy/making-it-work)相符。α 粒子留在等离子体中的加热已经属于聚变功率，不能再把它作为另一份功率加到总聚变输出上。

质能关系的反应前后静质量差解释参考 [MIT PSFC 的聚变研究绪论](https://library.psfc.mit.edu/catalog/reports/2010/12rr/12rr009/12rr009_full.pdf)。1 g 换算由项目现有 `fuelEnergy` 模型自行计算，不是来源报告的实际实验产出：等核数氘、氚混合物的 D–T 成对摩尔质量近似 5.030 g/mol，阿伏伽德罗常数为 6.02214076 × 10²³ mol⁻¹，1 eV = 1.602176634 × 10⁻¹⁹ J。

`E = (1 g / 5.030 g mol⁻¹) × N_A × 17.6 × 10⁶ eV ≈ 3.376 × 10¹¹ J ≈ 93.8 MWh`

按教学假设热电转换率 40%，约得 **37.5 MWh 毛电**。这表示 1 g 氘氚总混合燃料完全反应，不是 1 g 氘加 1 g 氚，也不表示一次注入就全部烧完；尚未扣除厂用电。

## 默认全厂收支

数字与现有 `energy.js` 一致，是教学假设；引用 ITER 仅说明系统边界，不能把这些数字归为 ITER 参数。

| 项目 | 假设或计算 |
| --- | --- |
| 聚变功率 | 2000 MW |
| 辅助加热实际进入等离子体的功率 | 100 MW |
| 可回收热量（模型假设全部回收） | 2000 + 100 = 2100 MW |
| 毛电，热转换效率 40% | 2100 × 0.4 = 840 MW |
| 加热装置用电，墙插效率 50% | 100 / 0.5 = 200 MW |
| 制冷、泵、控制等其他厂用电 | 120 MW |
| 总厂用电 | 200 + 120 = 320 MW |
| 净电 | 840 − 320 = 520 MW |
| 最终排热 | 1260 + 100 + 120 = 1480 MW |

稳态下 `520 + 1480 = 2000 MW`，输入燃料的聚变能守恒。模型忽略包层核反应额外放热、蓄能变化和各系统的细分温度。热机的未转化热量、加热装置转换损耗和其他用电最终均计入排热。默认等离子体 `Q = 2000/100 = 20` 并不等于全厂电增益。全厂用电边界参考 [ITER 目标中的说明](https://www.iter.org/fusion-energy/what-will-iter-do)。

## 来源索引

每张卡用 `sourceIds` 关联 `PRINCIPLE_SOURCES`，点击来源是可选动作，离线时卡片仍完整显示。下表是逐项核对的主要一手材料，不使用百科或商业聚变宣传作为证据。

| ID | 材料与支持内容 |
| --- | --- |
| iter-fuelling | [ITER Fuelling](https://www.iter.org/machine/supporting-systems/fuelling)：注气、小丸、排气中的未燃燃料和氦灰处理 |
| doe-fuel | [DOE D–T fusion fuel](https://www.energy.gov/science/doe-explainsdeuterium-tritium-fusion-fuel)：氘氚核组成、氚供给与锂-6 |
| jpp-breakdown | [Peng et al., JPP 84, 905840505 (2018)](https://doi.org/10.1017/S0022377818001046)：电场、电子碰撞电离及启动参数 |
| iter-heating | [ITER External heating systems](https://www.iter.org/machine/supporting-systems/external-heating-systems)：欧姆电阻随温度下降、束流和回旋共振 |
| iter-nbtf | [ITER Neutral Beam Test Facility](https://www.iter.org/project/iter-neutral-beam-test-facility)：负离子技术与残余离子收集器 |
| nbi-transport | [Serianni et al., New J. Phys. 19, 045003 (2017)](https://doi.org/10.1088/1367-2630/aa64bd)：负离子中性化与束线传输 |
| ipp-beam | [IPP 研究，第 2 章](https://pure.mpg.de/rest/items/item_2139850_1/component/file_2139849/content)：中性束在等离子体中的电离和快离子碰撞减速 |
| ipp-magnetic | [IPP Magnetic confinement](https://www.ipp.mpg.de/11728/mageinschluss)：带电粒子的回旋与沿场运动 |
| ipp-tokamak | [IPP Tokamak](https://www.ipp.mpg.de/9778/tokamak)：外部场、等离子体电流场与螺旋磁面 |
| iaea-reactions | [IAEA World Survey 2022](https://www-pub.iaea.org/MTCD/Publications/PDF/CRCP-FUS-001webRev.pdf)：D–T 反应的 3.5/14.1 MeV 分配 |
| mit-mass | [MIT PSFC 研究绪论](https://library.psfc.mit.edu/catalog/reports/2010/12rr/12rr009/12rr009_full.pdf)：聚变与静质量差 |
| iter-capture | [ITER Making fusion work](https://www.iter.org/fusion-energy/making-it-work)：α 加热、中子能量沉积与未来蒸汽发电 |
| iter-breeding | [ITER Tritium breeding](https://www.iter.org/machine/supporting-systems/tritium-breeding)：产氚、提取、热交换及仍需验证的规模化能力 |
| eia-generator | [EIA How electricity is generated](https://www.eia.gov/energyexplained/electricity/how-electricity-is-generated.php)：流体驱动涡轮、转轴驱动电磁发电机 |
| iter-goals | [ITER What will ITER do?](https://www.iter.org/fusion-energy/what-will-iter-do)：不发电与等离子体/全厂能量边界 |
| doe-led | [DOE LED Basics](https://www.energy.gov/cmei/ssl/led-basics)：芯片发光及白光实现方式 |
| energy-star-led | [ENERGY STAR LED lighting](https://www.energystar.gov/products/learn-about-led-lighting)：LED 散热与荧光材料 |
| pjm-balance | [PJM Grid balance](https://learn.pjm.com/three-priorities/keeping-the-lights-on/how-pjm-and-generators-continually-balance-the-grid.aspx)：发电供给与用电需求的实时平衡 |

## 数据接口与验证

`PRINCIPLES[stepId]` 返回 1–3 张卡片，每张为 `{id, title, formula, explanation, sourceIds, stages?}`。`stages` 是可选字符串数组；第 3 步首卡提供七段完整链路。`PRINCIPLE_SOURCES` 条目是 `{id, title, url}`；`id` 唯一，卡片引用必须可解析。

`tests/principles.test.mjs` 验证九步完整覆盖、来源引用和字符串完整性、关键 NBI 顺序、D–T 能量分配、α 不重复计入、回收/取热分流及默认功率与燃料换算。它是内容回归检查，不代替物理实验或反应堆设计分析。
