import * as THREE from '../vendor/three.module.js';
import { buildNeutralBeam, NBI_LAYOUT } from './nbi.js';

// Industrial explanatory cutaway. One shared plasma chamber serves every lesson.
// Dimensions are drawing conventions, not a specification for a licensed plant.
const PI = Math.PI, TAU = PI * 2, CORE_Y = 3.05, MAJOR = 2.8;
const UP = new THREE.Vector3(0, 1, 0);
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 20);
const UNIT_SPHERE = new THREE.SphereGeometry(1, 10, 8);
const UNIT_BOLT = new THREE.CylinderGeometry(1, 1, 1, 6);
const TEMP = new THREE.Object3D();
const V = p => new THREE.Vector3(...p);
const polar = (r, a, y = 0) => [r * Math.cos(a), y, r * Math.sin(a)];
const steel = (color, metalness = .72, roughness = .38) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
// The straight beam passes through a real opening in the cutaway vessel and
// cryostat. Transform each shell point into the injector's rotated coordinates.
function inNeutralBeamPort(point, halfWidth = .57, halfHeight = .52) {
  const [x, y, z] = point, c = Math.cos(NBI_LAYOUT.rotationY), s = Math.sin(NBI_LAYOUT.rotationY);
  const axial = x * c - z * s, transverse = x * s + z * c;
  return axial < -1.25 && Math.abs(y - CORE_Y) < halfHeight && Math.abs(transverse - NBI_LAYOUT.axisZ) < halfWidth;
}

function solid(parent, geometry, material, p = [0, 0, 0], s = [1, 1, 1], rotation = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...p); m.scale.set(...s); m.rotation.set(...rotation);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent, material, p, s, rotation) { return solid(parent, UNIT_BOX, material, p, s, rotation); }
function cylinder(parent, material, p, radius, height, rotation) {
  return solid(parent, UNIT_CYLINDER, material, p, [radius, height, radius], rotation);
}
function tube(parent, material, points, radius = .04, closed = false, segments = 80) {
  const curve = new THREE.CatmullRomCurve3(points.map(V), closed, 'centripetal');
  return solid(parent, new THREE.TubeGeometry(curve, segments, radius, 8, closed), material);
}
function torus(parent, material, radius, minor, y, arc = TAU, start = 0, x = 0, z = 0) {
  const m = solid(parent, new THREE.TorusGeometry(radius, minor, 8, Math.max(16, Math.ceil(arc * 20)), arc), material, [x, y, z]);
  m.rotation.x = PI / 2; m.rotation.z = start; return m;
}
function instance(parent, geometry, material, transforms) {
  const m = new THREE.InstancedMesh(geometry, material, transforms.length);
  transforms.forEach((t, i) => {
    TEMP.position.set(...(t.p || [0, 0, 0])); TEMP.scale.set(...(t.s || [1, 1, 1]));
    TEMP.rotation.set(0, 0, 0); TEMP.quaternion.identity();
    if (t.q) TEMP.quaternion.copy(t.q);
    else if (t.r) TEMP.rotation.set(...t.r);
    TEMP.updateMatrix(); m.setMatrixAt(i, TEMP.matrix);
  });
  m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true;
  parent.add(m); return m;
}
function strutTransform(a, b, width = .1, depth = width) {
  const from = V(a), to = V(b), mid = from.clone().add(to).multiplyScalar(.5), d = to.sub(from);
  return { p: mid.toArray(), s: [width, d.length(), depth], q: new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()) };
}
function radialQuaternion(phi, theta = 0) {
  const x = new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi));
  const z = new THREE.Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(theta) / 1.36, Math.sin(phi) * Math.cos(theta)).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// Closed solid shell with polished cut faces, instead of overlapping whole donuts.
function vesselSector(start, arc, inner, outer, subdivisions = 13) {
  const p = [], indices = [], poloidal = 32;
  const point = (phi, theta, minor) => [(MAJOR + minor * Math.cos(theta)) * Math.cos(phi), CORE_Y + minor * 1.36 * Math.sin(theta), (MAJOR + minor * Math.cos(theta)) * Math.sin(phi)];
  for (const radius of [outer, inner]) {
    for (let i = 0; i <= subdivisions; i++) for (let j = 0; j <= poloidal; j++) p.push(...point(start + arc * i / subdivisions, TAU * j / poloidal, radius));
  }
  const row = poloidal + 1, layer = row * (subdivisions + 1);
  for (let side = 0; side < 2; side++) for (let i = 0; i < subdivisions; i++) for (let j = 0; j < poloidal; j++) {
    const a = side * layer + i * row + j, b = a + row;
    const center = [0, 1, 2].map(k => (p[a * 3 + k] + p[(a + 1) * 3 + k] + p[b * 3 + k] + p[(b + 1) * 3 + k]) / 4);
    if (inNeutralBeamPort(center)) continue;
    if (side === 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
    else indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  for (const i of [0, subdivisions]) for (let j = 0; j < poloidal; j++) {
    const a = i * row + j, b = a + layer;
    const center = [0, 1, 2].map(k => (p[a * 3 + k] + p[(a + 1) * 3 + k] + p[b * 3 + k] + p[(b + 1) * 3 + k]) / 4);
    if (inNeutralBeamPort(center)) continue;
    if (i === 0) indices.push(a, b, a + 1, b, b + 1, a + 1);
    else indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

// Reusable D-shaped toroidal-field magnet, with an actual open central aperture.
function dCoilGeometry(width, depth) {
  const pts = [[1.24, 1.12], [1.24, 4.9], [1.45, 5.25], [2.4, 5.42], [3.38, 5.15], [3.95, 4.45], [4.13, 3.12], [3.94, 1.68], [3.35, 1.06], [2.35, .82], [1.48, .9]].map(p => new THREE.Vector3(p[0], p[1], 0));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const positions = [], indices = [], steps = 88;
  for (let i = 0; i <= steps; i++) {
    const p = curve.getPointAt((i % steps) / steps), t = curve.getTangentAt((i % steps) / steps);
    const nx = -t.y, ny = t.x;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) positions.push(p.x + nx * width * sx / 2, p.y + ny * width * sx / 2, depth * sz / 2);
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < 4; j++) {
    const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c = (i + 1) * 4 + j, d = (i + 1) * 4 + (j + 1) % 4;
    indices.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

function buildPit(parent, M) {
  const pit = new THREE.Group(); pit.name = 'reactor-civil-foundation'; parent.add(pit);
  box(pit, M.concrete, [0, .12, 0], [7.5, .24, 7.5]);
  const blocks = [], beams = [], bolts = [];
  for (const x of [-3.55, 3.55]) {
    blocks.push({ p: [x, .38, 0], s: [.42, .52, 6.85] });
    beams.push({ p: [x, .7, 0], s: [.48, .12, 6.9] });
  }
  for (const z of [-3.55, 3.55]) blocks.push({ p: [0, .38, z], s: [6.85, .52, .42] });
  for (let i = 0; i < 12; i++) {
    const a = TAU * i / 12, p = polar(3.45, a, .87);
    beams.push({ p, s: [.5, .32, .55], r: [0, -a, 0] });
    beams.push(strutTransform(polar(3.15, a, .53), polar(3.68, a, 1.42), .15, .19));
    for (const dx of [-.15, .15]) bolts.push({ p: [p[0] + dx, 1.047, p[2]], s: [.045, .035, .045] });
  }
  instance(pit, UNIT_BOX, M.concrete, blocks); instance(pit, UNIT_BOX, M.darkSteel, beams); instance(pit, UNIT_BOLT, M.stainless, bolts);
  // Rear maintenance mezzanine, grated deck and a rail-mounted service gantry.
  const deck = [], rails = [], posts = [];
  for (let i = 0; i < 29; i++) {
    const a = (122 + i * 5.4) * PI / 180;
    deck.push({ p: polar(4.3, a, 1.08), s: [.53, .1, .63], r: [0, -a, 0] });
    if (i % 3 === 0) {
      posts.push({ p: polar(4.58, a, 1.6), s: [.045, .95, .045] });
      posts.push(strutTransform(polar(4.05, a, .28), polar(4.27, a, 1.01), .08));
    }
  }
  instance(pit, UNIT_BOX, M.grating, deck); instance(pit, UNIT_BOX, M.darkSteel, posts);
  for (const y of [1.48, 2.04]) torus(pit, M.rail, 4.58, .026, y, 151 * PI / 180, 122 * PI / 180);
  for (const x of [-4.55, 4.55]) {
    rails.push({ p: [x, 3.26, -1.9], s: [.18, 5.85, .2] });
    rails.push({ p: [x, 6.22, -.95], s: [.16, .18, 3.3] });
    rails.push({ p: [x, .42, -1.9], s: [.65, .18, .65] });
    rails.push(strutTransform([x, 5.35, -1.9], [x, 6.15, -.95], .08));
  }
  rails.push({ p: [0, 6.22, -1.9], s: [9.28, .24, .2] });
  instance(pit, UNIT_BOX, M.gantry, rails);
  box(pit, M.darkSteel, [-.5, 6.0, -1.9], [.75, .3, .5]);
  box(pit, M.copper, [-.5, 5.73, -1.9], [.25, .22, .24]);
  return pit;
}

export function buildReactor() {
  const group = new THREE.Group(); group.name = 'integrated-tokamak';
  const parts = [], explode = [], coilsMoving = [];
  const M = {
    stainless: steel('#a9b5bc', .85, .29), silver: steel('#c5cdd0', .78, .34), shell: steel('#919da5', .82, .4),
    darkSteel: steel('#46545e', .75, .44), graphite: steel('#343e43', .35, .62), copper: steel('#ab7955', .78, .37),
    insulation: steel('#c7bba7', .25, .63), tile: steel('#9fa9a9', .6, .5), concrete: steel('#aeb3b1', .02, .89),
    rail: steel('#b7a66d', .55, .49), grating: steel('#6c797f', .78, .56), gantry: steel('#7c8e98', .75, .45),
    red: steel('#926452', .5, .44), cold: steel('#5b8998', .55, .45), black: steel('#252d33', .3, .56),
    plasma: new THREE.MeshStandardMaterial({ color: '#a45cdd', emissive: '#a449d2', emissiveIntensity: 1.7, roughness: .3, metalness: .1 }),
    plasmaEdge: new THREE.MeshBasicMaterial({ color: '#a370d5', transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending }),
    field: new THREE.MeshBasicMaterial({ color: '#58aeb7', transparent: true, opacity: .3, depthWrite: false }),
    alpha: new THREE.MeshStandardMaterial({ color: '#ffc269', emissive: '#ed9a36', emissiveIntensity: 1.7, roughness: .3 }),
    neutron: new THREE.MeshBasicMaterial({ color: '#d7e7d2', transparent: true, opacity: .75 }),
    beam: new THREE.MeshBasicMaterial({ color: '#b092db', transparent: true, opacity: .5, depthWrite: false }),
  };
  function part(id, label, description, stepIds) {
    const object = new THREE.Group(); object.name = id; object.userData.partId = id; group.add(object);
    const item = { id, label, description, object, stepIds }; parts.push(item); return object;
  }
  function moving(object, direction) { explode.push({ object, base: object.position.clone(), direction: V(direction) }); }
  buildPit(group, M);

  const vessel = part('vessel', '双壁真空室', '分段不锈钢双壁真空室围成同一个环形反应腔，前侧剖开以显示内部层次。它支撑包层与端口，并把高温等离子体同外部设备隔开。', [2]);
  const blanket = part('blanket', '可更换包层模块', '真空室内壁的模块化包层接收聚变中子的能量，再把热量传给厂内冷却回路。示意包层也代表未来电站的氚增殖区域，实际材料与结构随设计方案变化。', [6]);
  // The 120° service cutaway opens toward the overview camera at +X,+Z.
  const sectorCount = 12, first = 110 * PI / 180, span = 240 * PI / 180 / sectorCount;
  const vesselBoltGeo = UNIT_BOLT, seamRibs = [];
  for (let i = 0; i < sectorCount; i++) {
    const a = first + i * span, mid = a + span / 2;
    const sector = new THREE.Group(); sector.name = `vessel-sector-${i + 1}`; vessel.add(sector);
    solid(sector, vesselSector(a + .006, span - .012, 1.0, 1.095), M.stainless);
    solid(sector, vesselSector(a + .009, span - .018, .944, .971), M.darkSteel);
    const ribs = [], bolts = [];
    for (let j = 0; j < 28; j++) {
      const t = TAU * j / 28, p = polar(MAJOR + 1.12 * Math.cos(t), a, CORE_Y + 1.12 * 1.36 * Math.sin(t));
      ribs.push({ p, s: [.055, .055, .1], q: radialQuaternion(a, t) });
      if (j % 2 === 0) bolts.push({ p: polar(MAJOR + 1.14 * Math.cos(t), a + .025, CORE_Y + 1.14 * 1.36 * Math.sin(t)), s: [.037, .04, .037], q: new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(-Math.sin(a), 0, Math.cos(a))) });
    }
    instance(sector, UNIT_BOX, M.darkSteel, ribs); instance(sector, vesselBoltGeo, M.silver, bolts);
    moving(sector, [Math.cos(mid) * 1.1, .14 + .1 * (i % 2), Math.sin(mid) * 1.1]);
    const module = new THREE.Group(); module.name = `blanket-sector-${i + 1}`; blanket.add(module);
    const tiles = [], trim = [];
    for (let k = 0; k < 5; k++) for (let j = 0; j < 22; j++) {
      const phi = a + span * (k + .5) / 5, t = TAU * (j + .5) / 22, minor = .895;
      const p = polar(MAJOR + minor * Math.cos(t), phi, CORE_Y + minor * 1.36 * Math.sin(t));
      if (inNeutralBeamPort(p, .61, .54)) continue;
      const perimeter = Math.hypot(Math.sin(t), 1.36 * Math.cos(t));
      (j % 5 === 0 ? trim : tiles).push({ p, s: [(MAJOR + minor * Math.cos(t)) * span / 5 * .91, minor * TAU / 22 * perimeter * .9, .072], q: radialQuaternion(phi, t) });
    }
    instance(module, UNIT_BOX, M.tile, tiles); instance(module, UNIT_BOX, M.insulation, trim);
    moving(module, [Math.cos(mid) * .58, -.1, Math.sin(mid) * .58]);
  }

  const coils = part('coils', '超导磁体与中心螺线管', '围绕同一真空室的 D 形环向场磁体与水平极向场线圈共同约束等离子体，中央螺线管参与启动与电流驱动。磁体需要低温与电源辅助系统，示意图中的铜色线条用于辨认绕组。', [4]);
  const caseGeometry = dCoilGeometry(.31, .3), windingGeometry = dCoilGeometry(.205, .322);
  const clampGeometry = new THREE.BoxGeometry(.48, .15, .45);
  for (let i = 0; i < 18; i++) {
    // Two nearest magnet positions are removed with the vessel service cutaway.
    if (i === 1 || i === 2) continue;
    const a = TAU * i / 18, magnet = new THREE.Group(); magnet.rotation.y = -a; magnet.name = `tf-magnet-${String(i + 1).padStart(2, '0')}`; coils.add(magnet);
    solid(magnet, caseGeometry, M.silver); solid(magnet, windingGeometry, M.copper);
    const clamps = [];
    for (const [r, y] of [[1.26, 1.35], [1.26, 2.4], [1.26, 3.7], [1.26, 4.75], [2.3, 5.39], [3.58, 4.99], [4.1, 3.2], [3.78, 1.4], [2.3, .83]]) clamps.push({ p: [r, y, 0] });
    instance(magnet, clampGeometry, M.darkSteel, clamps);
    const windingLines = [];
    for (let k = 0; k < 27; k++) windingLines.push({ p: [1.07, 1.39 + k * .124, 0], s: [.025, .022, .34] });
    instance(magnet, UNIT_BOX, M.insulation, windingLines);
    moving(magnet, [Math.cos(a) * 1.05, .8 + .15 * (i % 2), Math.sin(a) * 1.05]); coilsMoving.push(magnet);
  }
  const solenoid = new THREE.Group(); solenoid.name = 'central-solenoid'; coils.add(solenoid);
  cylinder(solenoid, M.darkSteel, [0, 3.02, 0], .61, 4.36);
  const windings = [], bands = [];
  for (let j = 0; j < 58; j++) windings.push({ p: [0, 1.02 + j * .07, 0], s: [.72, .046, .72] });
  instance(solenoid, UNIT_CYLINDER, M.copper, windings);
  for (let j = 0; j < 7; j++) bands.push({ p: [0, 1.0 + j * .67, 0], s: [.76, .11, .76] });
  instance(solenoid, UNIT_CYLINDER, M.stainless, bands);
  moving(solenoid, [0, 1.25, 0]);
  const pf = new THREE.Group(); pf.name = 'poloidal-field-coils'; coils.add(pf);
  for (const [r, y, minor] of [[1.7, .78, .1], [3.5, .74, .13], [4.12, 1.63, .11], [4.13, 4.51, .11], [3.54, 5.47, .13], [1.75, 5.55, .1]]) {
    // Upper front sector is cut away to expose the layered chamber.
    torus(pf, M.copper, r, minor, y, 250 * PI / 180, 104 * PI / 180);
  }
  moving(pf, [0, .58, 0]);

  const cryostat = new THREE.Group(); cryostat.name = 'cutaway-cryostat'; group.add(cryostat);
  const cryoMaterial = steel('#b7c1c5', .7, .45);
  for (let i = 0; i < 5; i++) {
    const start = (119 + i * 40) * PI / 180, arc = 39 * PI / 180, mid = start + arc / 2;
    const panel = new THREE.Group(); panel.name = `cryostat-panel-${i + 1}`; cryostat.add(panel);
    // Cylinder angles run in the opposite direction to the toroidal convention.
    const shellSection = (sectionStart, sectionArc, bottom, top) => {
      if (sectionArc <= 0) return;
      const shell = new THREE.CylinderGeometry(4.37, 4.37, top - bottom, 18, 1, true, PI / 2 - sectionStart - sectionArc, sectionArc);
      solid(panel, shell, cryoMaterial, [0, (bottom + top) / 2, 0]);
    };
    if (i === 0) {
      shellSection(start, arc, .695, 2.49); shellSection(start, arc, 3.61, 5.545);
      shellSection(start, 4 * PI / 180, 2.49, 3.61);
      shellSection(144 * PI / 180, 14 * PI / 180, 2.49, 3.61);
    } else shellSection(start, arc, .695, 5.545);
    const ribs = [];
    for (const y of [.72, 1.0, 3.1, 5.15, 5.52]) {
      for (let j = 0; j < 9; j++) {
        const p = polar(4.4, start + arc * (j + .5) / 9, y);
        if (!inNeutralBeamPort(p, .72, .58)) ribs.push({ p, s: [.09, .09, .36], r: [0, -(start + arc * (j + .5) / 9), 0] });
      }
    }
    instance(panel, UNIT_BOX, M.darkSteel, ribs);
    moving(panel, [Math.cos(mid) * 1.8, .48, Math.sin(mid) * 1.8]);
  }
  // Exposed rear lid and flange mark the outer containment without hiding the core.
  torus(cryostat, M.stainless, 4.37, .095, 5.58, 205 * PI / 180, 117 * PI / 180);
  torus(cryostat, M.darkSteel, 4.37, .08, .7, 205 * PI / 180, 117 * PI / 180);

  const vacuum = part('vacuum', '真空端口与抽气歧管', '多组带波纹补偿节的真空端口连接抽气与燃料处理系统，使反应腔保持低压并移除杂质。法兰、紧固件和可拆管段展示了维护接口，抽气路径在工厂中继续接入泵组。', [2]);
  const bellow = [], flangeBolts = [], portBrackets = [];
  for (const [degrees, y] of [[145, 2.95], [226, 3.05], [314, 2.7], [89, 2.75]]) {
    const a = degrees * PI / 180, q = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    const p = polar(4.17, a, y);
    const port = new THREE.Group(); port.name = `vacuum-port-${degrees}`; vacuum.add(port);
    const body = cylinder(port, M.darkSteel, p, .25, 1.14); body.quaternion.copy(q);
    for (const r of [3.75, 4.6]) {
      const flange = cylinder(port, M.stainless, polar(r, a, y), .36, .095); flange.quaternion.copy(q);
      for (let k = 0; k < 10; k++) {
        const t = TAU * k / 10, center = V(polar(r + .06, a, y));
        center.add(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(.3 * Math.cos(t))).add(new THREE.Vector3(0, .3 * Math.sin(t), 0));
        flangeBolts.push({ p: center.toArray(), s: [.035, .055, .035], q });
      }
    }
    for (let k = 0; k < 12; k++) bellow.push({ p: polar(3.92 + k * .046, a, y), s: [.285, .025, .285], q });
    portBrackets.push(strutTransform(polar(4.42, a, .64), polar(4.42, a, y - .26), .075));
    moving(port, [Math.cos(a) * .44, -.1, Math.sin(a) * .44]);
  }
  instance(vacuum, UNIT_CYLINDER, M.stainless, bellow); instance(vacuum, UNIT_BOLT, M.darkSteel, flangeBolts); instance(vacuum, UNIT_BOX, M.darkSteel, portBrackets);

  const neutralBeam = buildNeutralBeam({ parent: group, parts, coreY: CORE_Y });

  const rf = part('rf-antenna', '射频加热天线', '真空室侧面的天线向等离子体耦合射频能量，补充中性束加热与电流驱动。它的功率来自电力系统，实际耦合效率取决于频率、波型和等离子体状态。', [3]);
  const antennaBars = [], rfAngle = 100 * PI / 180;
  for (let k = 0; k < 8; k++) antennaBars.push({ p: polar(3.69, rfAngle + (k - 3.5) * .025, 3.0), s: [.055, .79, .075], r: [0, -rfAngle, 0] });
  instance(rf, UNIT_BOX, M.copper, antennaBars);
  const rfQ = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(Math.cos(rfAngle), 0, Math.sin(rfAngle)));
  for (const y of [2.65, 3.35]) {
    const feed = cylinder(rf, M.stainless, polar(4.02, rfAngle, y), .11, .65); feed.quaternion.copy(rfQ);
    const flange = cylinder(rf, M.darkSteel, polar(4.35, rfAngle, y), .21, .08); flange.quaternion.copy(rfQ);
  }
  moving(rf, [Math.cos(rfAngle) * .45, .12, Math.sin(rfAngle) * .45]);

  const divertor = part('divertor', '偏滤器与排气槽', '真空室底部的偏滤器接收沿磁力线离开的粒子和高热流，把氦灰及杂质导向抽气系统。这里的热量也必须被冷却回路带走，燃料处理会回收未反应的氘和氚。', [7]);
  const cassettes = [], tungsten = [], cassetteBolts = [];
  for (let i = 0; i < 64; i++) {
    const a = first + (240 * PI / 180) * (i + .5) / 64;
    cassettes.push({ p: polar(2.78, a, 1.96), s: [.31, .16, .56], r: [0, -a, 0] });
    for (const r of [2.52, 2.93]) tungsten.push({ p: polar(r, a, 2.12), s: [.24, .2, .14], r: [0, -a, r < 2.7 ? -.22 : .22] });
    cassetteBolts.push({ p: polar(2.78, a, 2.08), s: [.025, .04, .025] });
  }
  instance(divertor, UNIT_BOX, M.darkSteel, cassettes); instance(divertor, UNIT_BOX, M.graphite, tungsten); instance(divertor, UNIT_BOLT, M.silver, cassetteBolts);
  moving(divertor, [0, -.59, .23]);

  const plasma = part('plasma', '受约束的燃烧等离子体', '氘氚等离子体沿真空室中央形成一条薄而明亮的环形体，磁场使它避开固体内壁。这里展示的是受控聚变过程，高温、约束时间与密度共同决定能否达到有效燃烧。', [2, 5]);
  const plasmaCore = torus(plasma, M.plasma, MAJOR, .15, CORE_Y); plasmaCore.castShadow = false; plasmaCore.receiveShadow = false;
  // The torus starts in XY; its local Z becomes the chamber's vertical axis.
  plasmaCore.geometry.scale(1, 1, 1.3);
  const sheath = torus(plasma, M.plasmaEdge, MAJOR, .245, CORE_Y); sheath.castShadow = false; sheath.receiveShadow = false;
  const field = part('field', '螺旋磁力线', '青色细线示意环向场与极向场叠加后的螺旋磁力线，它们包围同一个等离子体环。粒子沿这些磁力线快速运动，同时在横向受到约束；线条仅用于解释磁场结构。', [4]);
  for (let line = 0; line < 3; line++) {
    const points = [];
    for (let i = 0; i <= 360; i++) {
      const a = TAU * i / 360, t = a * 6 + line * TAU / 3, minor = .43;
      points.push(polar(MAJOR + minor * Math.cos(t), a, CORE_Y + minor * 1.25 * Math.sin(t)));
    }
    const f = tube(field, M.field, points, .009, true, 360); f.castShadow = false; f.receiveShadow = false;
  }

  const selfHeating = part('self-heating', 'α 粒子自加热', '每次氘氚聚变产生的带电 α 粒子留在磁约束中，通过碰撞把约五分之一的聚变能量交还等离子体。橙金色运动点表示这种内部自加热，它减少持续运行所需的外部加热，但不会消除燃料消耗与能量损失。', [5]);
  const alphaCount = 32, alphaTransforms = Array.from({ length: alphaCount }, () => ({ s: [.032, .032, .032] }));
  const alphas = instance(selfHeating, UNIT_SPHERE, M.alpha, alphaTransforms); alphas.castShadow = false; alphas.receiveShadow = false; alphas.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const neutron = part('neutron', '中子向包层传能', '不带电的中子离开磁约束区，将约五分之四的氘氚聚变能量沉积到周围包层。浅色短迹线沿径向向外运动，随后能量随冷却剂进入热交换与发电系统。', [5]);
  const neutronCount = 44, neutronTransforms = Array.from({ length: neutronCount }, () => ({ s: [.021, .021, .021] }));
  const neutrons = instance(neutron, UNIT_SPHERE, M.neutron, neutronTransforms); neutrons.castShadow = false; neutrons.receiveShadow = false; neutrons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const tailPositions = new Float32Array(neutronCount * 6), tailGeometry = new THREE.BufferGeometry(); tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
  const neutronTails = new THREE.LineSegments(tailGeometry, new THREE.LineBasicMaterial({ color: '#c6d6c2', transparent: true, opacity: .35 })); neutron.add(neutronTails);

  // Coolant penetrations and inspection wiring remain restrained industrial colors.
  const services = new THREE.Group(); services.name = 'reactor-service-manifolds'; group.add(services);
  for (const [mat, y, x] of [[M.red, 1.85, 3.6], [M.cold, 1.05, 3.55]]) {
    tube(services, mat, [[x, y, -1.0], [4.18, y, -1.0], [4.55, y, -1.5], [4.55, y, -2.0]], .13, false, 28);
    cylinder(services, M.silver, [4.55, y, -1.9], .2, .08, [PI / 2, 0, 0]);
  }
  const cableClips = [];
  for (let i = 0; i < 12; i++) cableClips.push({ p: polar(1.08, TAU * i / 12, .83), s: [.16, .12, .1], r: [0, -TAU * i / 12, 0] });
  instance(services, UNIT_BOX, M.darkSteel, cableClips);

  group.userData.design = 'single shared tokamak, 240-degree vessel cutaway, 18 TF magnet locations, 16 visible magnets';
  group.userData.partIds = parts.map(p => p.id);
  const clamp01 = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  let previousExplode = -1;
  function update(time = 0, delta = 0, state = {}) {
    const t = Number.isFinite(time) ? time : 0, e = clamp01(state.explode || 0);
    const activity = clamp01(state.activity ?? 1), power = Math.max(0, Math.min(2, Number.isFinite(state.power) ? state.power : 1));
    const running = state.phase === 'running', standby = state.phase === 'standby';
    const alpha = clamp01(state.alpha ?? (running ? 1 : 0));
    const fusionBurn = standby ? 0 : activity * alpha;
    if (e !== previousExplode) {
      for (const item of explode) item.object.position.copy(item.base).addScaledVector(item.direction, e);
      previousExplode = e;
    }
    const burn = activity * (standby ? .06 : running ? 1 : .42);
    plasma.visible = activity > .005; field.visible = activity > .02;
    M.plasma.emissiveIntensity = .6 + burn * (1.25 + .1 * Math.sin(t * 2.2));
    M.plasmaEdge.opacity = .035 + burn * .085; M.field.opacity = .1 + activity * .19;
    neutralBeam.update(t, state);
    selfHeating.visible = fusionBurn > .02; neutron.visible = fusionBurn > .02;
    M.alpha.emissiveIntensity = .35 + fusionBurn * (1.2 + power); M.neutron.opacity = fusionBurn * .75;
    neutronTails.material.opacity = fusionBurn * .37;
    for (let i = 0; i < alphaCount; i++) {
      const a = t * (.42 + (i % 5) * .021) + i * TAU / alphaCount, pitch = a * 9 + i * 2.399;
      const minor = .04 + (i % 4) * .026;
      TEMP.position.set((MAJOR + minor * Math.cos(pitch)) * Math.cos(a), CORE_Y + minor * 1.3 * Math.sin(pitch), (MAJOR + minor * Math.cos(pitch)) * Math.sin(a));
      TEMP.quaternion.identity(); TEMP.scale.setScalar(.018 + .015 * fusionBurn); TEMP.updateMatrix(); alphas.setMatrixAt(i, TEMP.matrix);
    }
    alphas.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < neutronCount; i++) {
      const progress = ((t * .38 + i * .61803398875) % 1 + 1) % 1, a = i * 2.39996323, theta = (i * 1.13) % TAU;
      const minor = .18 + progress * .69, radial = MAJOR + minor * Math.cos(theta);
      const pos = [(radial) * Math.cos(a), CORE_Y + minor * 1.36 * Math.sin(theta), radial * Math.sin(a)];
      TEMP.position.set(...pos); TEMP.quaternion.identity(); TEMP.scale.setScalar(.015 + .01 * fusionBurn); TEMP.updateMatrix(); neutrons.setMatrixAt(i, TEMP.matrix);
      const trailMinor = Math.max(.14, minor - .1), tailR = MAJOR + trailMinor * Math.cos(theta), n = i * 6;
      tailPositions[n] = tailR * Math.cos(a); tailPositions[n + 1] = CORE_Y + trailMinor * 1.36 * Math.sin(theta); tailPositions[n + 2] = tailR * Math.sin(a);
      tailPositions[n + 3] = pos[0]; tailPositions[n + 4] = pos[1]; tailPositions[n + 5] = pos[2];
    }
    neutrons.instanceMatrix.needsUpdate = true; tailGeometry.attributes.position.needsUpdate = true;
    tailGeometry.computeBoundingSphere(); alphas.computeBoundingSphere(); neutrons.computeBoundingSphere();
    group.updateMatrixWorld(true);
  }
  update(0, 0, { activity: 1, explode: 0, power: 1, phase: 'running' });
  return { group, parts, update };
}
