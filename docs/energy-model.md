# 聚变能量展示的物理边界与计算

本模块用于解释稳态能量流和能量数量级。默认参数是**假想未来电站的教学示意**，不是 ITER、现有实验装置或商业电站的工程预测。计算不依赖网络，来源链接与说明随页面保留。

## 两种“维持运行”应分别呈现

氘氚反应 `D + T → He-4 + n` 的释放能约为 17.6 MeV，其中 α 粒子约 3.5 MeV，中子约 14.1 MeV。α 能量份额为 `3.5 / 17.6 ≈ 19.9%`。带电 α 粒子在良好磁约束下与等离子体碰撞，把能量留给等离子体，减少外部加热需求；中子不受磁场约束，在周围材料中沉积能量。该分流不是在聚变能以外再创造一份能量。[ITER 自加热说明](https://www.iter.org/node/20687/what-burning-plasma)、[IAEA D-T 反应测量论文，第 1 页](https://www-pub.iaea.org/MTCD/Meetings/PDFplus/2010/cn180/cn180_papers/ife_p6-11.pdf)

发电机产生的电则分给辅助加热设备、电流驱动、低温制冷、真空与冷却泵等系统，扣除这部分厂用电才是送入电网的净电力。加热系统的用电大于实际注入等离子体的热功率，两者由“电到加热效率”联系。UKAEA 的电站研究在其第 4 节、式 29–34 中区分了这些量，并明确讨论了废热回收及包层能量倍增假设。[UKAEA 原始研究](https://scientific-publications.ukaea.uk/wp-content/uploads/1-S2-0-S0920379622000229-MAIN.PDF)

自加热并不保证持续运行：温度、密度、约束时间、稳定性和燃料循环仍须满足要求。反应持续消耗燃料并产生氦灰；未反应燃料要回收。模型不计算这些等离子体条件，也不能用调高功率滑块证明可实现点火或稳态。[ITER 燃料系统](https://www.iter.org/machine/supporting-systems/fuelling)

## 功率收支

全部功率单位是 MW；热功率与电功率在界面上应明确标记。

| 输入 | 默认值 | 含义 |
| --- | ---: | --- |
| `fusionMW` | 2000 MW | 核反应新释放的聚变功率 |
| `auxiliaryMW` | 100 MW | 真正注入并被等离子体吸收的辅助加热功率 |
| `thermalEfficiency` | 0.40 | 回收热到毛电力的转换率 |
| `wallPlugEfficiency` | 0.50 | 辅助加热系统电功率到吸收加热功率的效率 |
| `plantMW` | 120 MW | 除辅助加热以外的全厂用电，合并制冷、泵等负荷 |

简化稳态模型假设聚变产物热和注入等离子体的辅助热都被回收，且使用同一转换率。未另计锂增殖、中子倍增等包层反应热；也未精细区分偏滤器低品位热与包层高品位热。因而它展示收支逻辑，不声称所有热都能以该效率工程回收。

```text
alphaMW             = fusionMW × (3.5 / 17.6)
neutronMW           = fusionMW × (14.1 / 17.6)
thermalMW           = fusionMW + auxiliaryMW
grossMW             = thermalMW × thermalEfficiency
heatingElectricMW   = auxiliaryMW / wallPlugEfficiency
recirculatingMW     = heatingElectricMW + plantMW
netMW               = grossMW − recirculatingMW
lossesMW            = (thermalMW − grossMW)
                    + (heatingElectricMW − auxiliaryMW) + plantMW
```

辅助热只计入回收热一次，不能将 α 自加热再加到 `thermalMW` 上。`lossesMW` 是最终向环境排放的总热，包含热电转换废热、加热设备损耗以及厂用电最终散热。`netMW + lossesMW = fusionMW`，这个关系在净电力为负时仍成立；负 `netMW` 表示需要从电网补入电力。功率收支不存在永动循环。

默认结果：2100 MW 回收热、840 MW 毛发电、200 MW 加热用电、120 MW 其他厂用电、320 MW 循环用电、**520 MW 净电力**、1480 MW 总排热。循环用电占毛发电约 38.1%。这些结果来自上述示意假设。

`plasmaQ = fusionMW / auxiliaryMW`，只比较聚变功率与等离子体加热功率，不能直接称作“全厂发电增益”。[ITER Q 定义](https://www.iter.org/faqs)

API 对有限且非负的功率、`0 < efficiency ≤ 1` 的效率做严格验证，无效值抛出 `RangeError`，不静默裁剪。省略的字段采用默认值，调用对象保持不变。辅助加热为零时 `plasmaQ` 返回 `Infinity`，仅表示形式上的零分母，不证明点火。毛发电为零时，循环比例约定为：负荷为零返回 0，存在厂用负荷返回 `Infinity`。

`positive` 表示 `netMW > 0`。`lamps` 仅将正净电力除以每盏 10 W，表示可同时供电的 LED 盏数；赤字时为零，但保留有符号净电力。

## 1 克燃料的能量数量级

`fuelEnergy(grams, efficiency = 0.4)` 中的质量是**实际完全发生反应的等核数氘氚混合燃料**，不是一次注入的质量，也不是等质量混合物，更不是实际装置的燃尽率。每反应消耗一个氘核和一个氚核；混合反应对摩尔质量取近似 `5.030 g/mol`，将 17.6 MeV 反应能换算为焦耳。

```text
反应数 = grams / 5.030 × 6.02214076×10²³
joules = 反应数 × 17.6×10⁶ × 1.602176634×10⁻¹⁹
thermalMWh = joules / 3.6×10⁹
grossElectricMWh = thermalMWh × efficiency
```

其中阿伏伽德罗常数与电子伏特的 SI 换算为定义值；5.030 g/mol 为本模块足够精度的近似。1 克得到约 **93.78 MWh 热能**；40% 转换率下约 **37.51 MWh 毛电能**。后者尚未扣除厂用电，不应标作可送电量。10 W LED 的连续照明时间按每年 365 日换算，家庭用电按 10 kWh/日假设换算；这些只是帮助理解的尺度，不是居民用电统计。

## 验证与来源

`tests/energy.test.mjs` 先在模块缺失时验证失败，再验证默认功率、α/中子分流、全厂能量守恒、负净发电、零辅助加热、参数拒绝以及燃料质量/效率比例。模块以纯函数供浏览器和离线单文件构建共用。

来源核对日期：2026-10-26。`ENERGY_SOURCES` 保存 ITER、IAEA 和 UKAEA 的公开原始资料。说明中的 2000/100 MW、40%/50%、120 MW 是自选教学参数，未借用来源中的设计值作为工程承诺。
