# 科学内容核对说明

核对日期：2026-10-26。网站表现的是一座采用氘氚燃料、托卡马克磁约束和蒸汽发电的**未来概念聚变电站**。模型经过拆分、放大和减速，便于观察原理，不对应某座装置的尺寸、时序、产能或设备配置。

## 阅读路径与实际流程

九个编号是学习顺序。启动、加热、磁约束和控制在实际运行中相互配合，磁场并不是等到第 4 步才开启。氘氚聚变产物包含带电的氦核与不带电的中子，中子把大部分反应能量带出等离子体。[ITER：聚变条件与能量收集](https://www.iter.org/fusion-energy/making-it-work)。

| 路径 | 本示意的连接 | 含义 |
| --- | --- | --- |
| 能量路径 | 第 5 步 → 第 6 步 → 第 8 步 → 第 9 步 | 反应产物动能转化为热，热经发电系统转化为电，最后用于灯泡。 |
| 燃料旁路 | 等离子体排气 → 第 7 步 → 第 1 步 | 回收未反应氘氚，分离氦灰和杂质，净化后再注入。 |

因此，第 7 步是**燃料侧闭环节点**，不应被理解为“燃料回收之后才把热送到涡轮”。能量明确沿 **6 → 8** 传递，燃料明确沿 **7 → 1** 返回。ITER 官方燃料循环说明支持回收与再注入这一过程。[ITER：燃料注入与闭合燃料循环](https://www.iter.org/machine/supporting-systems/fuelling)。

## 九步的科学边界

1. **燃料准备与注入：** 选用氘和氚，启动前抽除空气与杂质；注气与冷冻小丸是不同的加料方式。图中储罐和管路只表达功能。[ITER：燃料系统](https://www.iter.org/machine/supporting-systems/fuelling)。
2. **等离子体形成：** 气体通过电离形成正离子和自由电子。“击穿”属于启动过程，不等于已经达到适合聚变的温度。[ITER：托卡马克工作原理](https://www.iter.org/machine/what-tokamak)。
3. **加热与电流驱动：** 欧姆加热、中性束和射频波可向等离子体供能。中性束利用不带电的高速原子穿入磁约束区域；束流和波还可承担电流驱动与控制任务，不是所有加热方式都执行相同任务。[ITER：外部加热系统](https://www.iter.org/machine/supporting-systems/external-heating-systems)，[ITER：中性束电源与电流驱动](https://www.iter.org/project/construction-archives/neutral-beam-power-supply)。
4. **磁约束：** 线圈和等离子体电流参与形成磁场，帮助约束、塑形和定位等离子体。发光磁力线是方向可视化，不是实体轨道。[ITER：磁体系统](https://www.iter.org/machine/magnets)，[ITER：聚变术语表](https://www.iter.org/fusion-glossary)。
5. **聚变反应：** 氘核与氚核反应生成氦核和中子，释放能量；并非每次粒子相遇都会聚变。动画不模拟反应概率、截面或粒子时间尺度。[ITER：聚变条件与产物](https://www.iter.org/fusion-energy/making-it-work)。
6. **包层与热交换：** 本示意采用未来电站的取热思路，并区分冷却剂回路与发电侧工质。含锂的增殖包层还需要承担产氚功能，相关材料、产氚、取热和维护能力仍需进一步研发。[ITER：增殖包层与热交换](https://www.iter.org/machine/supporting-systems/tritium-breeding)，[EUROfusion：DEMO 设计](https://www.eurofusion.org/programme/demo/)。
7. **回收与再注入：** 闭环不等于不需要补充燃料。反应会消耗燃料，回收存在损耗，未来电站的氚供给还依赖增殖、提取和管理能力。[ITER：增殖与循环的研发边界](https://www.iter.org/machine/supporting-systems/tritium-breeding)。
8. **蒸汽发电：** 这是未来热力循环方案的教学演示。转动涡轮后由发电机转换为电能，还存在排热和整厂自用电，不能把聚变热功率直接当成可外送电功率。[ITER：托卡马克与未来电力转换](https://www.iter.org/machine/what-tokamak)，[ITER：实验能量增益与整厂能耗的区别](https://www.iter.org/fusion-energy/what-will-iter-do)。
9. **点亮灯泡：** 表示完成互动和理解能量链，不是现实聚变电站供电的证明。**ITER 是实验装置，本身不发电，不向电网供电。**[ITER：项目目标](https://www.iter.org/fusion-energy/what-will-iter-do)。

## 指标、颜色与简化

界面中的指标以 “D + T”“热 → 转动 → 电”“07 ↺ 01” 等概念标签为主，没有设定电站功率、发电效率、净电能、运行时间或燃料处理能力。粒子数量、速度、亮度、线圈数、储罐数和空间比例都用于教学，不宜作为性能数据解读。颜色用于区分燃料、等离子体、磁场、热、中子、电流和蒸汽，不表示实际可见颜色。

氚具有放射性，聚变中子也会影响与活化结构材料；本页没有将聚变描述为“完全无放射性”或“零工程风险”。更多基础解释见 [IAEA：聚变问答](https://www.iaea.org/topics/energy/fusion/faqs)。

## 官方资料

- [ITER：燃料注入与闭合燃料循环](https://www.iter.org/machine/supporting-systems/fuelling)
- [ITER：外部加热与中性束注入](https://www.iter.org/machine/supporting-systems/external-heating-systems)
- [ITER：磁体系统](https://www.iter.org/machine/magnets)
- [ITER：聚变条件与能量收集](https://www.iter.org/fusion-energy/making-it-work)
- [ITER：增殖包层与热交换](https://www.iter.org/machine/supporting-systems/tritium-breeding)
- [EUROfusion：DEMO 概念设计与未来发电](https://www.eurofusion.org/programme/demo/)
- [ITER：项目目标与实验边界](https://www.iter.org/fusion-energy/what-will-iter-do)
- [IAEA：聚变基础问答](https://www.iaea.org/topics/energy/fusion/faqs)
