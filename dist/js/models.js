import * as THREE from '../vendor/three.module.js';

// Every station uses metres only as a drawing convention. These are explanatory
// cutaways of a future plant, rather than an engineering scale model.
const PI = Math.PI;
const TAU = PI * 2;
const C = {
  plasma: '#c084fc', magnetic: '#40e0d0', heat: '#ff985c',
  neutron: '#e5f0ff', current: '#f5d76e', steam: '#87cfff', fuel: '#6be7bd',
};
const geometryCache = new Map();
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitSphere = new THREE.SphereGeometry(1, 16, 12);
const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
const unitCone = new THREE.CylinderGeometry(0.68, 1, 1, 24);
const up = new THREE.Vector3(0, 1, 0);
const dummy = new THREE.Object3D();
const vector = (p) => new THREE.Vector3(...p);
const material = (color, metalness = 0.65, roughness = 0.3) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const luminous = (color, intensity = 2.2) => new THREE.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity: intensity, metalness: 0.1, roughness: 0.25,
});
const haloMaterial = (color, opacity = 0.15) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, blending: THREE.AdditiveBlending,
  depthWrite: false, side: THREE.DoubleSide,
});
const M = {
  metal: material('#647f98'), dark: material('#14283d'), silver: material('#b2c6d6', 0.8, 0.22),
  copper: material('#b77b53', 0.7, 0.26), white: material('#d4e1ec', 0.2, 0.3),
  fuel: luminous(C.fuel), plasma: luminous(C.plasma), magnetic: luminous(C.magnetic),
  heat: luminous(C.heat), steam: luminous(C.steam), current: luminous(C.current),
  neutron: luminous(C.neutron, 3),
};

function torusGeometry(radius, tube = 0.03, arc = TAU, radial = 10, tubular = 64) {
  const key = [radius, tube, arc, radial, tubular].join(':');
  if (!geometryCache.has(key)) geometryCache.set(key, new THREE.TorusGeometry(radius, tube, radial, tubular, arc));
  return geometryCache.get(key);
}

function mesh(parent, geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(...position);
  object.scale.set(...scale);
  object.rotation.set(...rotation);
  parent.add(object);
  return object;
}

function box(parent, mat, position, scale, rotation) {
  return mesh(parent, unitBox, mat, position, scale, rotation);
}

function sphere(parent, mat, position, radius = 0.1, scale = [1, 1, 1]) {
  return mesh(parent, unitSphere, mat, position, scale.map((s) => s * radius));
}

function cylinder(parent, mat, position, radius, height, rotation) {
  return mesh(parent, unitCylinder, mat, position, [radius, height, radius], rotation);
}

function ring(parent, mat, radius, tube, y, position = [0, 0], rotation = [PI / 2, 0, 0]) {
  return mesh(parent, torusGeometry(radius, tube), mat, [position[0], y, position[1]], undefined, rotation);
}

function pipe(parent, mat, points, radius = 0.045, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(vector), closed, 'centripetal');
  const object = mesh(parent, new THREE.TubeGeometry(curve, Math.max(24, points.length * 6), radius, 8, closed), mat);
  return { object, curve };
}

function bar(parent, mat, start, end, radius = 0.035) {
  const a = vector(start), b = vector(end), direction = b.clone().sub(a);
  const object = cylinder(parent, mat, a.clone().add(b).multiplyScalar(0.5).toArray(), radius, direction.length());
  object.quaternion.setFromUnitVectors(up, direction.normalize());
  return object;
}

function instances(parent, geometry, mat, transforms) {
  const object = new THREE.InstancedMesh(geometry, mat, transforms.length);
  transforms.forEach((item, i) => {
    dummy.position.set(...(item.p || [0, 0, 0]));
    dummy.rotation.set(...(item.r || [0, 0, 0]));
    dummy.scale.set(...(item.s || [1, 1, 1]));
    dummy.updateMatrix();
    object.setMatrixAt(i, dummy.matrix);
    if (item.color) object.setColorAt(i, new THREE.Color(item.color));
  });
  object.instanceMatrix.needsUpdate = true;
  object.frustumCulled = false;
  parent.add(object);
  return object;
}

function lines(parent, mat, paths) {
  const points = [];
  paths.forEach((path) => {
    for (let i = 1; i < path.length; i++) points.push(...path[i - 1], ...path[i]);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const object = new THREE.LineSegments(geometry, mat);
  parent.add(object);
  return object;
}

function particleFlow(parent, curve, mat, count = 5, radius = 0.045, speed = 0.16) {
  const particles = instances(parent, unitSphere, mat, Array.from({ length: count }, () => ({ s: [radius, radius, radius] })));
  return (time) => {
    for (let i = 0; i < count; i++) {
      const t = ((time * speed + i / count) % 1 + 1) % 1;
      dummy.position.copy(curve.getPointAt(t));
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(radius * (0.85 + 0.15 * Math.sin(t * TAU)));
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
  };
}

function station(id) {
  const group = new THREE.Group();
  group.name = `station-${id}`;
  const parts = [];
  const updates = [];
  const part = (partId, label, description, layer = 'structure') => {
    const object = new THREE.Group();
    object.name = partId;
    object.userData.partId = partId;
    object.userData.layer = layer;
    group.add(object);
    parts.push({ id: partId, label, description, object });
    return object;
  };
  return {
    group, parts, updates, part,
    update(time, delta = 0) { updates.forEach((run) => run(time, delta)); },
  };
}

function plasma(parent, radius = 0.96, y = 1.02, tube = 0.09) {
  const coreMaterial = luminous(C.plasma, 2.5);
  const core = ring(parent, coreMaterial, radius, tube, y);
  const glow = ring(parent, haloMaterial(C.plasma, 0.18), radius, tube * 2.35, y);
  core.userData.layer = glow.userData.layer = 'plasma';
  return (time) => {
    coreMaterial.emissiveIntensity = 2.3 + 0.45 * Math.sin(time * 1.8);
    glow.material.opacity = 0.13 + 0.035 * Math.sin(time * 1.8);
  };
}

function vesselSegments(parent, radius = 0.96, y = 1.02, tube = 0.24, count = 12, gap = 3) {
  const arc = TAU / count * 0.91;
  const geometry = torusGeometry(radius, tube, arc, 12, 10);
  const segments = [];
  for (let i = 0; i < count; i++) {
    // The front opening deliberately exposes the plasma, like a museum cutaway.
    if (i < gap) continue;
    segments.push({ p: [0, y, 0], r: [PI / 2, 0, i * TAU / count], color: i % 2 ? '#5b7992' : '#7894ab' });
  }
  return instances(parent, geometry, M.metal, segments);
}

function fuelStation() {
  const s = station(1);
  const tanks = s.part('tanks', '氘与氚燃料罐', '氘与氚是氢的同位素。示意罐分别储存两类燃料，再按所需比例送入装置。', 'fuel');
  const tankPositions = [[-0.66, 0.43], [0.2, 0.43]];
  instances(tanks, unitCylinder, M.metal, tankPositions.map(([x, z], i) => ({ p: [x, 0.94, z], s: [0.3, 1.13, 0.3], color: i ? '#4d8b9b' : '#44766e' })));
  instances(tanks, unitSphere, M.metal, tankPositions.flatMap(([x, z], i) => [0.38, 1.51].map((y) => ({ p: [x, y, z], s: [0.3, 0.15, 0.3], color: i ? '#5b9aac' : '#619d88' }))));
  instances(tanks, torusGeometry(0.304, 0.024), M.silver, tankPositions.flatMap(([x, z]) => [0.57, 1.3].map((y) => ({ p: [x, y, z], r: [PI / 2, 0, 0] }))));
  instances(tanks, unitBox, M.fuel, tankPositions.map(([x, z]) => ({ p: [x, 0.99, z + 0.303], s: [0.065, 0.58, 0.025] })));
  instances(tanks, unitCylinder, M.silver, tankPositions.map(([x, z]) => ({ p: [x, 1.69, z], s: [0.09, 0.17, 0.09] })));
  instances(tanks, torusGeometry(0.105, 0.018), M.fuel, tankPositions.map(([x, z]) => ({ p: [x, 1.8, z], r: [PI / 2, 0, 0] })));
  instances(tanks, unitBox, M.dark, tankPositions.flatMap(([x, z]) => [-1, 1].map((side) => ({ p: [x + side * 0.21, 0.2, z], s: [0.09, 0.25, 0.45] }))));
  const injection = s.part('injection', '燃料注入', '经过净化的气体或冷冻小丸可把燃料送入真空室。发光小球只用来表现燃料的运动方向。', 'fuel');
  const route = pipe(injection, M.silver, [[-0.66, 1.8, 0.43], [-0.66, 2.02, 0.3], [0.75, 2.02, 0.3], [1.15, 1.28, 0.02], [1.15, 0.86, -0.43]], 0.055);
  pipe(injection, M.silver, [[0.2, 1.8, 0.43], [0.2, 2.02, 0.3], [0.75, 2.02, 0.3]], 0.055);
  cylinder(injection, M.dark, [1.15, 0.77, -0.43], 0.17, 0.4);
  ring(injection, M.fuel, 0.175, 0.028, 0.72, [1.15, -0.43]);
  s.updates.push(particleFlow(injection, route.curve, M.fuel, 5, 0.06, 0.13));
  return s;
}

function vacuumStation() {
  const s = station(2);
  const vessel = s.part('vessel', '真空室剖面', '金属真空室把等离子体与外界隔开。前方打开的扇区是为便于观察而做的剖切。');
  vesselSegments(vessel);
  ring(vessel, M.silver, 1.09, 0.026, 0.81);
  ring(vessel, M.silver, 1.09, 0.026, 1.23);
  instances(vessel, unitSphere, M.silver, Array.from({ length: 12 }, (_, i) => ({ p: [Math.cos(i * TAU / 12) * 1.16, 1.2, Math.sin(i * TAU / 12) * 1.16], s: [0.032, 0.032, 0.032] })));
  cylinder(vessel, M.dark, [0, 0.73, 0], 0.17, 0.8);
  const plasmaPart = s.part('plasma', '点亮等离子体', '燃料被加热并电离后，形成由自由电子和离子组成的等离子体。紫色环代表被约束的高温燃料。', 'plasma');
  const pulse = plasma(plasmaPart, 0.96, 1.02, 0.105);
  s.updates.push((time) => {
    pulse(time);
    plasmaPart.scale.setScalar(1 + Math.sin(time * 0.8) * 0.008);
  });
  const vacuum = s.part('vacuum', '真空泵与抽气口', '抽气系统减少杂质和残余气体，帮助建立适合等离子体运行的环境。真空本身并不能约束高温等离子体。');
  box(vacuum, M.dark, [-0.55, 0.34, -0.92], [0.56, 0.45, 0.38]);
  cylinder(vacuum, M.metal, [-0.55, 0.65, -0.92], 0.22, 0.28);
  pipe(vacuum, M.silver, [[-0.55, 0.71, -0.92], [-0.55, 0.86, -0.72], [-0.43, 0.96, -0.82]], 0.09);
  ring(vacuum, M.magnetic, 0.22, 0.022, 0.72, [-0.55, -0.92]);
  return s;
}

function heatingStation() {
  const s = station(3);
  const beam = s.part('neutral-beam', '中性束注入器', '高速中性粒子能够穿过磁场进入等离子体，再通过碰撞传递能量。这是常见的辅助加热方式之一。', 'heat');
  box(beam, M.metal, [-0.99, 1.05, -0.29], [0.83, 0.48, 0.5]);
  box(beam, M.dark, [-1.27, 1.05, -0.29], [0.2, 0.55, 0.58]);
  instances(beam, unitBox, M.silver, [-1.17, -0.94, -0.71].map((x) => ({ p: [x, 1.31, -0.29], s: [0.055, 0.08, 0.5] })));
  cylinder(beam, M.heat, [-0.54, 1.05, -0.29], 0.12, 0.16, [0, 0, PI / 2]);
  const beamPath = pipe(beam, haloMaterial(C.heat, 0.42), [[-0.5, 1.05, -0.29], [0.15, 1.05, -0.29], [0.76, 1.05, -0.29]], 0.075);
  s.updates.push(particleFlow(beam, beamPath.curve, M.heat, 6, 0.032, 0.5));
  const antenna = s.part('rf-antenna', '射频天线', '射频波把能量耦合进等离子体，类似用合适频率推动振动。实际装置可组合使用多种加热系统。', 'heat');
  pipe(antenna, M.copper, [[0.72, 0.72, 0.62], [0.72, 1.29, 0.62], [0.26, 1.29, 0.96], [0.26, 0.72, 0.96]], 0.045);
  instances(antenna, unitBox, M.current, Array.from({ length: 6 }, (_, i) => ({ p: [0.49, 0.78 + i * 0.085, 0.8], s: [0.5, 0.025, 0.035], r: [0, 0.64, 0] })));
  const wavePaths = Array.from({ length: 3 }, (_, j) => Array.from({ length: 28 }, (_, i) => {
    const a = -0.4 + i / 27 * 1.7;
    return [Math.cos(a) * (0.55 - j * 0.1), 1.04 + Math.sin(i / 27 * PI) * 0.14, Math.sin(a) * (0.55 - j * 0.1)];
  }));
  const waves = lines(antenna, new THREE.LineBasicMaterial({ color: C.current, transparent: true, opacity: 0.8 }), wavePaths);
  s.updates.push((time) => { waves.material.opacity = 0.45 + Math.sin(time * 3) * 0.25; });
  const plasmaPart = s.part('plasma-heating', '高温等离子体', '强加热让离子具有更高的运动能量，增加发生聚变反应的机会。装置中的温度分布并不是完全均匀的。', 'plasma');
  vesselSegments(plasmaPart, 0.84, 1.04, 0.16, 12, 5);
  instances(plasmaPart, unitBox, M.dark, [-0.56, 0.56].map((z) => ({ p: [0.29, 0.43, z], s: [0.15, 0.7, 0.15] })));
  s.updates.push(plasma(plasmaPart, 0.84, 1.04, 0.085));
  return s;
}

function confinementStation() {
  const s = station(4);
  const coils = s.part('coils', '环向磁场线圈', '围绕环形真空室的线圈产生强磁场。实际托卡马克还需要极向场和等离子体电流共同形成约束磁场。', 'magnetic');
  const coilTransforms = Array.from({ length: 12 }, (_, i) => {
    const a = i * TAU / 12;
    return { p: [Math.cos(a) * 0.94, 1.05, Math.sin(a) * 0.94], r: [0, -a, 0], s: [0.68, 1, 1] };
  });
  instances(coils, torusGeometry(0.48, 0.064), M.copper, coilTransforms);
  instances(coils, torusGeometry(0.48, 0.018), M.current, coilTransforms.map((t) => ({ ...t, s: [0.79, 1.12, 1] })));
  instances(coils, unitBox, M.metal, Array.from({ length: 6 }, (_, i) => {
    const a = i * TAU / 6;
    return { p: [Math.cos(a) * 0.99, 0.43, Math.sin(a) * 0.99], s: [0.12, 0.3, 0.16], r: [0, -a, 0] };
  }));
  cylinder(coils, M.dark, [0, 1.02, 0], 0.15, 1.3);
  instances(coils, torusGeometry(0.17, 0.025), M.copper, Array.from({ length: 9 }, (_, i) => ({ p: [0, 0.57 + i * 0.11, 0], r: [PI / 2, 0, 0] })));
  const field = s.part('field', '螺旋磁力线', '磁力线沿着环形方向前进，同时绕等离子体截面扭转。带电粒子围绕磁力线运动，从而减少与器壁接触。', 'magnetic');
  const fieldPaths = Array.from({ length: 7 }, (_, j) => Array.from({ length: 161 }, (_, i) => {
    const a = i / 160 * TAU;
    const twist = a * 3 + j * TAU / 7;
    const r = 0.94 + 0.245 * Math.cos(twist);
    return [Math.cos(a) * r, 1.05 + 0.245 * Math.sin(twist), Math.sin(a) * r];
  }));
  lines(field, new THREE.LineBasicMaterial({ color: C.magnetic, transparent: true, opacity: 0.85 }), fieldPaths);
  const fieldCurve = new THREE.CatmullRomCurve3(fieldPaths[0].map(vector), true);
  s.updates.push(particleFlow(field, fieldCurve, M.magnetic, 4, 0.035, 0.08));
  const plasmaPart = s.part('plasma-confinement', '被磁场约束的燃料', '等离子体悬浮在环形区域中。这里用稳定的紫色环解释约束目标，真实等离子体还会发生复杂的不稳定性。', 'plasma');
  s.updates.push(plasma(plasmaPart, 0.94, 1.05, 0.075));
  return s;
}

function fusionStation() {
  const s = station(5);
  const fuel = s.part('fuel-nuclei', '氘核与氚核', '氘核含一个质子和一个中子，氚核含一个质子和两个中子。相遇只是示意，真实反应取决于碰撞能量与概率。', 'fuel');
  const deuterium = new THREE.Group(), tritium = new THREE.Group();
  fuel.add(deuterium, tritium);
  instances(deuterium, unitSphere, M.fuel, [{ p: [-0.065, 0, 0], s: [0.14, 0.14, 0.14], color: '#6be7bd' }, { p: [0.065, 0.06, 0], s: [0.14, 0.14, 0.14], color: '#8ad5ef' }]);
  instances(tritium, unitSphere, M.fuel, [{ p: [-0.07, 0.04, 0], s: [0.14, 0.14, 0.14], color: '#6be7bd' }, { p: [0.07, 0.05, 0], s: [0.14, 0.14, 0.14], color: '#8ad5ef' }, { p: [0, -0.09, 0.055], s: [0.14, 0.14, 0.14], color: '#8ad5ef' }]);
  const products = s.part('fusion-products', '氦核与释放的能量', '一次氘氚聚变生成一个氦核和一个中子，总共释放约17.6 MeV。氦核带电，主要把能量留在等离子体内。', 'plasma');
  ring(products, M.dark, 1.18, 0.11, 0.81);
  ring(products, M.plasma, 1.18, 0.023, 0.93);
  instances(products, unitBox, M.metal, [-0.84, 0.84].map((x) => ({ p: [x, 0.4, 0.65], s: [0.12, 0.62, 0.16] })));
  const alpha = new THREE.Group();
  products.add(alpha);
  instances(alpha, unitSphere, M.heat, [[-0.085, 0.05, 0.05], [0.085, 0.05, 0.05], [0, -0.07, -0.065], [0, 0.1, -0.075]].map((p, i) => ({ p, s: [0.135, 0.135, 0.135], color: i < 2 ? '#ffc784' : '#fff2c3' })));
  const flash = sphere(products, haloMaterial(C.current, 0.15), [0, 1.12, 0], 0.36);
  const neutrons = s.part('neutron', '逃逸的中子', '中子不带电，能够穿过磁场，把大部分聚变能量带向包层。图中的多条轨迹表现接连发生的反应。', 'neutron');
  const neutronParticles = instances(neutrons, unitSphere, M.neutron, Array.from({ length: 5 }, () => ({ s: [0.055, 0.055, 0.055] })));
  const trailPaths = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * TAU + 0.25;
    return [[Math.cos(a) * 0.65, 1.18 + Math.sin(a * 2) * 0.13, Math.sin(a) * 0.65], [Math.cos(a) * 1.32, 1.18 + Math.sin(a * 2) * 0.28, Math.sin(a) * 1.32]];
  });
  lines(neutrons, new THREE.LineBasicMaterial({ color: C.neutron, transparent: true, opacity: 0.35 }), trailPaths);
  s.updates.push((time) => {
    const phase = (time * 0.26) % 1;
    const approach = Math.min(phase / 0.58, 1);
    deuterium.position.set(-0.95 * (1 - approach), 1.15, 0.04);
    tritium.position.set(0.95 * (1 - approach), 1.15, -0.04);
    const incoming = phase < 0.58 ? 1 : 0.001;
    deuterium.scale.setScalar(incoming); tritium.scale.setScalar(incoming);
    alpha.position.set(0, 1.15, 0);
    alpha.scale.setScalar(phase >= 0.58 ? 1 : 0.001);
    alpha.rotation.y = time * 0.45;
    flash.scale.setScalar(phase >= 0.58 ? 0.36 * (0.5 + (phase - 0.58) * 2.2) : 0.001);
    flash.material.opacity = phase >= 0.58 ? (1 - (phase - 0.58) / 0.42) * 0.4 : 0;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.25;
      const travel = ((phase + i * 0.17) % 1) * 1.35;
      dummy.position.set(Math.cos(a) * travel, 1.18 + Math.sin(a * 2) * travel * 0.2, Math.sin(a) * travel);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.045);
      dummy.updateMatrix(); neutronParticles.setMatrixAt(i, dummy.matrix);
    }
    neutronParticles.instanceMatrix.needsUpdate = true;
  });
  return s;
}

function blanketStation() {
  const s = station(6);
  const blanket = s.part('blanket', '能量吸收包层', '包层吸收中子携带的能量并转化为热。未来氘氚电站还计划利用含锂材料在包层内增殖氚。', 'heat');
  const blocks = Array.from({ length: 12 }, (_, i) => {
    const a = i * TAU / 12;
    return { p: [Math.cos(a) * 0.79 - 0.22, 0.91, Math.sin(a) * 0.79], r: [0, -a, 0], s: [0.24, 0.6, 0.35], color: i % 2 ? '#bc6c41' : '#e28b50' };
  });
  instances(blanket, unitBox, M.copper, blocks);
  ring(blanket, M.dark, 0.99, 0.045, 0.58, [-0.22, 0]);
  ring(blanket, M.silver, 0.99, 0.035, 1.24, [-0.22, 0]);
  ring(blanket, M.heat, 0.66, 0.07, 0.93, [-0.22, 0]);
  const exchanger = s.part('exchanger', '换热器', '热量通过换热器交给另一条回路。回路之间交换热，不需要让两种流体直接混合。', 'heat');
  cylinder(exchanger, M.metal, [1.02, 0.93, -0.43], 0.29, 1.13);
  instances(exchanger, unitSphere, M.silver, [0.36, 1.5].map((y) => ({ p: [1.02, y, -0.43], s: [0.29, 0.12, 0.29] })));
  instances(exchanger, torusGeometry(0.295, 0.022), M.silver, Array.from({ length: 5 }, (_, i) => ({ p: [1.02, 0.51 + i * 0.21, -0.43], r: [PI / 2, 0, 0] })));
  const coolant = s.part('coolant', '冷热循环管路', '冷却剂把包层里的热量带出。橙色表示较热的流体，蓝色表示放热后的回流；颜色只用于解释能量流。', 'heat');
  const hot = pipe(coolant, M.heat, [[0.47, 1.13, 0.35], [0.8, 1.4, 0.35], [1.25, 1.4, 0.08], [1.25, 1.17, -0.37]], 0.055);
  const cold = pipe(coolant, M.steam, [[1.18, 0.56, -0.43], [1.22, 0.36, 0.24], [0.38, 0.36, 0.45], [0.38, 0.66, 0.45]], 0.055);
  s.updates.push(particleFlow(coolant, hot.curve, M.current, 4, 0.043, 0.18));
  s.updates.push(particleFlow(coolant, cold.curve, M.neutron, 4, 0.04, 0.18));
  return s;
}

function recyclingStation() {
  const s = station(7);
  const separator = s.part('separator', '燃料分离与净化', '排出的混合气体中仍有未反应的燃料。分离和净化系统回收可用的氘氚，并处理氦灰等产物。', 'fuel');
  const towers = [[-0.63, 0.25, 1.12], [0.06, -0.16, 1.48], [0.67, 0.27, 0.96]];
  instances(separator, unitCylinder, M.metal, towers.map(([x, z, h], i) => ({ p: [x, h / 2 + 0.31, z], s: [0.23, h, 0.23], color: i === 1 ? '#648a96' : '#4e6b81' })));
  instances(separator, unitSphere, M.silver, towers.flatMap(([x, z, h]) => [0.31, h + 0.31].map((y) => ({ p: [x, y, z], s: [0.23, 0.11, 0.23] }))));
  instances(separator, torusGeometry(0.236, 0.02), M.silver, towers.flatMap(([x, z, h]) => [0.25, 0.5, 0.75].map((fraction) => ({ p: [x, 0.31 + fraction * h, z], r: [PI / 2, 0, 0] }))));
  instances(separator, unitBox, M.fuel, towers.map(([x, z, h]) => ({ p: [x, h / 2 + 0.31, z + 0.231], s: [0.045, h * 0.62, 0.02] })));
  const recycle = s.part('recycle', '燃料返回管路', '回收燃料回到燃料处理与注入环节。这是一条物质回收支路，与把热量送向汽轮机的能量路线并行。', 'fuel');
  const returnRoute = pipe(recycle, M.silver, [[-1.12, 0.49, 0.55], [-1.12, 1.77, 0.55], [-0.72, 2.02, 0.55], [0.7, 2.02, 0.55], [1.12, 1.77, 0.55], [1.12, 0.49, 0.55], [0.8, 0.25, 0.55], [-0.8, 0.25, 0.55]], 0.045, true);
  instances(recycle, unitCylinder, M.magnetic, [[-1.12, 1.22, 0.55], [1.12, 1.22, 0.55]].map((p) => ({ p, s: [0.09, 0.2, 0.09] })));
  pipe(recycle, M.metal, [[-0.63, 1.55, 0.25], [-0.63, 1.77, 0.25], [0.06, 1.77, -0.16], [0.67, 1.77, 0.27], [0.67, 1.39, 0.27]], 0.04);
  const fuel = s.part('fuel', '再次利用的燃料', '聚变燃料不在一次通过后全部反应。持续回收有助于控制燃料库存，提高燃料利用率。', 'fuel');
  s.updates.push(particleFlow(fuel, returnRoute.curve, M.fuel, 8, 0.052, 0.055));
  sphere(fuel, haloMaterial(C.fuel, 0.12), [0.06, 1.03, -0.16], 0.3, [1, 2.2, 1]);
  return s;
}

function turbineStation() {
  const s = station(8);
  const turbine = s.part('turbine', '旋转的汽轮机', '蒸汽膨胀时推动叶片，把热能转成轴的机械转动。这里采用透明外壳，便于看到持续旋转的叶轮。', 'steam');
  cylinder(turbine, new THREE.MeshStandardMaterial({ color: '#83a9c5', metalness: 0.45, roughness: 0.22, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }), [-0.45, 0.94, 0], 0.48, 0.96, [0, 0, PI / 2]);
  instances(turbine, torusGeometry(0.48, 0.04), M.silver, [-0.93, -0.45, 0.03].map((x) => ({ p: [x, 0.94, 0], r: [0, PI / 2, 0] })));
  const rotor = new THREE.Group();
  rotor.position.set(-0.45, 0.94, 0); turbine.add(rotor);
  cylinder(rotor, M.silver, [0, 0, 0], 0.14, 0.88, [0, 0, PI / 2]);
  instances(rotor, unitBox, M.metal, Array.from({ length: 16 }, (_, i) => {
    const a = (i % 8) * TAU / 8;
    return { p: [i < 8 ? -0.21 : 0.21, Math.cos(a) * 0.28, Math.sin(a) * 0.28], r: [a, 0.3, 0], s: [0.07, 0.4, 0.12] };
  }));
  s.updates.push((time) => { rotor.rotation.x = time * 3.5; });
  const generator = s.part('generator', '发电机', '汽轮机带动发电机转子，变化的磁场在线圈中感应出电流。这一步与常见热力发电站的原理相通。', 'electricity');
  cylinder(generator, M.magnetic, [0.78, 0.94, 0], 0.35, 0.81, [0, 0, PI / 2]);
  instances(generator, unitCylinder, M.dark, [0.35, 1.21].map((x) => ({ p: [x, 0.94, 0], s: [0.37, 0.06, 0.37], r: [0, 0, PI / 2] })));
  cylinder(generator, M.silver, [0.18, 0.94, 0], 0.065, 0.32, [0, 0, PI / 2]);
  instances(generator, unitBox, M.dark, [-0.7, 0.72].map((x) => ({ p: [x, 0.35, 0], s: [0.28, 0.33, 0.67] })));
  instances(generator, unitBox, M.silver, Array.from({ length: 7 }, (_, i) => ({ p: [0.5 + i * 0.085, 1.23, 0], s: [0.025, 0.1, 0.34] })));
  const steam = s.part('steam', '蒸汽输入与冷凝回路', '换热获得的高温蒸汽进入汽轮机，做功后冷凝并返回回路。实际系统的工质和循环形式取决于电站设计。', 'steam');
  const steamRoute = pipe(steam, M.steam, [[-1.21, 1.92, -0.26], [-1.21, 1.62, -0.26], [-0.7, 1.62, -0.26], [-0.7, 1.3, -0.19]], 0.07);
  pipe(steam, M.metal, [[-0.45, 0.52, 0.12], [-0.45, 0.27, 0.12], [0.45, 0.27, 0.55], [1.22, 0.38, 0.55]], 0.07);
  s.updates.push(particleFlow(steam, steamRoute.curve, M.neutron, 4, 0.045, 0.25));
  return s;
}

function lampStation() {
  const s = station(9);
  const lamp = s.part('lamp', '点亮一盏灯', '电能送到灯具后转化为光和热。灯光是这条概念能量旅程的终点，也把宏大的聚变研究连接到日常生活。', 'electricity');
  cylinder(lamp, M.dark, [0.18, 0.46, 0], 0.29, 0.43);
  cylinder(lamp, M.white, [0.18, 0.73, 0], 0.22, 0.2);
  cylinder(lamp, M.copper, [0.18, 0.97, 0], 0.18, 0.31);
  instances(lamp, torusGeometry(0.183, 0.021), M.silver, Array.from({ length: 5 }, (_, i) => ({ p: [0.18, 0.84 + i * 0.061, 0], r: [PI / 2, 0, 0] })));
  const glass = sphere(lamp, new THREE.MeshPhysicalMaterial({ color: '#fff0ba', emissive: '#f9c45e', emissiveIntensity: 0.38, metalness: 0, roughness: 0.18, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }), [0.18, 1.63, 0], 0.52, [1, 1.16, 1]);
  mesh(lamp, unitCone, new THREE.MeshStandardMaterial({ color: '#ffeac0', emissive: '#f9c45e', emissiveIntensity: 0.35, roughness: 0.3, transparent: true, opacity: 0.28, depthWrite: false }), [0.18, 1.16, 0], [0.29, 0.3, 0.29]);
  const filamentRoute = [[-0.02, 1.18, 0], [-0.02, 1.59, 0], [0.02, 1.72, 0], [0.09, 1.58, 0], [0.16, 1.72, 0], [0.23, 1.58, 0], [0.3, 1.72, 0], [0.36, 1.59, 0], [0.36, 1.18, 0]];
  pipe(lamp, M.current, filamentRoute, 0.018);
  const glow = sphere(lamp, haloMaterial('#ffd98a', 0.12), [0.18, 1.58, 0], 0.73, [1, 1.15, 1]);
  sphere(lamp, haloMaterial('#fff0ac', 0.2), [0.18, 1.61, 0], 0.3, [1, 1.1, 1]);
  const light = new THREE.PointLight('#ffd98a', 1.3, 4, 2);
  light.position.set(0.18, 1.6, 0); lamp.add(light);
  s.updates.push((time) => {
    const pulse = 1 + Math.sin(time * 1.2) * 0.025;
    glow.scale.set(0.73 * pulse, 0.73 * 1.15 * pulse, 0.73 * pulse);
    glass.material.emissiveIntensity = 0.38 + Math.sin(time * 1.2) * 0.025;
  });
  const input = s.part('electric-line', '电力输入', '这里把电线中的能量传递画成向前运动的光点。它们表示能量流向，不代表电子在电线中的实际运动速度。', 'electricity');
  const inputRoute = pipe(input, M.dark, [[-1.35, 0.2, 0.38], [-1.08, 0.2, 0.38], [-0.93, 0.2, 0.68], [-0.56, 0.2, 0.68], [-0.25, 0.2, 0.32], [0.18, 0.3, 0]], 0.042);
  s.updates.push(particleFlow(input, inputRoute.curve, M.current, 5, 0.042, 0.18));
  box(input, M.dark, [-1.33, 0.22, 0.38], [0.18, 0.2, 0.25]);
  instances(input, unitBox, M.silver, [-0.055, 0.055].map((z) => ({ p: [-1.46, 0.22, 0.38 + z], s: [0.12, 0.045, 0.04] })));
  return s;
}

const BUILDERS = [fuelStation, vacuumStation, heatingStation, confinementStation, fusionStation, blanketStation, recyclingStation, turbineStation, lampStation];

/** Build a self-contained, selectable and animated explanatory station. */
export function buildModel(id) {
  if (!Number.isInteger(id) || id < 1 || id > BUILDERS.length) throw new RangeError('Station id must be an integer from 1 to 9.');
  const model = BUILDERS[id - 1]();
  model.group.userData.stationId = id;
  model.parts.forEach((part) => part.object.traverse((object) => {
    object.userData.partId = part.id;
    object.userData.stationId = id;
    if (!object.userData.layer) object.userData.layer = part.object.userData.layer;
  }));
  model.update(0, 0);
  return { group: model.group, parts: model.parts, update: model.update.bind(model) };
}
