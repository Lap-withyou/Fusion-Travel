import * as THREE from '../vendor/three.module.js';

// ITER / MITICA-inspired explanatory cutaway. Layout units are not engineering dimensions.
// Beam coordinates: +X downstream, Y vertical, Z transverse. The whole injector is
// rotated slightly to pass between TF magnets, with a tangential impact parameter.
const PI=Math.PI, TAU=2*PI, AXIS_Z=2.72, ANGLE=8*PI/180;
const BOX=new THREE.BoxGeometry(1,1,1), CYL=new THREE.CylinderGeometry(1,1,1,20);
const BOLT=new THREE.CylinderGeometry(1,1,1,6), BALL=new THREE.SphereGeometry(1,8,6);
const UP=new THREE.Vector3(0,1,0), TEMP=new THREE.Object3D();
export const NBI_LAYOUT=Object.freeze({axisZ:AXIS_Z,axisY:3.05,rotationY:ANGLE,sourceX:-11.8,neutralizerX:-8.55,dumpX:-6.25,calorimeterX:-4.78,ductX:-3.25,plasmaEndX:-.45,impactParameter:AXIS_Z});
export const NBI_STAGES=Object.freeze([
  {id:'beam-source',label:'负离子源与加速栅',short:'负离子源',description:'射频等离子体源产生氢或氘的负离子。七层抽取与加速栅的电场把带电粒子加速；ITER 型系统采用约 1 MeV 的负离子束。紫色示意负离子，束流在此仍带电。'},
  {id:'beam-neutralizer',label:'气体中和器',short:'气体中和',description:'高速负离子通过低压同种气体靶，部分失去电子而成为中性原子。四通道结构示意 ITER / MITICA 的气体中和器；出口仍混有中性粒子、正离子与负离子。'},
  {id:'beam-ion-dump',label:'静电残余离子吸收器',short:'离子分离',description:'中和器下游的五块纵向水冷板建立横向电场，把剩余正、负离子分别偏转到吸收板。青色中性粒子不受该电场偏转，沿原来的直线继续前进。'},
  {id:'beam-calorimeter',label:'可开合诊断量热器',short:'诊断量热',description:'两片水冷管排在诊断时合拢成 V 形，截获中性束并测量束功率；正常注入时两片展开并与束路平行，让中性束通过。量热器不是使中性束转弯的装置。'},
  {id:'beam-duct',label:'直线漂移管与切向注入口',short:'切向注入',description:'经过残余离子分离的中性原子沿直线漂移管进入同一个托卡马克。束路偏离中心、近似切向进入等离子体；中性原子在等离子体内被电离，随后通过碰撞把能量交给离子和电子。'},
]);
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const vec=p=>new THREE.Vector3(...p);
const metal=(color,roughness=.36)=>new THREE.MeshStandardMaterial({color,metalness:.78,roughness});
function mesh(parent,g,m,p=[0,0,0],s=[1,1,1],r=[0,0,0]){
  const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
const box=(p,m,c,s,r)=>mesh(p,BOX,m,c,s,r);
const cyl=(p,m,c,rad,h,r)=>mesh(p,CYL,m,c,[rad,h,rad],r);
function instances(parent,geometry,material,transforms){
  const object=new THREE.InstancedMesh(geometry,material,transforms.length);
  transforms.forEach((t,i)=>{TEMP.position.set(...t.p);TEMP.scale.set(...t.s);TEMP.rotation.set(...(t.r||[0,0,0]));TEMP.updateMatrix();object.setMatrixAt(i,TEMP.matrix);});
  object.castShadow=true;object.receiveShadow=true;object.instanceMatrix.needsUpdate=true;parent.add(object);return object;
}
function pipe(parent,material,points,radius=.035){
  const path=new THREE.CatmullRomCurve3(points.map(vec),false,'centripetal');
  return mesh(parent,new THREE.TubeGeometry(path,30,radius,6,false),material);
}
function beamTube(parent,material,path,radius,name){
  const object=mesh(parent,new THREE.TubeGeometry(path,48,radius,8,false),material);object.name=name;object.castShadow=false;object.receiveShadow=false;object.userData.beamPath=true;return object;
}
function rectangularFrame(parent,M,x,y,z,width=2.15,height=2.3,depth=.1){
  const pieces=[{p:[x,y-height/2,z],s:[depth,.09,width]},{p:[x,y+height/2,z],s:[depth,.09,width]},{p:[x,y,z-width/2],s:[depth,height,.09]},{p:[x,y,z+width/2],s:[depth,height,.09]}];
  instances(parent,BOX,M.stainless,pieces);
  const bolts=[];
  for(const dz of [-width/2+.13,width/2-.13])for(let j=0;j<6;j++)bolts.push({p:[x+.065,y-height/2+.15+j*(height-.3)/5,z+dz],s:[.025,.04,.025],r:[0,0,PI/2]});
  for(const dy of [-height/2+.04,height/2-.04])for(let j=1;j<6;j++)bolts.push({p:[x+.065,y+dy,z-width/2+j*width/6],s:[.025,.04,.025],r:[0,0,PI/2]});
  instances(parent,BOLT,M.dark,bolts);
}
function plaque(parent,text,english,x,y,z,width=1.9){
  // Canvas text is optional in headless geometry verification.
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=150;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#203039';ctx.fillRect(0,0,768,150);ctx.strokeStyle='#94a2a6';ctx.lineWidth=6;ctx.strokeRect(3,3,762,144);
  ctx.fillStyle='#e2e9e9';ctx.font='bold 49px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillText(text,384,66);
  ctx.fillStyle='#92adb5';ctx.font='26px Arial,sans-serif';ctx.fillText(english,384,118);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=mesh(parent,new THREE.PlaneGeometry(width,width*150/768),new THREE.MeshBasicMaterial({map:texture}),[x,y,z]);sign.name=`nbi-label-${english}`;sign.castShadow=false;
}
function flange(parent,M,x,y,z,radius=.58){
  const ring=mesh(parent,new THREE.TorusGeometry(radius,.055,8,32),M.stainless,[x,y,z],[1,1,1],[0,PI/2,0]);
  const bolts=[];for(let j=0;j<16;j++){const a=TAU*j/16;bolts.push({p:[x+.05,y+Math.sin(a)*radius,z+Math.cos(a)*radius],s:[.026,.055,.026],r:[0,0,PI/2]});}
  instances(parent,BOLT,M.dark,bolts);return ring;
}

export function buildNeutralBeam({parent,parts,coreY=3.05}){
  const group=new THREE.Group();group.name='neutral-beam';group.userData.partId='neutral-beam';group.rotation.y=ANGLE;
  group.userData.inspection={direction:[-.1,1.2,1.2],padding:1.19};
  group.userData.beamPhysics={type:'negative-ion',separator:'electrostatic',neutralPath:'straight',impactParameter:AXIS_Z,calorimeter:'open'};
  parent.add(group);
  const main={id:'neutral-beam',label:'负离子型中性束注入器',description:'依据 ITER / MITICA 原理布置的剖视注入器：负离子源与加速栅 → 气体中和器 → 静电残余离子吸收器 → 可开合诊断量热器 → 直线切向漂移管。紫色离子先加速，残余带电粒子被分离，中性原子保持直线进入等离子体。',object:group,stepIds:[3]};parts.push(main);
  const stages={};
  for(const stage of NBI_STAGES){const object=new THREE.Group();object.name=stage.id;object.userData.partId=stage.id;object.userData.inspection={direction:stage.id==='beam-source'?[-.4,1.45,1.05]:stage.id==='beam-duct'?[-.42,.58,1.05]:[-.1,1.2,1.2],padding:1.35};group.add(object);stages[stage.id]=object;parts.push({id:stage.id,label:stage.label,description:stage.description,object,stepIds:[3]});}
  const M={stainless:metal('#b7c4cc',.3),silver:metal('#cbd3d6'),dark:metal('#3c505b',.48),copper:metal('#b87a4b'),cooling:metal('#577f91'),ceramic:metal('#d5cebd',.65),black:metal('#283840',.6),
    negative:new THREE.MeshBasicMaterial({color:'#be83f4',transparent:true,opacity:.8,depthWrite:false}),neutral:new THREE.MeshBasicMaterial({color:'#50d7ef',transparent:true,opacity:.8,depthWrite:false,toneMapped:false}),positive:new THREE.MeshBasicMaterial({color:'#f7996f',transparent:true,opacity:.7,depthWrite:false}),
    neutralDots:new THREE.MeshBasicMaterial({color:'#a5f1ff',transparent:true,opacity:.95,toneMapped:false}),negativeDots:new THREE.MeshBasicMaterial({color:'#ddacff'}),positiveDots:new THREE.MeshBasicMaterial({color:'#ffc29f'}),
    gas:new THREE.MeshBasicMaterial({color:'#5b9fb9',transparent:true,opacity:.08,depthWrite:false,side:THREE.DoubleSide}),source:new THREE.MeshStandardMaterial({color:'#9c68be',emissive:'#8551b0',emissiveIntensity:.6,roughness:.4,metalness:.15})};
  const source=stages['beam-source'],neutralizer=stages['beam-neutralizer'],dump=stages['beam-ion-dump'],calorimeter=stages['beam-calorimeter'],duct=stages['beam-duct'];
  const y=coreY,z=AXIS_Z,front=z+1.14;
  // Structural chassis, vacuum vessel floor and rear wall. The front and top are
  // intentionally opened so that process components and the beam can be inspected.
  box(group,M.dark,[-8.5,.49,z],[8.35,.24,2.7]);
  box(group,M.stainless,[-8.5,1.91,z],[8.4,.13,2.3]);
  box(group,M.silver,[-8.5,y,z-1.14],[8.4,2.27,.1]);
  box(group,M.silver,[-8.5,4.22,z-.83],[8.4,.1,.6]);
  const supports=[],rails=[],anchors=[];
  for(const x of [-12,-10.05,-8.1,-6.15,-4.65])for(const dz of [-.97,.97]){
    supports.push({p:[x,1.19,z+dz],s:[.16,1.25,.18]});supports.push({p:[x,.64,z+dz],s:[.46,.14,.48]});
    for(const dx of [-.15,.15])anchors.push({p:[x+dx,.73,z+dz],s:[.036,.055,.036]});
  }
  for(const dz of [-.97,.97])rails.push({p:[-8.5,1.7,z+dz],s:[8.4,.17,.13]});
  instances(group,BOX,M.dark,supports);instances(group,BOX,M.stainless,rails);instances(group,BOLT,M.stainless,anchors);
  for(const x of [-12.65,-10.15,-7.25,-5.35,-4.25])rectangularFrame(group,M,x,y,z);
  // Rear cryopump panels and utility manifolds are distinct from the beam path.
  const fins=[];for(let i=0;i<36;i++)fins.push({p:[-10.1+i*.16,y,z-1.0],s:[.06,1.67,.2]});instances(group,BOX,M.cooling,fins);
  for(const yy of [2.1,3.94])pipe(group,M.cooling,[[-12.5,yy,z-.91],[-8.6,yy,z-.91],[-4.5,yy,z-.91],[-4.4,yy-.1,z-.65]],.052);

  // RF negative-ion plasma source with service drivers, insulated high-voltage
  // connection, seven extraction/acceleration grid frames and visible beamlets.
  box(source,M.copper,[-12.05,y,z],[.88,1.58,1.53]);
  box(source,M.source,[-11.57,y,z],[.035,1.08,1.06]);
  for(const dy of [-.42,.42])for(const dz of [-.39,.39]){
    cyl(source,M.dark,[-12.74,y+dy,z+dz],.26,.5,[0,0,PI/2]);
    cyl(source,M.ceramic,[-12.88,y+dy,z+dz],.225,.11,[0,0,PI/2]);
    const coils=[];for(let j=0;j<6;j++)coils.push({p:[-12.94+j*.065,y+dy,z+dz],s:[.275,.025,.275],r:[0,0,PI/2]});instances(source,CYL,M.copper,coils);
  }
  const gridBars=[];
  for(let i=0;i<7;i++){
    const x=-11.48+i*.175;
    rectangularFrame(source,M,x,y,z,1.37,1.47,.07);
    for(let k=1;k<7;k++)gridBars.push({p:[x,y-.57+k*.16,z],s:[.026,.014,1.16]});
    for(let k=1;k<6;k++)gridBars.push({p:[x,y,z-.59+k*.19],s:[.026,1.12,.014]});
  }
  instances(source,BOX,M.copper,gridBars);
  for(const x of [-11.42,-10.65])for(const dz of [-.84,.84])cyl(source,M.ceramic,[x,y,z+dz],.1,1.8);
  cyl(source,M.dark,[-12.05,4.64,z-.18],.25,.85);
  for(let i=0;i<7;i++)cyl(source,M.ceramic,[-12.05,4.33+i*.095,z-.18],.34,.052);
  pipe(source,M.copper,[[-12.05,5.1,z-.18],[-12.65,5.1,z-.18],[-13.04,4.88,z-.18],[-13.04,2.2,z-.18]],.075);
  plaque(source,'01 负离子源 · 加速栅','NEGATIVE IONS / ACCELERATOR',-11.85,2.1,front,2.12);
  const negativePath=new THREE.LineCurve3(vec([-11.55,y,z]),vec([-8.5,y,z]));
  beamTube(source,M.negative,negativePath,.08,'nbi-negative-ion-axis');
  const beamlets=[];for(const dy of [-.29,-.1,.1,.29])for(const dz of [-.27,-.09,.09,.27])beamlets.push({p:[-10.94,y+dy,z+dz],s:[1.14,.013,.013]});
  const beamletObject=instances(source,BOX,M.negative,beamlets);beamletObject.castShadow=false;

  // Four longitudinal gas channels: five cooled separator walls, top/bottom and
  // gas feed tubing. The purple-to-cyan transition occurs inside this cell.
  // The shown beam occupies one of the four channels, never a separator wall.
  const channels=[];for(let i=0;i<5;i++)channels.push({p:[-8.61,i<3?y:y-.45,z-.9125+i*.365],s:[2.67,i<3?1.25:.35,.055]});
  channels.push({p:[-8.61,y-.65,z],s:[2.67,.06,1.52]});
  const neutralizerWalls=instances(neutralizer,BOX,M.copper,channels);neutralizerWalls.name='nbi-neutralizer-separator-walls';
  box(neutralizer,M.gas,[-8.6,y,z],[2.6,1.24,1.48]);
  for(const x of [-9.55,-8.5,-7.58])for(const dz of [-.55,.18,.55])pipe(neutralizer,M.cooling,[[x,4.14,z-.7],[x,3.83,z-.7],[x,3.83,z+dz],[x,3.62,z+dz]],.025);
  plaque(neutralizer,'02 气体中和器','GAS NEUTRALIZER · 4 CHANNELS',-8.6,2.1,front,2.36);
  const neutralPath=new THREE.LineCurve3(vec([-8.75,y,z]),vec([-5.28,y,z]));
  beamTube(neutralizer,M.neutral,neutralPath,.07,'nbi-neutral-axis');

  // Electrostatic residual-ion dump: five longitudinal panels and opposite
  // charged-particle trajectories, not a bending magnet in the neutral path.
  // Near-side upper panel sections are cut away for the explanatory view.
  // The actual interception patch at the positive-ion endpoint remains solid.
  const dumpPanels=[];for(let i=0;i<5;i++)dumpPanels.push({p:[-6.29,i<3?y:y-.525,z-1.025+i*.41],s:[1.72,i<3?1.47:.42,.07]});
  const ridPanels=instances(dump,BOX,M.copper,dumpPanels);ridPanels.name='nbi-rid-panels';
  box(dump,M.copper,[-5.7,y,z+.205],[.38,1.47,.07]).name='nbi-positive-ion-interception-patch';
  for(const x of [-6.93,-5.64])for(const dz of [-1.025,-.615,-.205,.205,.615]){
    cyl(dump,M.ceramic,[x,2.12,z+dz],.06,.32);
    pipe(dump,M.cooling,[[x,2.23,z+dz],[x,1.99,z+dz],[x+.15,1.99,z+dz]],.022);
  }
  // Opposite charges curve to the two bounding plates of the same channel;
  // they do not cross through intervening solid panels.
  const chargedCurves={};
  for(const [charge,side,material] of [['positive',1,M.positive],['negative',-1,M.negative]]){
    const curve=new THREE.QuadraticBezierCurve3(vec([-7.1,y+.12,z]),vec([-6.4,y+.12,z+side*.018]),vec([-5.79,y+.12,z+side*.17]));chargedCurves[charge]=curve;
    beamTube(dump,material,curve,.031,`nbi-${charge}-ion-dump-path`);
    for(let i=0;i<11;i++)box(dump,M.black,[-5.89+i*.031,y,z+side*.205],[.018,1.36,.075]);
  }
  plaque(dump,'03 残余离子吸收器','ELECTROSTATIC ION DUMP',-6.27,2.1,front,1.75);

  // Two water-cooled movable leaves are parallel and outside the neutral axis
  // during injection; on diagnostics their upstream ends meet as a V-shaped dump.
  const leaves=[];
  for(const side of [-1,1]){
    const leaf=new THREE.Group();leaf.name=`nbi-calorimeter-leaf-${side===1?'positive':'negative'}`;leaf.position.set(-4.27,y,z+side*.67);calorimeter.add(leaf);leaves.push({leaf,side});
    box(leaf,M.dark,[-.52,0,0],[1.08,1.55,.08]);
    const tubes=[];for(let i=0;i<16;i++)tubes.push({p:[-.52,-.65+i*.087,side<0?.058:-.058],s:[.031,1.06,.031],r:[0,0,PI/2]});instances(leaf,CYL,M.copper,tubes);
    for(const yy of [-.76,.76])cyl(leaf,M.cooling,[-.52,yy,0],.065,1.17,[0,0,PI/2]);
    cyl(calorimeter,M.stainless,[-4.27,y,z+side*.67],.085,1.98);
    cyl(calorimeter,M.dark,[-4.27,4.18,z+side*.67],.16,.26);
  }
  plaque(calorimeter,'04 诊断量热器','OPEN DURING INJECTION',-4.8,2.1,front,1.13);

  // Straight, flange-jointed duct. A longitudinal cut in the near shell makes
  // the neutral path visible without implying that the beam follows utility pipes.
  const ductStart=-4.16,ductEnd=-2.45;
  const shell=new THREE.CylinderGeometry(.47,.47,ductEnd-ductStart,24,1,true,.18,PI*1.45);
  mesh(duct,shell,M.stainless,[(ductStart+ductEnd)/2,y,z],[1,1,1],[0,0,PI/2]);
  for(const x of [-4.12,-3.55,-2.77,-2.47])flange(duct,M,x,y,z,x===-2.77?.65:.52);
  for(let i=0;i<10;i++)flange(duct,M,-3.49+i*.043,y,z,.49);
  // Port collar reaches the cut vessel wall rather than terminating in mid-air.
  rectangularFrame(duct,M,-2.74,y,z,1.06,.96,.14);
  box(duct,M.dark,[-3.52,1.1,z],[.17,1.8,.18]);box(duct,M.stainless,[-3.52,.25,z],[.6,.16,.6]);
  plaque(duct,'05 直线切向注入','STRAIGHT NEUTRAL BEAM',-3.3,2.43,z+.56,1.48);
  const downstream=new THREE.Group();downstream.name='nbi-to-plasma';duct.add(downstream);
  beamTube(downstream,M.neutral,new THREE.LineCurve3(vec([-5.28,y,z]),vec([-.45,y,z])),.052,'nbi-neutral-injection-path');
  const diagnosticIntercept=beamTube(calorimeter,M.neutral,new THREE.LineCurve3(vec([-5.28,y,z]),vec([-5.12,y,z])),.052,'nbi-diagnostic-intercept');
  const arrows=[];for(const x of [-9.7,-7.6,-5.4,-3.8,-2.3])for(const side of [-1,1])arrows.push({p:[x,y+.22,z+side*.08],s:[.22,.012,.018],r:[0,side*.58,0]});
  const arrowObject=instances(group,BOX,M.neutral,arrows);arrowObject.castShadow=false;

  const particleCount=58,neutralParticles=new THREE.InstancedMesh(BALL,M.neutralDots,particleCount);neutralParticles.name='nbi-neutral-particles';neutralParticles.castShadow=false;neutralParticles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(neutralParticles);
  const negativeParticles=new THREE.InstancedMesh(BALL,M.negativeDots,24);negativeParticles.name='nbi-negative-particles';negativeParticles.castShadow=false;negativeParticles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(negativeParticles);
  const dumpParticles={};for(const charge of ['positive','negative']){const o=new THREE.InstancedMesh(BALL,charge==='positive'?M.positiveDots:M.negativeDots,8);o.name=`nbi-${charge}-dump-particles`;o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);o.castShadow=false;group.add(o);dumpParticles[charge]=o;}
  const glowObjects=[source.getObjectByName('nbi-negative-ion-axis'),neutralizer.getObjectByName('nbi-neutral-axis'),beamletObject,arrowObject,dump.getObjectByName('nbi-positive-ion-dump-path'),dump.getObjectByName('nbi-negative-ion-dump-path')];
  function update(time=0,state={}){
    const t=Number.isFinite(time)?time:0,activity=clamp(state.activity??1),standby=state.phase==='standby',active=activity>.015&&!standby,diagnostic=Boolean(state.nbiDiagnostic);
    const intensity=activity*(state.phase==='running'?.53:.9),end=diagnostic?-5.12:-.45;
    group.userData.beamPhysics.calorimeter=diagnostic?'closed':'open';
    for(const {leaf,side} of leaves)leaf.rotation.y=diagnostic?-side*.67:0;
    downstream.visible=active&&!diagnostic;
    diagnosticIntercept.visible=active&&diagnostic;
    for(const o of glowObjects)o.visible=active;
    arrowObject.visible=active&&!diagnostic;
    neutralParticles.visible=active;negativeParticles.visible=active;for(const o of Object.values(dumpParticles))o.visible=active;
    M.negative.opacity=intensity*.64;M.neutral.opacity=activity*.78;M.positive.opacity=intensity*.76;M.neutralDots.opacity=activity*.95;
    M.source.emissiveIntensity=.14+intensity*.7;
    const phase=(speed,index,count)=>((t*speed+index/count)%1+1)%1;
    const put=(object,index,p,size)=>{TEMP.position.copy(p);TEMP.quaternion.identity();TEMP.scale.setScalar(size);TEMP.updateMatrix();object.setMatrixAt(index,TEMP.matrix);};
    for(let i=0;i<particleCount;i++){
      const f=phase(.28,i,particleCount),dy=((i%3)-1)*.075,dz=((i%5)-2)*.046;
      put(neutralParticles,i,vec([-8.75+(end+8.75)*f,y+dy,z+dz]),.025);
    }
    for(let i=0;i<24;i++)put(negativeParticles,i,negativePath.getPoint(phase(.42,i,24)),.022);
    for(const charge of ['positive','negative'])for(let i=0;i<8;i++)put(dumpParticles[charge],i,chargedCurves[charge].getPoint(phase(.53,i,8)),.025);
    for(const object of [neutralParticles,negativeParticles,...Object.values(dumpParticles)]){object.instanceMatrix.needsUpdate=true;object.computeBoundingSphere();}
  }
  update(0,{activity:1,phase:'running'});
  return {group,parts:[main,...NBI_STAGES.map(stage=>parts.find(p=>p.id===stage.id))],update};
}
