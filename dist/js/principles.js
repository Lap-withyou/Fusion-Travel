// Source-backed learning cards for a future D–T power plant, not a reactor simulation.
// Formula strings use plain Unicode so that the standalone experience works offline.
export const PRINCIPLE_SOURCES = [
  {id:'iter-fuelling', title:'ITER · Fuelling：燃料与回收处理', url:'https://www.iter.org/machine/supporting-systems/fuelling'},
  {id:'doe-fuel', title:'美国能源部 · 氘氚同位素与锂-6 产氚', url:'https://www.energy.gov/science/doe-explainsdeuterium-tritium-fusion-fuel'},
  {id:'jpp-breakdown', title:'Peng et al. · 托卡马克欧姆启动与击穿研究（2018）', url:'https://doi.org/10.1017/S0022377818001046'},
  {id:'iter-heating', title:'ITER · External heating systems：欧姆、束流与射频加热', url:'https://www.iter.org/machine/supporting-systems/external-heating-systems'},
  {id:'iter-nbtf', title:'ITER · 中性束试验设施与负离子束技术', url:'https://www.iter.org/project/iter-neutral-beam-test-facility'},
  {id:'nbi-transport', title:'Serianni et al. · 负离子束的中性化与传输（2017）', url:'https://doi.org/10.1088/1367-2630/aa64bd'},
  {id:'ipp-beam', title:'IPP · 中性束在等离子体中的电离与碰撞减速', url:'https://pure.mpg.de/rest/items/item_2139850_1/component/file_2139849/content'},
  {id:'ipp-magnetic', title:'IPP · 磁约束与粒子回旋', url:'https://www.ipp.mpg.de/11728/mageinschluss'},
  {id:'ipp-tokamak', title:'IPP · 托卡马克的螺旋磁场', url:'https://www.ipp.mpg.de/9778/tokamak'},
  {id:'iaea-reactions', title:'IAEA · World Survey of Fusion Devices 2022：D–T 反应能量', url:'https://www-pub.iaea.org/MTCD/Publications/PDF/CRCP-FUS-001webRev.pdf'},
  {id:'mit-mass', title:'MIT PSFC · 聚变与质能关系', url:'https://library.psfc.mit.edu/catalog/reports/2010/12rr/12rr009/12rr009_full.pdf'},
  {id:'iter-capture', title:'ITER · Making fusion work：α 自加热与中子取热', url:'https://www.iter.org/fusion-energy/making-it-work'},
  {id:'iter-breeding', title:'ITER · 氚增殖包层与未来热交换回路', url:'https://www.iter.org/machine/supporting-systems/tritium-breeding'},
  {id:'eia-generator', title:'EIA · 涡轮、发电机与电磁感应', url:'https://www.eia.gov/energyexplained/electricity/how-electricity-is-generated.php'},
  {id:'iter-goals', title:'ITER · 实验目标、全厂能量边界与不发电的区别', url:'https://www.iter.org/fusion-energy/what-will-iter-do'},
  {id:'doe-led', title:'美国能源部 · LED Basics：白光的形成', url:'https://www.energy.gov/cmei/ssl/led-basics'},
  {id:'energy-star-led', title:'ENERGY STAR · LED 发光与散热', url:'https://www.energystar.gov/products/learn-about-led-lighting'},
  {id:'pjm-balance', title:'PJM · 电网供给与用电需求的实时平衡', url:'https://learn.pjm.com/three-priorities/keeping-the-lights-on/how-pjm-and-generators-continually-balance-the-grid.aspx'}
];

export const PRINCIPLES = {
  1: [
    {
      id:'fuel-isotopes',
      title:'同是氢，原子核里的中子数不同',
      formula:'D：1 个质子 + 1 个中子；T：1 个质子 + 2 个中子',
      explanation:'氘（D）和氚（T）是氢的同位素。这条旅程采用 D–T 燃料；先排出空气和杂质，再注气或补充冷冻燃料小丸。送入燃料只是起点，还要电离、加热和约束。',
      sourceIds:['iter-fuelling','doe-fuel']
    }
  ],
  2: [
    {
      id:'electron-breakdown',
      title:'击穿：电子碰撞产生更多自由电子',
      formula:'D⁰ + e⁻ → D⁺ + 2e⁻（原子电离简式）',
      explanation:'启动电场让少量自由电子加速；能量足够的电子碰撞燃料粒子，使其电离。新释放的电子继续参与，形成电离雪崩。实际燃料还涉及分子的解离；击穿成功并不等于已经发生聚变。',
      sourceIds:['jpp-breakdown','iter-fuelling']
    },
    {
      id:'ohmic-heating',
      title:'欧姆热：电流也能给等离子体加热',
      formula:'P欧姆 = I²R',
      explanation:'I 是等离子体电流，R 是等效电阻。电子与离子的碰撞把输入电能转为热运动。温度升高后等离子体电阻下降，因此欧姆加热适合启动阶段，继续升温通常还需要束流和射频。',
      sourceIds:['iter-heating']
    }
  ],
  3: [
    {
      id:'negative-ion-beam',
      title:'中性束：先带电加速，再“脱掉电荷”',
      formula:'D⁻（电场加速）→ D⁰（中性束）→ D⁺（进入等离子体后）',
      explanation:'这里展开 ITER 型负离子中性束路线。中性原子不能靠同样的静电方式直接加速，所以先加速 D⁻，再去掉多余电子。中性化不完全，残余带电粒子要被清除；进入等离子体后的重新电离，才有助于把束流能量留在其中。',
      sourceIds:['iter-nbtf','nbi-transport','ipp-beam'],
      stages:[
        '负离子源：制备 D⁻',
        '电场加速：提高离子动能',
        '中性化：D⁻ 去掉多余电子成为 D⁰',
        '清除残余离子：偏转并收集带电粒子',
        '中性束穿入约束磁场',
        '重新电离：D⁰ 成为快离子 D⁺',
        '库仑碰撞并减速：能量传给电子和离子'
      ]
    },
    {
      id:'beam-slowing',
      title:'快离子减速，周围粒子升温',
      formula:'快离子动能 ½mv² → 电子和离子的热运动',
      explanation:'中性原子在等离子体中经电离或电荷交换成为快离子。被约束的快离子通过一连串库仑碰撞减速，把能量分给背景电子和离子；不是一次碰撞就完成全部加热。',
      sourceIds:['ipp-beam','iter-heating']
    },
    {
      id:'wave-resonance',
      title:'射频共振：合拍的电磁波传递能量',
      formula:'回旋基频示例：f共振 = |q|B / (2πm)',
      explanation:'q、m 是粒子的电荷与质量，B 是磁场。选择合适的频率和传播方式，电磁波可把能量交给电子或离子。合适的波或定向束流还能驱动电流，帮助调节电流分布。',
      sourceIds:['iter-heating']
    }
  ],
  4: [
    {
      id:'lorentz-force',
      title:'洛伦兹力：磁场改变运动方向',
      formula:'F磁 = q(v × B)；F磁 · v = 0',
      explanation:'带电粒子受到与运动方向垂直的磁力，绕磁力线回旋，并可沿磁场前进。磁力本身不做功，主要改变方向；中子不带电，不受这项磁力约束。实际约束还会受到漂移和不稳定性的影响。',
      sourceIds:['ipp-magnetic','iter-capture']
    },
    {
      id:'helical-field',
      title:'两种方向的磁场组成螺旋磁面',
      formula:'B总 = B环向 + B极向（矢量相加）',
      explanation:'环向沿着大圆环，极向绕着环管截面。外部线圈与等离子体电流共同构成托卡马克的磁场，使磁力线在环形区域内螺旋前进，并形成约束所需的磁面；发光线是方向示意。',
      sourceIds:['ipp-tokamak']
    }
  ],
  5: [
    {
      id:'dt-reaction',
      title:'D–T 聚变：能量先成为产物的动能',
      formula:'D + T → ⁴He (3.5 MeV) + n (14.1 MeV)',
      explanation:'带正电的氘核与氚核互相排斥，接近到足够小的距离才可能聚变。反应形成氦-4 核（α 粒子）和中子，合计释放约 17.6 MeV。高温提高反应机会，还要有合适的密度和约束时间；并非每次相遇都会聚变。',
      sourceIds:['iaea-reactions','iter-capture']
    },
    {
      id:'alpha-self-heating',
      title:'α 自加热：把部分聚变能留在燃料里',
      formula:'Pα ≈ (3.5 / 17.6)P聚变 ≈ 20% P聚变',
      explanation:'α 粒子带正电，约束良好时通过碰撞把能量留给等离子体。它是聚变能的一部分，不是额外多出的一份能量。持续运行还要补偿热损失、补充燃料并排出氦灰。',
      sourceIds:['iter-capture','iter-goals']
    },
    {
      id:'mass-energy',
      title:'质能关系：反应前后的静质量差释放能量',
      formula:'E = Δmc²；Δm = mD + mT − mHe − mn',
      explanation:'反应产物的总静质量略小，差额表现为释放的能量。按等核数氘氚混合物完全反应估算，1 g 约释放 93.8 MWh 热量；按 40% 转换约得 37.5 MWh 毛电，尚未扣厂用电。这是理论换算，不是燃料一次通过就全烧完。',
      sourceIds:['mit-mass','iaea-reactions']
    }
  ],
  6: [
    {
      id:'neutron-deposition',
      title:'中子沉积能量：粒子动能变成材料的热',
      formula:'中子动能 → 材料中的碰撞与核反应 → 热',
      explanation:'中子携带约 80% 的 D–T 聚变能，穿出约束磁场后，在周围材料中沉积能量。包层帮助取热和屏蔽；材料辐照与冷却设计也是电站工程的重要任务。',
      sourceIds:['iter-capture','iter-breeding']
    },
    {
      id:'heat-exchange',
      title:'热交换器：传热，不混合燃料与蒸汽',
      formula:'包层 → 冷却剂 → 热交换器 → 发电回路',
      explanation:'冷却剂带走热量，再通过热交换器把热传给另一回路。这条概念路线从第 6 步通向第 8 步，发电侧工质与氘氚燃料分开。ITER 的热量会被排出；这里展示的是未来电站的取热发电方案。',
      sourceIds:['iter-breeding','iter-capture']
    }
  ],
  7: [
    {
      id:'unused-fuel-recovery',
      title:'回收未反应燃料，排出氦灰',
      formula:'未反应 D / T → 分离与净化 → 配比 → 再注入',
      explanation:'排气含未反应的氘氚、氦灰和杂质，处理后把可用燃料送回第 1 步。已经聚变消耗的燃料不能原样收回，损失也需要补充；回收不能无限提供新燃料。',
      sourceIds:['iter-fuelling']
    },
    {
      id:'tritium-breeding',
      title:'氚增殖：用锂和中子制备新的氚',
      formula:'⁶Li + n → ⁴He + T + 能量',
      explanation:'这是含锂增殖包层中的一条主要产氚反应，会消耗锂和中子。未来电站需要提取并补入新氚，还要补充氘、补偿损耗；大规模氚自持仍需验证。燃料回路与取热回路各有任务。',
      sourceIds:['iter-breeding','doe-fuel']
    }
  ],
  8: [
    {
      id:'faraday-generation',
      title:'法拉第电磁感应：转动改变磁通',
      formula:'感应电动势 ε ≈ −N ΔΦ/Δt',
      explanation:'N 是线圈匝数，Φ 是每匝磁通量。蒸汽推动涡轮，转轴带动发电机，使线圈所穿过的磁通随时间变化，产生电动势；接入回路后输出电能。负号表示感应作用会反抗磁通变化。',
      sourceIds:['eia-generator']
    },
    {
      id:'plant-electrical-balance',
      title:'净电力：先扣除全厂自身用电',
      formula:'P净 = η热(P聚变 + P辅助热) − P辅助热/η加热 − P其他',
      explanation:'本概念默认：聚变 2000 MW、辅助热 100 MW、热转换 40%、加热效率 50%、其他用电 120 MW。因此毛电 840 MW，厂用电 320 MW，净电 520 MW。α 能不重复相加；等离子体 Q 不能替代全厂收支。',
      sourceIds:['iter-goals']
    },
    {
      id:'heat-rejection',
      title:'未变成电的能量仍然存在',
      formula:'燃料聚变功率 = 净送出电力 + 最终排出热量（稳态简化）',
      explanation:'热机不能把输入热量全部转成电；冷凝器与冷却系统排出余热。示意模型还把加热转换损耗和其他厂用电最终计入环境热量，忽略包层反应额外放热。以上数字是教学假设，不能当作实际电站业绩。',
      sourceIds:['iter-capture','iter-goals']
    }
  ],
  9: [
    {
      id:'led-light',
      title:'暖白 LED：电能变成光，也产生热',
      formula:'输入电能 → 可见光 + 热',
      explanation:'LED 用半导体发光，白光可由发光芯片配合荧光材料产生；这里用暖白色表现家用灯光。驱动电路和灯珠仍有损耗，需要散热。灯的颜色只是一种视觉选择，不表示聚变电有特殊颜色。',
      sourceIds:['doe-led','energy-star-led']
    },
    {
      id:'load-balance',
      title:'供电需要满足负载，并持续保持平衡',
      formula:'电源与储能放电 ≈ 负载 + 电网损耗 + 储能充电',
      explanation:'灯是负载之一。稳定供电要持续平衡发电、储能和用电需求，不能只看灯是否闪亮。点灯是本概念电站的互动终点；ITER 本身不发电，画面不代表已经实现商业聚变供电。',
      sourceIds:['pjm-balance','iter-goals']
    }
  ]
};
