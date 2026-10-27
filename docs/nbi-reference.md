# 中性束注入器的原理与模型约定

本场景采用 ITER / MITICA 负离子型加热中性束的结构顺序，绘图单位和外形比例经过压缩，不作为工程尺寸或设备制造图。查阅日期：2026-10-27。

## 依据

- [ITER：All eyes on the neutral beam source](https://www.iter.org/node/20687/all-eyes-neutral-beam-source) 说明射频负离子源、七层抽取与加速栅，以及负离子加速、中和、残余离子分离后进入等离子体的流程。场景用七组框架表达栅极；约 1 MeV 是 ITER 型系统的参考能量。
- [Consorzio RFX：I componenti di MITICA](https://www.igi.cnr.it/ricerca/negative-ion-neutral-beam-injection/mitica/come-fatta-mitica/) 描述四通道气体中和器、采用横向电场的五板残余离子吸收器，以及两片水冷管排构成的可开合量热器。量热器闭合成 V 形时截束测功率；打开并与束路平行时允许注入。
- [Max Planck IPP：Principle of neutral beam injection](https://www.ipp.mpg.de/3704059/nbi_principle) 说明中性原子进入磁约束区后，经碰撞电离，再通过后续碰撞向等离子体传递能量；残余离子应先被分离到专用吸收器。
- [Max Planck IPP：Neutral beam injection on ASDEX Upgrade and Wendelstein 7-X](https://www.ipp.mpg.de/3704076/nbi_aug_w7x) 给出切向注入用于提高电流驱动效率的实际应用。场景采用偏心直线束路来表达切向加热注入，并未宣称复制 ITER 的端口方位。

## 场景中的表达

1. 紫色粒子在源端仍带负电，经过抽取与加速栅。
2. 气体靶中和部分离子，青色直线与金色运动点代表中性原子。
3. 正、负残余离子分别沿珊瑚色、紫色弧线到达同一通道两侧的水冷板。只有这些残余离子偏转；中性束保持直线。
4. 正常注入时量热器两片展开。诊断模式闭合 V 形量热器，束流止于量热器，通往等离子体的束路隐藏。
5. 漂移管与端口保持直线，注入口在真空室、包层和低温恒温器上有对应剖视开口。

为使内部过程可见，真空束线室的前壁与部分上盖、近侧通道板的上半部被剖去。残余正离子最终撞击的端部板块仍保留实心几何。动画只突出四通道中的一条通道，紫色向青色的转换不是量化的中和效率模拟。

## 接口与验证

`buildNeutralBeam({parent, parts, coreY})` 返回 `{group, parts, update(time, state)}`；`buildReactor()` 的公共接口未改变。主要部件 ID 为 `neutral-beam`，子部件为 `beam-source`、`beam-neutralizer`、`beam-ion-dump`、`beam-calorimeter`、`beam-duct`，均归属步骤 3。

束线绕竖轴旋转 8°，几何冲量参数为 2.72，接近等离子体主半径 2.8。`state.nbiDiagnostic=true` 闭合量热器；默认打开。运动只由绝对模拟时间计算，暂停时保持同一时间即可冻结；停机时隐藏束流并保留设备。

`tests/nbi.test.mjs` 检查中性束的直线、残余离子的偏转终点、实际分隔板与整个粒子束包络的间隙、诊断截束、固定时间的确定性，以及部件选择层级。
