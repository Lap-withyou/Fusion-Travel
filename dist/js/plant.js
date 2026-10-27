import * as THREE from '../vendor/three.module.js';
import {buildReactor} from './reactor.js';
import {buildConvenienceStore} from './store.js';
import {PLANT_LAYOUT,FLOW_ROUTES} from './layout.js';
import {SITE_ROAD,STORE_SERVICE} from './site-layout.js';

// One connected plant, built from shared industrial primitives. Repeated bolts,
// fins, railings and cabinet details are instanced within their selectable unit.
export function buildPlant(){
  const group=new THREE.Group();group.name='Integrated fusion power station';
  const parts=[],batches=new Map(),rotors=[],fans=[];
  const geometry={
    box:new THREE.BoxGeometry(1,1,1),
    cylinder:new THREE.CylinderGeometry(1,1,1,20),
    smoothCylinder:new THREE.CylinderGeometry(1,1,1,40),
    sphere:new THREE.SphereGeometry(1,20,12),
    torus:new THREE.TorusGeometry(1,.055,6,36),
    casing:new THREE.CylinderGeometry(1,1,1,40,1,true,Math.PI*.48,Math.PI*1.22),
    cone:new THREE.CylinderGeometry(.62,1,1,20),
  };
  const materials={};
  function material(name,color,metalness=.5,roughness=.48,extra={}){const m=new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});m.name=name;materials[name]=m;return m;}
  material('steel','#819197',.83,.34);
  material('satin','#b3bab9',.78,.39);
  material('dark','#39474d',.76,.48);
  material('structural','#596e77',.72,.47);
  material('concrete','#87908b',.02,.94);
  material('floor','#56615e',.09,.9);
  material('asphalt','#303b3d',.03,.96);
  material('white','#c1c7bc',.15,.75);
  material('yellow','#c3a04b',.23,.66);
  material('black','#242d30',.25,.72);
  material('rubber','#1e282b',.03,.88);
  material('copper','#9b6547',.83,.35);
  material('brass','#ad975e',.8,.36);
  material('blue','#5e7987',.58,.48);
  material('green','#5b7f70',.5,.56);
  material('red','#a76854',.49,.53);
  material('porcelain','#b8c4be',.14,.34);
  material('glass','#577e86',.45,.25,{transparent:true,opacity:.74});
  material('window','#b2cbb3',.12,.4,{emissive:'#a4c0a4',emissiveIntensity:.1});
  material('lamp','#eddb9f',.12,.34,{emissive:'#ffd690',emissiveIntensity:.15});
  material('status','#6fa291',.1,.4,{emissive:'#4bceaa',emissiveIntensity:.15});
  material('display','#263f45',.3,.36,{emissive:'#548b83',emissiveIntensity:.12});
  const dummy=new THREE.Object3D(),yAxis=new THREE.Vector3(0,1,0);
  function primitive(parent,shape,mat,pos,scale,rotation){
    let map=batches.get(parent);if(!map)batches.set(parent,map=new Map());
    const key=shape+'|'+mat;
    let batch=map.get(key);if(!batch)map.set(key,batch={shape,mat,matrices:[]});
    dummy.position.fromArray(pos);dummy.scale.fromArray(scale);dummy.rotation.set(0,0,0);dummy.quaternion.identity();
    if(rotation?.isQuaternion)dummy.quaternion.copy(rotation);else if(rotation)dummy.rotation.set(...rotation);
    dummy.updateMatrix();batch.matrices.push(dummy.matrix.clone());
  }
  const box=(p,pos,size,mat='steel',rot)=>primitive(p,'box',mat,pos,size,rot);
  const sphere=(p,pos,size,mat='steel')=>primitive(p,'sphere',mat,pos,size);
  const cyl=(p,pos,r,h,mat='steel',rot)=>primitive(p,'cylinder',mat,pos,[r,h,r],rot);
  function segment(p,a,b,r=.06,mat='steel'){
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),l=d.length();if(l<.001)return;
    primitive(p,'cylinder',mat,av.add(bv).multiplyScalar(.5).toArray(),[r,l,r],new THREE.Quaternion().setFromUnitVectors(yAxis,d.divideScalar(l)));
  }
  function beam(p,a,b,w=.1,d=.1,mat='structural'){
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),direction=bv.clone().sub(av),l=direction.length();
    primitive(p,'box',mat,av.add(bv).multiplyScalar(.5).toArray(),[w,l,d],new THREE.Quaternion().setFromUnitVectors(yAxis,direction.divideScalar(l)));
  }
  function ring(p,pos,r,mat='steel',axis=[0,1,0]){
    primitive(p,'torus',mat,pos,[r,r,r],new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...axis)));
  }
  function flange(p,pos,r,axis=[0,1,0],mat='satin'){
    const dir=new THREE.Vector3(...axis).normalize(),q=new THREE.Quaternion().setFromUnitVectors(yAxis,dir);
    primitive(p,'cylinder',mat,pos,[r*1.57,.08,r*1.57],q);
    primitive(p,'cylinder','dark',pos,[r*1.6,.016,r*1.6],q);
    for(let n=0;n<6;n++){
      const a=n*Math.PI/3,offset=new THREE.Vector3(Math.cos(a)*r*1.27,0,Math.sin(a)*r*1.27).applyQuaternion(q).add(new THREE.Vector3(...pos));
      primitive(p,'cylinder','dark',offset.toArray(),[.027,.115,.027],q);
    }
  }
  function pipe(p,points,r=.09,mat='steel',flanged=false){
    for(let i=1;i<points.length;i++)segment(p,points[i-1],points[i],r,mat);
    for(let i=1;i<points.length-1;i++)sphere(p,points[i],[r,r,r],mat);
    if(flanged&&points.length>1){for(const i of [0,points.length-1]){const j=i===0?1:i-1;const axis=new THREE.Vector3(...points[j]).sub(new THREE.Vector3(...points[i])).normalize().toArray();flange(p,points[i],r,axis);}}
  }
  function feet(p,x,z,w,d,top=.48){
    for(const sx of [-1,1])for(const sz of [-1,1]){
      box(p,[x+sx*w/2,.09,z+sz*d/2],[.35,.15,.35],'concrete');
      box(p,[x+sx*w/2,top/2+.1,z+sz*d/2],[.1,top,.1],'dark');
      box(p,[x+sx*w/2,.19,z+sz*d/2],[.24,.055,.24],'steel');
    }
  }
  function valve(p,pos,r=.13,axis=[0,1,0],wheel='red'){
    cyl(p,pos,r*1.3,r*2.7,'brass',new THREE.Quaternion().setFromUnitVectors(yAxis,new THREE.Vector3(...axis)));
    const top=[pos[0],pos[1]+r*3.5,pos[2]];segment(p,pos,top,.025,'steel');ring(p,top,r*1.6,wheel);
    segment(p,[top[0]-r*1.5,top[1],top[2]],[top[0]+r*1.5,top[1],top[2]],.018,wheel);
    segment(p,[top[0],top[1],top[2]-r*1.5],[top[0],top[1],top[2]+r*1.5],.018,wheel);
  }
  function gauge(p,pos){
    cyl(p,pos,.105,.055,'black',[Math.PI/2,0,0]);cyl(p,[pos[0],pos[1],pos[2]+.032],.083,.018,'white',[Math.PI/2,0,0]);
    segment(p,[pos[0],pos[1],pos[2]+.045],[pos[0]+.04,pos[1]+.045,pos[2]+.045],.008,'dark');
  }
  function motor(p,x,y,z,length=.8,r=.33,axis='x'){
    const rot=axis==='x'?[0,0,Math.PI/2]:[Math.PI/2,0,0];
    cyl(p,[x,y,z],r,length,'blue',rot);
    for(let n=0;n<7;n++){const t=(n-3)*length/8;const pos=axis==='x'?[x+t,y,z]:[x,y,z+t];cyl(p,pos,r*1.07,.035,'dark',rot);}
    box(p,[x,y+r+.08,z],[.28,.19,.28],'dark');
    box(p,[x,y-r-.07,z],[length*.85,.14,r*1.5],'dark');
  }
  function pump(p,x,z,scale=1){
    feet(p,x,z,1.3*scale,.65*scale,.28);box(p,[x,.38,z],[1.7*scale,.12,.82*scale],'dark');
    motor(p,x-.32*scale,.75*scale,z,.8*scale,.30*scale);
    cyl(p,[x+.49*scale,.76*scale,z],.37*scale,.36*scale,'satin',[0,0,Math.PI/2]);
    pipe(p,[[x+.5*scale,.76*scale,z],[x+.5*scale,1.35*scale,z]],.11*scale,'steel',true);
    flange(p,[x+.75*scale,.76*scale,z],.12*scale,[1,0,0]);
  }
  function railing(p,a,b,height=.85){
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),len=av.distanceTo(bv),n=Math.max(1,Math.ceil(len/1.4));
    for(let i=0;i<=n;i++){const pos=av.clone().lerp(bv,i/n);segment(p,pos.toArray(),pos.clone().add(new THREE.Vector3(0,height,0)).toArray(),.026,'yellow');}
    for(const h of [height*.52,height])segment(p,av.clone().add(new THREE.Vector3(0,h,0)).toArray(),bv.clone().add(new THREE.Vector3(0,h,0)).toArray(),.026,'yellow');
  }
  function platform(p,x,y,z,w,d){box(p,[x,y-.06,z],[w,.12,d],'dark');for(const side of [-1,1])railing(p,[x-w/2,y,z+side*d/2],[x+w/2,y,z+side*d/2]);}
  function ladder(p,x,z,height){
    for(const dx of [-.23,.23])segment(p,[x+dx,.2,z],[x+dx,height+.5,z],.025,'steel');
    for(let y=.3;y<height;y+=.28)segment(p,[x-.23,y,z],[x+.23,y,z],.019,'steel');
    for(let y=1.6;y<height+.5;y+=.8)ring(p,[x,y,z-.03],.42,'dark',[0,1,0]);
  }
  function addPart(id,label,description,stepIds,position=[0,0,0]){
    const object=new THREE.Group();object.name=label;object.position.fromArray(position);object.userData.partId=id;object.userData.stepIds=stepIds;
    group.add(object);parts.push({id,label,description,stepIds,object});return object;
  }
  const site=new THREE.Group();site.name='Common foundation, service structure and safety markings';group.add(site);
  box(site,[1,-.19,1.5],[38,.36,27],'concrete');box(site,[1,.012,1.5],[37.7,.035,26.7],'floor');
  box(site,SITE_ROAD.position,SITE_ROAD.size,'asphalt');
  for(let x=-16.5;x<19;x+=2.3)box(site,[x,.065,13.2],[1.2,.012,.06],'white');
  for(const z of [-11.6,11.7,14.7])box(site,[1,.055,z],[37.5,.025,.09],'yellow');
  for(let x=-17.96;x<20;x+=4)box(site,[x,.039,.0],[.025,.009,23],'dark');
  for(let z=-11;z<12;z+=4)box(site,[1,.039,z],[38,.009,.025],'dark');
  function zone(x,z,w,d){
    for(const s of [-1,1]){box(site,[x+s*w/2,.064,z],[.075,.015,d],'yellow');box(site,[x,.064,z+s*d/2],[w,.015,.075],'yellow');}
    for(let n=0;n<7;n++)box(site,[x-w/2+.25+n*.3,.066,z+d/2-.28],[.15,.018,.48],n%2?'yellow':'black',[0,-.35,0]);
  }
  zone(-13,-6,6.4,5.5);zone(-11,0,7,4.5);zone(-12,6.4,6.4,6);zone(6.6,-4,5.1,5.7);zone(8.6,6.3,9,6.4);zone(15.1,3.1,5.7,5.8);
  // A service gantry links process systems without covering the tokamak cutaway.
  for(const x of [-16.9,-8,3.5,11.7,18.7]){
    for(const z of [-9.8,-8.4]){
      box(site,[x,.12,z],[.48,.2,.48],'concrete');box(site,[x,2.0,z],[.16,3.8,.16],'structural');
    }
    beam(site,[x,3.75,-10],[x,3.75,-8.2],.16,.18);beam(site,[x,2.8,-9.8],[x,3.7,-8.5],.08,.08);
  }
  for(const z of [-9.8,-8.4]){
    beam(site,[-17.2,3.78,z],[19,3.78,z],.12,.19);
    beam(site,[-17.2,3.15,z],[19,3.15,z],.1,.12);
    for(let x=-17;x<18;x+=2)beam(site,[x,3.18,z],[x+1.8,3.75,z],.06,.06);
  }
  box(site,[.8,3.8,-9.1],[36.2,.08,1.3],'dark');
  railing(site,[-17.2,3.86,-9.8],[19,3.86,-9.8]);railing(site,[-17.2,3.86,-8.4],[19,3.86,-8.4]);
  for(let x=-17;x<19;x+=.55)box(site,[x,3.86,-9.1],[.035,.025,1.35],'steel');
  // Raised cable trays have perforation bars and clearly separate power cabling.
  for(const z of [-8.75,-9.35]){box(site,[.8,3.45,z],[36.2,.11,.28],'structural');for(let x=-17;x<19;x+=.8)box(site,[x,3.51,z],[.055,.04,.32],'dark');}
  ladder(site,-16.7,-8.25,3.85);
  // Fuel storage and injection skid.
  const fuel=addPart('tanks','氘 / 氚燃料储罐','独立压力容器、隔离阀和带法兰的汇流管向同一燃料注入撬供气。',[1],PLANT_LAYOUT.fuel);
  for(const x of [-1.05,.8]){
    feet(fuel,x,0,1,1,.6);cyl(fuel,[x,1.85,0],.63,2.18,'satin');sphere(fuel,[x,.77,0],[.63,.24,.63],'satin');sphere(fuel,[x,2.94,0],[.63,.3,.63],'satin');
    for(const y of [1.05,2.65])cyl(fuel,[x,y,0],.655,.075,'dark');cyl(fuel,[x,2.4,0],.638,.075,x<0?'green':'red');
    pipe(fuel,[[x,3.17,0],[x,3.42,0],[x,3.42,.65]],.07,'steel',true);valve(fuel,[x,3.35,0],.09);
    pipe(fuel,[[x,1.0,.61],[x,1.0,1],[1,1,1]],.1,'steel',true);valve(fuel,[x,1.0,.9],.11,[0,0,1]);gauge(fuel,[x+.18,1.5,.63]);
    box(fuel,[x,1.85,.635],[.48,.32,.025],'dark');box(fuel,[x,1.85,.654],[.31,.07,.012],x<0?'green':'red');
  }
  pipe(fuel,[[0,1,-1.2],[0,1,-.6],[.8,1,-.6]],.12,'steel',true);
  const injection=addPart('injection','燃料注入与计量撬','调压、计量和隔离阀把氘氚燃料接入通向真空室的供料管。',[1],PLANT_LAYOUT.fuel);
  feet(injection,2.0,.25,1.6,1.7,.28);box(injection,[2,.4,.25],[1.9,.16,1.9],'dark');
  for(const z of [-.35,.6]){cyl(injection,[2,1.05,z],.22,.9,'steel',[0,0,Math.PI/2]);flange(injection,[1.6,1.05,z],.18,[1,0,0]);flange(injection,[2.4,1.05,z],.18,[1,0,0]);gauge(injection,[2,1.45,z+.2]);}
  pipe(injection,[[1,1,1],[2.85,1,1],[2.85,1.1,0],[1,1.1,0]],.11,'steel',true);valve(injection,[2.85,1.1,.5],.1,[0,0,1]);
  box(injection,[2.15,1.8,-.65],[1.15,1.9,.42],'structural');box(injection,[2.15,2.22,-.426],[.72,.34,.018],'display');
  for(let i=0;i<3;i++)cyl(injection,[1.9+i*.23,1.8,-.414],.042,.025,i===2?'red':'status',[Math.PI/2,0,0]);
  // Auxiliary power cabinets, radio-frequency transmission, and vacuum plant.
  const power=addPart('power-supplies','射频与磁体电源柜列','模块化整流电源、射频放大柜及冷却通风组成厂用辅助电力系统。',[3,4],PLANT_LAYOUT.heating);
  for(let i=0;i<4;i++){
    const x=-1.8+i*.94;box(power,[x,.16,-1],[.86,.22,1.1],'dark');box(power,[x,1.48,-1],[.83,2.4,1.0],'structural');box(power,[x,1.48,-.49],[.74,2.23,.035],'steel');
    box(power,[x,2.15,-.46],[.51,.24,.025],'display');box(power,[x+.23,1.45,-.43],[.028,.31,.035],'black');
    for(let j=0;j<6;j++)box(power,[x,.55+j*.1,-.455],[.57,.027,.025],'dark');
    for(let j=0;j<3;j++)cyl(power,[x-.2+j*.19,1.84,-.435],.025,.022,j===2?'yellow':'status',[Math.PI/2,0,0]);
    box(power,[x,2.76,-1],[.68,.11,.78],'dark');
  }
  box(power,[1.05,1.66,.1],[1.9,.27,.36],'copper');box(power,[1.05,1.66,.1],[1.94,.16,.4],'structural');
  pipe(power,[[1,1.7,0],[1,1.7,.6],[2.2,1.7,.6],[2.2,1.7,0]],.15,'satin',true);
  const cryo=addPart('cryogenics','低温制冷与压缩机组','带真空绝热套的低温罐和氦压缩机支持超导磁体的低温运行。',[4],[PLANT_LAYOUT.heating[0],0,-4.3]);
  for(const x of [-3.1,-1.8]){
    feet(cryo,x,1.3,.85,.85,.4);cyl(cryo,[x,1.45,1.3],.45,1.9,'satin');sphere(cryo,[x,2.4,1.3],[.45,.25,.45],'satin');sphere(cryo,[x,.5,1.3],[.45,.23,.45],'satin');
    for(const y of [.75,2.15])ring(cryo,[x,y,1.3],.46,'dark');pipe(cryo,[[x,2.65,1.3],[x,2.88,1.3],[-.65,2.88,1.3],[-.65,.9,1.3]],.06,'steel',true);
    gauge(cryo,[x,1.9,1.75]);
  }
  for(const x of [-.2,1.4]){pump(cryo,x,1.3,.72);box(cryo,[x,.87,1.3],[1.15,.84,.8],'dark');for(let n=0;n<7;n++)box(cryo,[x-.46+n*.15,1.31,1.3],[.035,.12,.73],'steel');}
  const pumps=addPart('pumps','真空泵与尾气接口','真空泵、涡轮分子泵和密封管路维持低压，并把排出气体送至燃料处理系统。',[2,6],[-7.9,0,4.8]);
  for(const z of [-.6,.8]){pump(pumps,-.3,z,.87);cyl(pumps,[.5,1.45,z],.34,.74,'satin');for(let y=1.18;y<1.8;y+=.12)cyl(pumps,[.5,y,z],.365,.035,'dark');pipe(pumps,[[.5,1.8,z],[1.45,1.8,z],[1.45,.8,z]],.12,'steel',true);}
  pipe(pumps,[[1.45,.8,-.6],[1.9,.8,-.6],[1.9,.8,-1.1]],.12,'steel',true);
  // Isotope recovery is a proper process skid with access platform and columns.
  const separator=addPart('separator','同位素分离与净化塔','精馏分离塔、加热夹套和阀组回收尾气中的燃料组分。',[7],PLANT_LAYOUT.recovery);
  for(const [x,h,r] of [[-1,4.9,.4],[.4,4.1,.31],[1.5,3.45,.27]]){
    cyl(separator,[x,.45,0],r*.85,.7,'dark');cyl(separator,[x,h/2+.5,0],r,h,'satin');sphere(separator,[x,h+.5,0],[r,.2,r],'steel');
    for(let y=.9;y<h+.2;y+=.6)ring(separator,[x,y,0],r*1.02,'dark');
    cyl(separator,[x,1.2,0],r*1.12,1.25,'structural');gauge(separator,[x,1.6,r+.04]);
    pipe(separator,[[x,h+.7,0],[x,h+.95,0],[2.1,h+.95,0],[2.1,1,0]],.065,'steel',true);
    pipe(separator,[[x,.8,0],[x,.8,.65],[1.5,.8,.65]],.1,'steel',true);valve(separator,[x,.8,.65],.085,[1,0,0]);
  }
  platform(separator,-.2,2.9,.9,3.5,.75);ladder(separator,-1.95,1,2.9);
  const recycle=addPart('recycle','回收燃料缓冲罐','回收气经过缓冲罐、过滤器和计量泵进入闭合燃料回路。',[7],PLANT_LAYOUT.recovery);
  feet(recycle,0,2.0,2.7,.85,.65);cyl(recycle,[0,1.0,2.0],.48,2.8,'satin',[0,0,Math.PI/2]);sphere(recycle,[-1.4,1,2],[.18,.48,.48],'satin');sphere(recycle,[1.4,1,2],[.18,.48,.48],'satin');
  for(const x of [-1,1])ring(recycle,[x,1,2],.49,'dark',[1,0,0]);gauge(recycle,[0,1.6,2.1]);
  pipe(recycle,[[1.5,.8,0],[1.8,.8,0],[1.8,1,2],[1.4,1,2]],.15,'steel',true);
  const returnFuel=addPart('fuel','再注入汇流管','回收燃料通过分析、隔离阀及回流管重新接入氘氚供给系统。',[7],PLANT_LAYOUT.recovery);
  pipe(returnFuel,[[-1.4,1,2],[-2.1,1,2],[-2.1,1,0],[-1,1,0]],.12,'steel',true);valve(returnFuel,[-2.1,1,.7],.11,[0,0,1]);
  box(returnFuel,[-2.2,1.2,2.2],[.65,1.9,.55],'structural');box(returnFuel,[-2.2,1.6,2.49],[.45,.3,.025],'display');
  // Shell-and-tube steam generators: insulated shells, real tube bundle, no icons.
  const exchanger=addPart('exchanger','双列换热器与蒸汽发生器','一回路冷却剂在金属管束中传热，二回路水吸热成为蒸汽。',[6],PLANT_LAYOUT.heat);
  for(const [x,z,h] of [[-.8,-.45,5.3],[1.0,.15,4.75]]){
    cyl(exchanger,[x,.5,z],.61,.8,'dark');cyl(exchanger,[x,1.25+h/2-.55,z],.65,h-1.1,'satin');
    sphere(exchanger,[x,h+.15,z],[.65,.38,.65],'satin');sphere(exchanger,[x,.93,z],[.65,.25,.65],'steel');
    for(let y=1.25;y<h;y+=.7)cyl(exchanger,[x,y,z],.675,.065,'dark');
    for(const y of [1.45,h-.35]){cyl(exchanger,[x,y,z],.72,.105,'steel');for(let n=0;n<10;n++){const a=n*Math.PI/5;cyl(exchanger,[x+.67*Math.cos(a),y+.08,z+.67*Math.sin(a)],.034,.10,'dark');}}
    pipe(exchanger,[[x,h+.5,z],[x,h+.8,z],[x+.75,h+.8,z],[x+.75,h-.45,z]],.13,'steel',true);gauge(exchanger,[x,2.4,z+.67]);
    box(exchanger,[x,3.4,z+.66],[.35,.22,.025],'dark');
  }
  // Exposed service bundle beside the shell makes the heat-transfer construction legible.
  for(let i=0;i<7;i++){const x=-1.75+(i%3)*.13,z=-.25+Math.floor(i/3)*.13;segment(exchanger,[x,.95,z],[x,3.7,z],.033,'copper');}
  cyl(exchanger,[-1.62,.92,-.1],.31,.14,'steel');cyl(exchanger,[-1.62,3.73,-.1],.31,.14,'steel');
  platform(exchanger,.1,4.1,1.25,3.2,.8);ladder(exchanger,-1.55,1.3,4.1);
  pipe(exchanger,[[0,1.9,-.8],[-.8,1.9,-.8],[-.8,1.9,-.45]],.22,'steel',true);
  pipe(exchanger,[[1,2.5,0],[1,2.5,.15]],.24,'steel',true);
  const coolant=addPart('coolant','主冷却剂循环泵','重型循环泵及保温管线把冷却剂送回包层，并控制换热器流量。',[6],PLANT_LAYOUT.heat);
  pump(coolant,-.55,1.65,.93);pump(coolant,1.35,1.65,.85);
  pipe(coolant,[[0,1.05,1],[0,1.05,1.65],[-.1,1.05,1.65]],.2,'steel',true);
  pipe(coolant,[[-.8,1.25,-.45],[-.8,1.25,.55],[.8,1.25,.55],[.8,.8,1.1],[0,.8,1.1]],.16,'steel',true);
  for(const x of [-.5,1.4])valve(coolant,[x,1.25,.55],.12,[1,0,0]);
  // Turbine hall has open roof and front wall; steel framing remains visible.
  const hall=new THREE.Group();hall.name='Turbine hall structure, crane and access';group.add(hall);
  for(const x of [4.4,8.6,12.8]){
    for(const z of [3.5,9.15]){box(hall,[x,.13,z],[.55,.24,.55],'concrete');box(hall,[x,2.8,z],[.17,5.35,.23],'structural');box(hall,[x,2.8,z],[.31,5.35,.065],'steel');}
    beam(hall,[x,5.45,3.5],[x,5.45,9.15],.17,.15);beam(hall,[x,6.05,6.32],[x,5.45,3.5],.12,.12);beam(hall,[x,6.05,6.32],[x,5.45,9.15],.12,.12);
    for(let i=0;i<4;i++)beam(hall,[x,5.45,3.55+i*1.4],[x,5.92-Math.abs(i-1.5)*.25,4.2+i*1.4],.065,.065);
  }
  for(const z of [3.5,9.15]){beam(hall,[4.3,5.4,z],[12.9,5.4,z],.2,.23);beam(hall,[4.3,4.3,z],[12.9,4.3,z],.16,.2);}
  for(const x of [5.0,6.1,7.2,8.3,9.4,10.5,11.6,12.7])box(hall,[x,5.69,3.92],[1.05,.06,.75],'steel',[.1,0,0]);
  for(const x of [4.5,12.7])beam(hall,[x,.4,3.5],[x+(.2*(x===4.5?1:-1)),4.2,9.1],.07,.07);
  box(hall,[8.6,4.55,6.3],[.4,.4,5.6],'yellow');box(hall,[8.6,4.89,6.3],[.8,.18,1],'dark');
  segment(hall,[8.6,4.6,6.3],[8.6,3.25,6.3],.018,'black');ring(hall,[8.6,3.15,6.3],.12,'dark',[0,0,1]);
  box(hall,[8.6,1.0,3.5],[8.1,1.7,.13],'structural');for(let x=4.9;x<12.6;x+=1.1)box(hall,[x,2.55,3.5],[.86,1.0,.035],'glass');
  platform(hall,8.5,2.5,8.7,7.8,.8);
  for(let i=0;i<10;i++){box(hall,[4.6-i*.12,.15+i*.24,8.5],[.65,.09,.75],'steel');}
  railing(hall,[3.5,.22,8.88],[4.6,2.5,8.88]);
  const turbine=addPart('turbine','汽轮机与可见转子叶片','蒸汽依次通过多级叶片膨胀做功；剖开的机壳展示叶轮、轴承与共同传动轴。',[8],PLANT_LAYOUT.turbine);
  feet(turbine,-.5,0,4.1,1.4,.55);box(turbine,[-.4,.55,0],[4.6,.35,1.8],'concrete');
  primitive(turbine,'casing','steel',[-.5,1.65,0],[.92,3.9,.92],[0,0,Math.PI/2]);
  for(const x of [-2.3,-1.5,-.7,.1,1.25])ring(turbine,[x,1.65,0],.94,'dark',[1,0,0]);
  for(const x of [-2.55,1.6]){box(turbine,[x,1.12,0],[.58,.72,1.03],'structural');cyl(turbine,[x,1.65,0],.33,.4,'brass',[0,0,Math.PI/2]);}
  const rotor=new THREE.Group();rotor.position.set(-.5,1.65,0);turbine.add(rotor);rotors.push({object:rotor,rate:6.5});
  segment(rotor,[-2.3,0,0],[4.0,0,0],.105,'steel');
  for(const [x,r] of [[-1.35,.48],[-.65,.60],[.1,.72],[.85,.82]]){
    cyl(rotor,[x,0,0],r*.5,.18,'copper',[0,0,Math.PI/2]);ring(rotor,[x,0,0],r,'steel',[1,0,0]);
    for(let n=0;n<18;n++){const a=n*Math.PI/9;box(rotor,[x,Math.sin(a)*r*.71,Math.cos(a)*r*.71],[.19,r*.48,.055],'satin',[a+Math.PI/2,.22,0]);}
  }
  const steam=addPart('steam','蒸汽阀组与冷凝器','主蒸汽隔离阀控制汽轮机入口；排汽进入机组下方冷凝器并返回蒸汽发生器。',[8],PLANT_LAYOUT.turbine);
  pipe(steam,[[-.4,1.6,-.7],[-.4,2.9,-.7],[-1.4,2.9,-.7],[-1.4,2.0,0]],.24,'steel',true);valve(steam,[-.4,2.3,-.7],.19);
  cyl(steam,[-.6,.8,.7],.55,2.4,'satin',[0,0,Math.PI/2]);for(const x of [-1.65,.45])ring(steam,[x,.8,.7],.57,'dark',[1,0,0]);
  pipe(steam,[[.6,1.35,0],[.6,.8,.7],[-.6,.8,.7]],.18,'steel',true);
  const generator=addPart('generator','同轴发电机','汽轮机经联轴器驱动发电机；铜排经过绝缘支撑送入变压器。',[8],PLANT_LAYOUT.turbine);
  feet(generator,3,0,1.7,1.3,.55);box(generator,[3,.63,0],[2.15,.22,1.5],'dark');cyl(generator,[3,1.65,0],.79,2.3,'blue',[0,0,Math.PI/2]);
  for(let n=0;n<11;n++)ring(generator,[2.05+n*.18,1.65,0],.8,'dark',[1,0,0]);
  cyl(generator,[1.75,1.65,0],.3,.21,'dark',[0,0,Math.PI/2]);box(generator,[3,2.5,0],[1.7,.28,.9],'structural');
  for(const z of [-.3,0,.3]){cyl(generator,[3,2.78,z],.09,.3,'porcelain');segment(generator,[3,2.93,z],[3,2,z],.035,'copper');}
  pipe(generator,[[3,2,0],[3,2.45,0],[3,2.45,-.6]],.09,'steel',true);
  // Transformers and switchgear sit next to the turbine hall.
  const switchyard=addPart('switchyard','变压器、开关柜与母线','发电机输出经升压、隔离和三相母线接入示范电网，同时分支供应厂用电。',[8,9],PLANT_LAYOUT.electric);
  for(const z of [-.8,1.1]){
    box(switchyard,[.25,.22,z],[2.35,.35,1.5],'concrete');box(switchyard,[.25,1.03,z],[1.9,1.3,1.1],'structural');
    for(let i=0;i<10;i++){box(switchyard,[-.52+i*.17,1,z+.73],[.07,1.08,.43],'dark');box(switchyard,[-.52+i*.17,1,z-.73],[.07,1.08,.43],'dark');}
    cyl(switchyard,[.25,1.95,z],.21,1.4,'steel',[0,0,Math.PI/2]);
    for(const x of [-.43,.25,.93]){cyl(switchyard,[x,1.97,z],.09,.65,'porcelain');for(let y=1.75;y<2.25;y+=.11)cyl(switchyard,[x,y,z],.15,.045,'porcelain');segment(switchyard,[x,2.3,z],[x,2.48,z+.45],.035,'copper');}
    pipe(switchyard,[[-1,2,0],[-.8,2,0],[-.8,2,z],[-.43,2,z]],.09,'steel',true);
  }
  for(let i=0;i<3;i++){
    const x=-1.8+i*.7;box(switchyard,[x,1.18,-2.0],[.63,2.15,.74],'steel');box(switchyard,[x,1.2,-1.615],[.53,1.92,.035],'structural');box(switchyard,[x,1.8,-1.59],[.36,.16,.02],'display');
    for(let j=0;j<4;j++)box(switchyard,[x,.48+j*.09,-1.59],[.41,.025,.02],'dark');
  }
  for(const z of [-.4,0,.4]){
    segment(switchyard,[-.8,2.65,z],[2,2.65,z],.035,'copper');
    for(const x of [-.8,2]){box(switchyard,[x,1.4,z],[.065,2.4,.065],'structural');for(let y=2.3;y<2.6;y+=.09)cyl(switchyard,[x,y,z],.09,.04,'porcelain');}
  }
  // Small control room, HVAC packs and industrial load building.
  const control=new THREE.Group();control.name='Control room and utilities';group.add(control);
  box(control,[-3.2,1.3,9.3],[4.7,2.5,2.6],'concrete');box(control,[-3.2,2.63,9.3],[4.98,.18,2.85],'dark');
  box(control,[-3.2,2.76,9.3],[4.8,.07,2.66],'steel');
  for(let i=0;i<4;i++){box(control,[-4.9+i*1.1,1.65,10.62],[.9,.92,.025],'glass');box(control,[-4.9+i*1.1,1.65,10.65],[.035,.95,.025],'dark');}
  box(control,[-5.57,1,9.5],[.04,1.9,.85],'dark');box(control,[-5.6,1.5,9.5],[.025,.54,.55],'glass');
  for(const x of [-4.3,-2.5]){
    box(control,[x,3.0,9.3],[1.2,.55,1.1],'structural');cyl(control,[x,3.31,9.3],.38,.04,'dark');
    const fan=new THREE.Group();fan.position.set(x,3.35,9.3);control.add(fan);for(let n=0;n<5;n++)box(fan,[Math.sin(n*Math.PI*2/5)*.2,0,Math.cos(n*Math.PI*2/5)*.2],[.16,.035,.4],'steel',[0,n*Math.PI*2/5,0]);fans.push(fan);
  }
  for(let i=0;i<3;i++){box(control,[-4.7+i*1.5,1.2,8.45],[1.1,.7,.4],'dark');box(control,[-4.7+i*1.5,1.65,8.35],[.74,.45,.07],'display',[-.15,0,0]);}
  const load=addPart('lamp','7-ELEVEN 风格便利店与街灯','净电力送到街角便利店：透过玻璃看见暖色顶灯、货架与收银台，门口和街灯下的光斑显示电力正在被终端使用。',[9],PLANT_LAYOUT.city);
  const store=buildConvenienceStore();load.add(store.group);load.userData.endpointType='convenience-store';load.userData.inspection=store.group.userData.inspection;
  const electricLine=addPart('electric-line','店外接线柜与送出电缆','送出电缆沿店外独立通道接入右侧防护柜，再经短导管接到侧墙的密封进线口。线路在建筑外表面终止，不穿过货架或门店内部。',[9],STORE_SERVICE.position);
  const serviceCabinet=new THREE.Group();serviceCabinet.name='Exterior shop service cabinet';serviceCabinet.userData.serviceCabinet=true;electricLine.add(serviceCabinet);
  box(serviceCabinet,STORE_SERVICE.cabinet.center,STORE_SERVICE.cabinet.size,'structural');
  box(serviceCabinet,[0,1.23,.211],[.82,1.93,.035],'steel');box(serviceCabinet,[0,1.75,.239],[.53,.25,.025],'display');box(serviceCabinet,[.28,1.15,.247],[.025,.24,.035],'black');
  for(let i=0;i<5;i++)box(serviceCabinet,[0,.46+i*.1,.235],[.58,.025,.02],'dark');
  box(electricLine,[0,.12,0],[1.18,.2,.68],'concrete');
  const localService=point=>point.map((value,index)=>value-STORE_SERVICE.position[index]);
  pipe(electricLine,STORE_SERVICE.connection.map(localService),.065,'dark');
  flange(electricLine,[0,2,-.22],.095,[0,0,1]);
  const cabinetPort=localService(STORE_SERVICE.connection[0]),shopPort=localService(STORE_SERVICE.shopPort);
  flange(electricLine,cabinetPort,.085,[1,0,0]);flange(electricLine,shopPort,.095,[1,0,0]);
  electricLine.userData.servicePorts={incoming:STORE_SERVICE.incomingPort,shop:STORE_SERVICE.shopPort};
  electricLine.userData.inspection={direction:[1.1,.8,1.25],padding:1.25};
  // Every teaching route is also a continuous physical pipe. Colour is limited
  // to identification bands; flanges, gaskets and support shoes remain steel.
  for(const route of FLOW_ROUTES){
    const routeGroup=new THREE.Group();routeGroup.name=route.label;routeGroup.userData.routeId=route.id;routeGroup.userData.stepIds=route.steps;group.add(routeGroup);
    const electrical=['electricity','feedback','grid'].includes(route.kind),mat=electrical?'dark':'steel',colorName='band-'+route.id;
    material(colorName,route.color,.4,.54);pipe(routeGroup,route.points,route.radius,mat,false);
    for(let i=1;i<route.points.length;i++){
      const a=new THREE.Vector3(...route.points[i-1]),b=new THREE.Vector3(...route.points[i]),dir=b.clone().sub(a),length=dir.length();dir.normalize();
      const n=Math.max(1,Math.floor(length/2.7));
      for(let j=0;j<n;j++){
        const point=a.clone().lerp(b,(j+.5)/n),q=new THREE.Quaternion().setFromUnitVectors(yAxis,dir);
        primitive(routeGroup,'cylinder',colorName,point.toArray(),[route.radius*1.025,electrical?.19:.14,route.radius*1.025],q);
        if(!electrical)flange(routeGroup,a.clone().lerp(b,Math.min(.4,(j+.2)/n)).toArray(),route.radius,dir.toArray());
        if(length>2&&point.y>.65){
          box(routeGroup,[point.x,.12,point.z],[.33,.2,.33],'concrete');segment(routeGroup,[point.x,.22,point.z],[point.x,point.y-route.radius-.06,point.z],.045,'structural');box(routeGroup,[point.x,point.y-route.radius-.035,point.z],[route.radius*3,.06,route.radius*2.6],'dark');
        }
      }
    }
  }
  const reactor=buildReactor();reactor.group.position.fromArray(PLANT_LAYOUT.reactor);group.add(reactor.group);
  for(const part of reactor.parts){part.object.userData.partId=part.id;part.object.userData.stepIds=part.stepIds;parts.push(part);}
  // Commit all repeated hardware to GPU instances after all unit groups exist.
  let instanceCount=0;
  for(const [parent,map]of batches){
    for(const batch of map.values()){
      const mesh=new THREE.InstancedMesh(geometry[batch.shape],materials[batch.mat],batch.matrices.length);
      batch.matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.name=batch.mat+' '+batch.shape;parent.add(mesh);instanceCount+=batch.matrices.length;
    }
  }
  group.userData.instanceCount=instanceCount;group.userData.flowRoutes=FLOW_ROUTES.length;
  function update(time,delta,state={}){
    const activity=THREE.MathUtils.clamp(state.activity??1,0,1),power=THREE.MathUtils.clamp(state.power??.65,0,1),running=state.phase==='standby'?.12:state.phase==='startup'?.48:1;
    const generatorSpeed=THREE.MathUtils.clamp(state.generator??activity*running*Math.sqrt(power),0,1);
    const netPower=THREE.MathUtils.clamp((Number.isFinite(state.netMW)?state.netMW/520:power)*generatorSpeed,0,1.5);
    reactor.update?.(time,delta,state);
    store.update({...state,generator:generatorSpeed});
    for(const rotor of rotors)rotor.object.rotation.x=time*rotor.rate*generatorSpeed;
    for(const fan of fans)fan.rotation.y=time*3.6*activity;
    materials.window.emissiveIntensity=.025+netPower*.62;
    materials.lamp.emissiveIntensity=.025+netPower*1.3;
    materials.status.emissiveIntensity=.12+activity*running*.42;
    materials.display.emissiveIntensity=.08+activity*running*.3;
    group.userData.operatingPhase=state.phase??'running';
  }
  update(0,0,{activity:1,power:.65,phase:'running',explode:0});
  return {group,parts,update};
}
