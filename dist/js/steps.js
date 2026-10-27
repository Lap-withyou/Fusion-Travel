// A future D–T tokamak power plant, simplified for learning.
// Station numbers describe the learning order, not a single material pipeline.
export const STEPS = [
  {
    id: 1,
    title: '燃料准备与注入',
    shortTitle: '燃料准备',
    english: 'FUEL PREPARATION & INJECTION',
    color: '#6be7bd',
    position: [-7, 0, -7],
    summary: [
      '旅程从氢的两种同位素——氘（D）和氚（T）开始。',
      '先抽走空气与杂质，再把少量燃料送入真空室；补充燃料还可以使用冷冻小丸。'
    ],
    principle: '氘和氚的原子核都带正电。它们是这座概念电站选择的燃料，注入时还没有发生聚变。',
    metric: { value: 'D + T', label: '两种氢同位素 · 教学示意' },
    partNotes: {
      tanks: 'D 是氘，T 是氚。图中的储罐帮助区分燃料，尺寸与数量不代表工程配置。',
      injection: '送入燃料与给燃料加热是不同任务。注气适合初始充气，冷冻小丸可以把燃料送得更深。'
    }
  },
  {
    id: 2,
    title: '等离子体形成（击穿）',
    shortTitle: '形成等离子体',
    english: 'PLASMA BREAKDOWN',
    color: '#c084fc',
    position: [0, 0, -7],
    summary: [
      '电场使电子获得能量，碰撞让更多电子脱离原子，气体逐渐被电离。',
      '这个启动过程叫“击穿”，形成的带电粒子群就是等离子体。'
    ],
    principle: '等离子体中有正离子和自由电子，整体通常近似电中性。击穿只是建立等离子体，距离适合聚变的状态还需要继续加热。',
    metric: { value: '气体 → 等离子体', label: '物态转变 · 教学示意' },
    partNotes: {
      vessel: '真空室提供受控环境。它不是靠直接接触来盛住炽热的等离子体。',
      plasma: '紫色光环代表等离子体的位置；真实粒子运动远比画面复杂。',
      vacuum: '先排出空气和杂质，能减少对等离子体的污染与冷却。'
    }
  },
  {
    id: 3,
    title: '加热与电流驱动',
    shortTitle: '加热与驱动',
    english: 'HEATING & CURRENT DRIVE',
    color: '#ff985c',
    position: [7, 0, -7],
    summary: [
      '欧姆加热、中性束注入和射频波，把能量交给等离子体粒子。',
      '中性束先以不带电的高速原子穿入磁场，再通过碰撞传递能量；合适的束流和波也能帮助驱动等离子体电流。'
    ],
    principle: '温度反映粒子随机运动的剧烈程度。电流驱动则帮助维持和调节电流分布，两者作用相关，任务有所不同。',
    metric: { value: '欧姆 · 束流 · 射频', label: '三类加热方式 · 教学示意' },
    partNotes: {
      'neutral-beam': '中性原子便于穿入约束磁场。进入等离子体后，它们会被电离，并把能量逐步传给其他粒子。',
      'rf-antenna': '射频波可在合适频率下有效地向粒子传递能量。不同波与注入方式承担不同的加热、驱动或控制任务。',
      'plasma-heating': '等离子体电流可以产生欧姆热，但温度升高后这种加热效率下降，因此还需要辅助加热。'
    }
  },
  {
    id: 4,
    title: '磁约束',
    shortTitle: '磁约束',
    english: 'MAGNETIC CONFINEMENT',
    color: '#40e0d0',
    position: [7, 0, 0],
    summary: [
      '磁场像看不见的轨道，引导带电粒子绕着磁力线运动。',
      '环向磁场与极向磁场组合成螺旋结构，帮助把高温等离子体保持在环形区域内。'
    ],
    principle: '线圈和等离子体电流共同参与形成约束磁场，控制系统持续调节等离子体的位置与形状。磁约束从启动阶段就已参与工作，这里单独展开观察。',
    metric: { value: '螺旋磁场', label: '约束方向 · 教学示意' },
    partNotes: {
      coils: '不同线圈承担产生环向磁场、塑形和位置控制等任务；超导线圈还需要独立的低温系统。',
      field: '发光曲线是磁力线的可视化，表示磁场方向，空间中并没有实体轨道。',
      'plasma-confinement': '磁场主要约束带电粒子。聚变产生的不带电中子会穿出约束磁场。'
    }
  },
  {
    id: 5,
    title: '聚变反应',
    shortTitle: '聚变反应',
    english: 'FUSION REACTION',
    color: '#e5f0ff',
    position: [0, 0, 0],
    summary: [
      '在合适的温度、密度和约束条件下，一部分氘核与氚核发生聚变。',
      '每次反应产生一个氦核和一个中子，释放的能量先表现为产物的动能。'
    ],
    principle: '带电的氦核留在等离子体中继续加热燃料，中子则把大部分反应能量带向外围。并非每次粒子相遇都会发生聚变。',
    metric: { value: 'D + T → He + n', label: '反应产物 · 教学示意' },
    partNotes: {
      'fuel-nuclei': '温度越高，粒子的典型运动越快；同时还需要足够密度和足够好的能量约束。',
      'fusion-products': '这里的 He 是氦原子核，也叫 α 粒子；它与中子共同携带反应释放的能量。',
      neutron: '中子不带电，因此不会像带电粒子那样被约束磁场留住。画面的轨迹经过放大和放慢。'
    }
  },
  {
    id: 6,
    title: '能量导出（包层与热交换）',
    shortTitle: '导出热量',
    english: 'BLANKET & HEAT EXTRACTION',
    color: '#ff985c',
    position: [-7, 0, 0],
    summary: [
      '中子进入周围的包层，把动能交给材料，转化成热。',
      '冷却剂带走热量，再通过热交换器把热传给发电回路；能量沿着 6 → 8 继续前进。'
    ],
    principle: '包层既参与收集能量，也保护外部部件。未来含锂的增殖包层还计划生产氚；这些工程能力仍需验证和完善。',
    metric: { value: '粒子动能 → 热', label: '能量转化 · 教学示意' },
    partNotes: {
      blanket: '面向未来电站的增殖包层可承担取热、屏蔽和产氚等任务。它与 ITER 的常规屏蔽包层不能直接等同。',
      exchanger: '热交换器传递热量。本示意用分开的管路表示两个流体回路，不需要把燃料送入涡轮。',
      coolant: '冷却剂的材料和温度取决于电站设计；图中的颜色表示热量流动，不代表具体工质。'
    }
  },
  {
    id: 7,
    title: '燃料回收与再注入（闭环节点）',
    shortTitle: '回收燃料',
    english: 'FUEL RECOVERY & REINJECTION',
    color: '#6be7bd',
    position: [-7, 0, 7],
    summary: [
      '排出的气体里还含有未反应的氘、氚，以及氦灰和杂质。',
      '处理系统分离、净化燃料，再沿 7 → 1 返回燃料入口。',
      '这是燃料旁路闭环；发电所需的热量走 6 → 8。'
    ],
    principle: '回收减少未反应燃料的浪费，移走氦灰有助于保持等离子体成分。闭环仍需要补充燃料，并处理损耗与氚供给问题。',
    metric: { value: '07 ↺ 01', label: '燃料回路 · 非热量路径' },
    partNotes: {
      separator: '分离系统把可再用的氢同位素与氦灰、杂质分开，之后还需净化和配比。',
      recycle: '回流箭头回到第 1 步。编号表示参观顺序，燃料流与能量流具有各自的路径。',
      fuel: '循环的主要是未反应燃料。未来电站还需从增殖包层提取新生成的氚，以补足消耗。'
    }
  },
  {
    id: 8,
    title: '发电（蒸汽→涡轮→发电机）',
    shortTitle: '蒸汽发电',
    english: 'STEAM → TURBINE → GENERATOR',
    color: '#87cfff',
    position: [0, 0, 7],
    summary: [
      '在这座未来概念电站中，第 6 步送来的热量使发电回路产生蒸汽。',
      '蒸汽推动涡轮旋转，涡轮带动发电机，把机械能转化为电能。'
    ],
    principle: '发电机依靠电磁感应发电。蒸汽随后冷凝并循环使用，部分热量必须排出；只有扣除加热、磁体和其他系统用电后，才能谈净发电。',
    metric: { value: '热 → 转动 → 电', label: '能量链 · 概念演示' },
    partNotes: {
      turbine: '蒸汽通过叶片推动转轴。叶轮动画表示能量转换，不对应实际转速或功率。',
      generator: '转动改变线圈所穿过的磁通量，产生感应电动势；接入回路后便可输出电能。',
      steam: '蒸汽属于发电侧工质，和等离子体中的氘氚燃料分属不同系统。'
    }
  },
  {
    id: 9,
    title: '点亮一盏灯',
    shortTitle: '点亮一盏灯',
    english: 'LIGHT THE LAMP',
    color: '#f5d76e',
    position: [7, 0, 7],
    summary: [
      '电能沿闭合回路来到灯泡，转化为光和热。',
      '点亮这盏灯，回看从原子核到日常用电的整条能量旅程。',
      '这是未来聚变电站的概念演示；ITER 本身不发电，也不向电网供电。'
    ],
    principle: '从聚变到用电，要经过能量收集、热交换、机械转换和电力系统。灯亮表示你完成了互动旅程，不代表商业聚变供电已实现。',
    metric: { value: '1 盏灯', label: '互动目标 · 非电站出力' },
    partNotes: {
      lamp: '灯泡把电能转化成光与热。这里用一盏灯，把抽象的能量流连接到生活。',
      'electric-line': '电流需要完整回路。发光粒子只用于提示传输方向，不代表真实电子速度。'
    }
  }
];

export const CONCEPTS = [
  { id: 'fuel', label: '燃料', color: '#6be7bd', description: '氘与氚进入等离子体；未反应燃料经过分离和净化，再回到注入口。' },
  { id: 'plasma', label: '等离子体', color: '#c084fc', description: '由离子和自由电子组成的物质状态，是磁约束聚变发生的环境。' },
  { id: 'magnetic', label: '磁场', color: '#40e0d0', description: '引导带电粒子运动，并帮助控制等离子体的形状与位置；曲线是方向示意。' },
  { id: 'heat', label: '热量', color: '#ff985c', description: '聚变产物的能量被材料吸收后形成热，由冷却剂从包层送往热交换系统。' },
  { id: 'neutron', label: '中子', color: '#e5f0ff', description: '不带电的聚变产物，携带大部分氘氚反应能量，能够穿出约束磁场。' },
  { id: 'current', label: '电流', color: '#f5d76e', description: '等离子体电流参与加热和磁场形成；发电机输出电能则属于另一套电路。' },
  { id: 'steam', label: '蒸汽', color: '#87cfff', description: '发电侧工质受热后形成蒸汽，推动涡轮，再经冷凝回到循环中。' }
];

export const SOURCES = [
  { title: 'ITER · 燃料注入与闭合燃料循环', url: 'https://www.iter.org/machine/supporting-systems/fuelling' },
  { title: 'ITER · 外部加热与中性束注入', url: 'https://www.iter.org/machine/supporting-systems/external-heating-systems' },
  { title: 'ITER · 磁体系统', url: 'https://www.iter.org/machine/magnets' },
  { title: 'ITER · 聚变条件与能量收集', url: 'https://www.iter.org/fusion-energy/making-it-work' },
  { title: 'ITER · 增殖包层与热交换', url: 'https://www.iter.org/machine/supporting-systems/tritium-breeding' },
  { title: 'EUROfusion · DEMO 概念设计与未来发电', url: 'https://www.eurofusion.org/programme/demo/' },
  { title: 'ITER · 实验目标与不发电的边界', url: 'https://www.iter.org/fusion-energy/what-will-iter-do' },
  { title: 'IAEA · 聚变基础问答', url: 'https://www.iaea.org/topics/energy/fusion/faqs' }
];
