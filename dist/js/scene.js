import * as THREE from '../vendor/three.module.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {STEPS} from './steps.js';
import {buildPlant} from './plant.js';
import {PLANT_LAYOUT,STEP_BINDINGS,FLOW_ROUTES} from './layout.js';
import {calculateEnergy} from './energy.js';
import {operatingPowers} from './operation.js';
import {fitDistance} from './camera-fit.js';
import {frameDelta,loopPhase} from './animation.js';
import {inspectionView,inspectionDirections,highlightOpacity,framingDistance} from './inspection.js';
import {createFlowCurve} from './site-layout.js';
import {createInspectionVisibility} from './visibility.js';

const NS='http://www.w3.org/2000/svg';
const FOCUS_PART={1:'tanks',2:'vessel',3:'neutral-beam',4:'coils',5:'plasma',6:'exchanger',7:'separator',8:'turbine',9:'lamp'};
export function createExperience(container,callbacks={}){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd5d6');scene.fog=new THREE.Fog('#cbd5d6',100,210);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.domElement.setAttribute('tabindex','0');renderer.domElement.setAttribute('aria-label','相互连接的托卡马克聚变电厂三维模型，可旋转、缩放、拆解和查看能量回流');
  container.prepend(renderer.domElement);
  const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const environmentMap=pmrem.fromScene(environment,.035);scene.environment=environmentMap.texture;scene.environmentIntensity=.65;environment.dispose?.();pmrem.dispose();
  const hemisphere=new THREE.HemisphereLight('#fffef9','#6f8790',1.9);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight('#fff4df',3.2);sun.position.set(-16,38,17);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth<600?1024:2048,innerWidth<600?1024:2048);Object.assign(sun.shadow.camera,{left:-36,right:36,top:31,bottom:-31,near:1,far:95});sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight('#c2d8ed',1);fill.position.set(22,18,-15);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:'#b9c5c5',roughness:.95,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-.55;ground.receiveShadow=true;scene.add(ground);
  const plant=buildPlant();scene.add(plant.group);
  const inspectionVisibility=createInspectionVisibility(plant.group);let inspectionSubject=null,autoReveal=true,lastOcclusionSignature='';
  const isolationVisibility=new Map();const originalVisibility=new Map();plant.group.traverse(o=>{if(o.isMesh||o.isLine||o.isLight)originalVisibility.set(o,o.visible);});
  plant.group.updateMatrixWorld(true);const overviewPoints=[];plant.group.traverse(o=>{if(!o.isMesh)return;const b=new THREE.Box3().setFromObject(o);if(b.isEmpty())return;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])overviewPoints.push(new THREE.Vector3(x,y,z));});
  const floorLabels=[['TOKAMAK ISLAND',[-2,.17,-9],6],['HEAT EXCHANGE',[7,.17,-8],5],['TURBINE / GENERATOR',[8,.17,10.2],7],['FUEL CYCLE',[-12,.17,10],5],['GRID CONNECTION',[15,.17,13.4],5]];
  floorLabels.forEach(([text,pos,w])=>{const c=document.createElement('canvas');c.width=768;c.height=96;const ctx=c.getContext('2d');ctx.font='500 39px Arial';ctx.textAlign='center';ctx.fillStyle='#6f858a';ctx.fillText(text,384,62);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w/8),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.6}));mesh.position.fromArray(pos);mesh.rotation.x=-Math.PI/2;mesh.raycast=()=>{};scene.add(mesh);});
  const camera=new THREE.PerspectiveCamera(40,1,.12,320);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=1;controls.maxDistance=190;controls.maxPolarAngle=Math.PI*.48;controls.target.set(0,1.5,1);
  let width=1,height=1,selected=null,selectedPart=null,isolated=false,mode='plant',paused=false,disposed=false,time=0,last=performance.now(),tween=null,explode=0,explodeGoal=0,phase='running',phaseStart=0,lastPhaseName='',energy=calculateEnergy(),lighting='day',lastLoadState='',nbiDiagnostic=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labelRoot=container.querySelector('#labels'),leaderRoot=container.querySelector('#leaders');const labels=[],partLabels=[],energyLabels=[];
  const selectionBox=new THREE.Box3(),selectionHelper=new THREE.Box3Helper(selectionBox,0xb38931);selectionHelper.visible=false;selectionHelper.material.transparent=true;selectionHelper.material.opacity=.65;selectionHelper.raycast=()=>{};scene.add(selectionHelper);
  const highlightRoot=new THREE.Group();highlightRoot.renderOrder=30;scene.add(highlightRoot);
  const highlightMaterial=new THREE.MeshBasicMaterial({color:'#ffc65a',transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false,side:THREE.DoubleSide});
  let highlighted=[],highlightStart=-Infinity;
  function emphasize(part){
    highlightRoot.clear();highlighted=[];
    if(!part)return;callbacks.onInspect?.({id:part.id,label:part.label});
    part.object.updateWorldMatrix(true,true);
    part.object.traverse(source=>{if(!source.isMesh)return;
      const overlay=source.isInstancedMesh?new THREE.InstancedMesh(source.geometry,highlightMaterial,source.count):new THREE.Mesh(source.geometry,highlightMaterial);
      if(source.isInstancedMesh){overlay.instanceMatrix=source.instanceMatrix;overlay.count=source.count;}
      overlay.matrixAutoUpdate=false;overlay.frustumCulled=false;overlay.renderOrder=30;overlay.raycast=()=>{};
      highlightRoot.add(overlay);highlighted.push({source,overlay});
    });
    highlightStart=performance.now()+(reduced?0:1150);
  }
  function updateEmphasis(now){
    highlightMaterial.opacity=highlightOpacity(now-highlightStart,reduced);
    highlightRoot.visible=highlightMaterial.opacity>.001;
    if(!highlightRoot.visible)return;
    for(const {source,overlay} of highlighted){source.updateWorldMatrix(true,false);overlay.matrix.copy(source.matrixWorld);let visible=true,node=source;while(node&&node!==plant.group){if(!node.visible)visible=false;node=node.parent;}overlay.visible=visible;}
  }
  STEPS.forEach(step=>{const binding=STEP_BINDINGS[step.id];const el=document.createElement('button');el.className='node-label';el.innerHTML=`<span class="label-number">${String(step.id).padStart(2,'0')}</span><span>${step.shortTitle}</span><span class="label-arrow">↗</span>`;el.setAttribute('aria-label',`探索第${step.id}步：${step.title}`);el.addEventListener('click',()=>callbacks.onSelect?.(step.id));labelRoot.append(el);const line=document.createElementNS(NS,'line');line.setAttribute('stroke','#526d79');line.setAttribute('stroke-opacity','.48');line.setAttribute('stroke-width','.8');leaderRoot.append(line);labels.push({el,line,id:step.id,anchor:new THREE.Vector3(...binding.label),target:new THREE.Vector3(...binding.target),offset:binding.offset});});
  [['alpha','α 粒子留在等离子体',[-1,6.9,-1]],['recirc','厂内电力回供',[1,2.1,-8]],['net','净电力送往负载',[17,3,8]]].forEach(([id,title,p])=>{const el=document.createElement('div');el.className='energy-marker';el.innerHTML=`<span>${title}</span><strong><b></b><small>MW</small></strong>`;labelRoot.append(el);energyLabels.push({id,el,anchor:new THREE.Vector3(...p)});});
  const flowRoot=new THREE.Group();scene.add(flowRoot);const flows=[];const pointGeometry=new THREE.SphereGeometry(1,7,5),dummy=new THREE.Object3D();
  for(const route of FLOW_ROUTES){const curve=createFlowCurve(route,{lift:route.radius*1.25});const count=['feedback','grid'].includes(route.kind)?18:10;const material=new THREE.MeshBasicMaterial({color:route.color,transparent:true,opacity:.8,depthWrite:false,toneMapped:false});const dots=new THREE.InstancedMesh(pointGeometry,material,count);dots.frustumCulled=false;dots.raycast=()=>{};flowRoot.add(dots);const trace=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),new THREE.LineBasicMaterial({color:route.color,transparent:true,opacity:.12,depthWrite:false,toneMapped:false}));trace.raycast=()=>{};flowRoot.add(trace);flows.push({route,curve,dots,trace,count});}
  const raycaster=new THREE.Raycaster();raycaster.params.Line.threshold=.035;const pointer=new THREE.Vector2();let pointerDown=null;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(plant.parts.map(p=>p.object),true);let part;const ghosted=inspectionVisibility.blockers;for(const hit of hits){if(ghosted.has(hit.object))continue;let visible=true,ancestor=hit.object;while(ancestor){if(!ancestor.visible)visible=false;ancestor=ancestor.parent;}if(!visible)continue;let node=hit.object;while(node&&!part){part=plant.parts.find(p=>p.object===node);node=node.parent;}if(part)break;}if(!part)return;if(selected&&part.stepIds.includes(selected))callbacks.onPart?.(part.id);else callbacks.onSelect?.(part.stepIds[0]);});
  controls.addEventListener('start',()=>{tween=null;});
  function travel(pos,target,duration=1150){tween={from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),target,start:performance.now(),duration:reduced?0:duration};}
  function inspectionWidth(){return innerWidth>900?Math.min(330,width*.42):0;}
  function fitBox(box,target,direction=new THREE.Vector3(30,28,35).normalize(),padding=1.13,inspect=false){const aspect=inspect?(width-inspectionWidth())/height:camera.aspect;const distance=framingDistance({min:box.min.toArray(),max:box.max.toArray()},target.toArray(),direction.toArray(),camera.fov,aspect,padding,inspect?inspectionWidth()/width:0);return target.clone().addScaledVector(direction,distance);}
  function inspectionPose(box,subject,direction,padding){
    const target=subject.clone(),position=fitBox(box,target,direction,padding,true),panel=inspectionWidth();
    if(panel){const distance=position.distanceTo(target),right=new THREE.Vector3(0,1,0).cross(direction).normalize(),shift=right.multiplyScalar(distance*Math.tan(camera.fov*Math.PI/360)*camera.aspect*panel/width);position.add(shift);target.add(shift);}
    return {position,target};
  }
  function inspectBox(box,target,direction,padding=1.18,chooseView=true){
    let best=inspectionPose(box,target,direction,padding);
    if(inspectionSubject&&chooseView){
      // Analyze unghosted geometry even when the user temporarily wants solid context.
      inspectionVisibility.setTarget(inspectionSubject);
      const probe=camera.clone();let bestScore=-Infinity;
      inspectionDirections(direction.toArray()).forEach((vector,index)=>{
        const pose=inspectionPose(box,target,new THREE.Vector3(...vector),padding);
        probe.position.copy(pose.position);probe.lookAt(pose.target);probe.updateMatrixWorld(true);
        const result=inspectionVisibility.analyze(probe,{quality:'preview'}),score=(result.visibleRatio-.32*(1-(result.confidence??1)))*100-(result.assemblyCount??result.blockers.size)*.25-index*.18;
        if(result.sampleCount&&score>bestScore){bestScore=score;best=pose;}
      });
      if(!autoReveal)inspectionVisibility.reset();
    }
    travel(best.position,best.target);
  }
  function updateOcclusion(now){
    if(tween)return;
    if(!autoReveal||!inspectionSubject||isolated){if(lastOcclusionSignature){lastOcclusionSignature='';renderer.shadowMap.needsUpdate=true;callbacks.onOcclusion?.(0);}return;}
    inspectionVisibility.update(camera,now);
    const blockers=inspectionVisibility.blockers,signature=[...blockers].map(mesh=>mesh.id).sort((a,b)=>a-b).join(',');
    if(signature!==lastOcclusionSignature){lastOcclusionSignature=signature;renderer.shadowMap.needsUpdate=true;callbacks.onOcclusion?.(blockers.size);}
  }
  function setAutoReveal(value){autoReveal=!!value;inspectionVisibility.reset();if(autoReveal&&inspectionSubject&&!isolated)inspectionVisibility.setTarget(inspectionSubject);lastOcclusionSignature='';renderer.shadowMap.needsUpdate=true;callbacks.onOcclusion?.(0);}

  function overviewCamera(){const target=mode==='exploded'?new THREE.Vector3(-2,3,-1):new THREE.Vector3(0,1.6,1);if(mode==='exploded')return {target,position:fitBox(new THREE.Box3(new THREE.Vector3(-10,-.3,-8),new THREE.Vector3(7,13,8)),target)};const direction=new THREE.Vector3(30,28,35).normalize(),right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize(),v=Math.tan(camera.fov*Math.PI/360),h=v*camera.aspect;let distance=10;for(const point of overviewPoints){const p=point.clone().sub(target);distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(p.dot(right))*1.1/h,Math.abs(p.dot(up))*1.1/v));}return {target,position:target.clone().addScaledVector(direction,distance)};}
  function clearParts(){partLabels.splice(0).forEach(p=>p.el.remove());}
  function setIsolated(value){inspectionVisibility.reset();isolated=!!value&&!!selectedPart;if(!isolated&&autoReveal&&inspectionSubject)inspectionVisibility.setTarget(inspectionSubject);if(!isolated){for(const [o,visible] of isolationVisibility)o.visible=visible;isolationVisibility.clear();}renderer.shadowMap.needsUpdate=true;}
  function overview(){inspectionSubject=null;inspectionVisibility.reset();nbiDiagnostic=false;setIsolated(false);setLighting('day');selected=null;selectedPart=null;selectionHelper.visible=false;highlightStart=-Infinity;clearParts();const v=overviewCamera();travel(v.position,v.target);}
  function getParts(id){return plant.parts.filter(p=>p.stepIds.includes(id));}
  function selectStep(id){if(!STEP_BINDINGS[id])return;if(id!==3)nbiDiagnostic=false;setIsolated(false);selected=id;selectedPart=null;clearParts();const parts=getParts(id);const primary=parts.find(p=>p.id===FOCUS_PART[id])||parts[0];const target=primary?new THREE.Box3().setFromObject(primary.object).getCenter(new THREE.Vector3()):new THREE.Vector3(...STEP_BINDINGS[id].target);const box=primary?new THREE.Box3().setFromObject(primary.object):new THREE.Box3().setFromCenterAndSize(target,new THREE.Vector3(5,5,5));box.expandByScalar(id===4||id===2||id===5?.7:.75);inspectionSubject=primary?.object??null;inspectionVisibility.setTarget(inspectionSubject);const view=inspectionView(primary),dir=new THREE.Vector3(...view.direction).normalize();inspectBox(box,target,dir,view.padding);selectionBox.copy(box);selectionHelper.visible=true;emphasize(primary);if(id===9)setLighting('dusk');else setLighting('day');
    parts.forEach((part,i)=>{const el=document.createElement('button');el.className='part-marker';el.textContent=String(i+1);el.title=part.label;el.setAttribute('aria-label',`观察 ${part.label}`);el.addEventListener('click',()=>callbacks.onPart?.(part.id));labelRoot.append(el);partLabels.push({el,part,id:part.id,index:i});});}
  function focusPart(id){const part=getParts(selected).find(p=>p.id===id);if(!part)return;setIsolated(false);selectedPart=id;inspectionSubject=part.object;inspectionVisibility.setTarget(inspectionSubject);const box=new THREE.Box3().setFromObject(part.object),target=box.getCenter(new THREE.Vector3());const view=inspectionView(part),direction=new THREE.Vector3(...view.direction).normalize();inspectBox(box,target,direction,view.padding);selectionBox.copy(box);selectionHelper.visible=true;emphasize(part);partLabels.forEach(p=>p.el.classList.toggle('is-active',p.id===id));}
  function setLighting(value){lighting=value==='dusk'?'dusk':'day';const dusk=lighting==='dusk';scene.background.set(dusk?'#263746':'#cbd5d6');scene.fog.color.copy(scene.background);scene.environmentIntensity=dusk?.23:.65;hemisphere.intensity=dusk?.32:1.9;sun.intensity=dusk?.48:3.2;fill.intensity=dusk?.35:1;renderer.toneMappingExposure=dusk?1.15:1.05;container.dataset.lighting=lighting;callbacks.onLighting?.(lighting);}
  function setMode(value){if(!['plant','energy','exploded'].includes(value))return;mode=value;container.dataset.view=value;explodeGoal=value==='exploded'?1:0;overview();}
  function startSequence(){phase='startup';phaseStart=time;lastPhaseName='';}
  function setPower(value){energy=value;}
  function resize(){width=container.clientWidth;height=container.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);if(!selected){const v=overviewCamera();travel(v.position,v.target,500);}else{const parts=getParts(selected),part=parts.find(p=>p.id===(selectedPart||FOCUS_PART[selected]))||parts[0];if(part){const box=new THREE.Box3().setFromObject(part.object);if(!selectedPart)box.expandByScalar(.75);const target=box.getCenter(new THREE.Vector3()),view=inspectionView(part);inspectBox(box,target,camera.position.clone().sub(controls.target).normalize(),view.padding,false);}}}
  const observer=new ResizeObserver(resize);observer.observe(container);
  function projected(p){const n=p.clone().project(camera);return {x:(n.x*.5+.5)*width,y:(-.5*n.y+.5)*height,z:n.z};}
  function layoutLabels(){if(selected){labels.forEach(l=>{l.el.style.display='none';l.line.style.display='none';});return;}const boxes=labels.map(l=>{const a=projected(l.anchor);const w=l.el.offsetWidth||110,h=l.el.offsetHeight||29;return {l,a,w,h,x:Math.max(w/2+7,Math.min(width-w/2-7,a.x+l.offset[0]*(width<600?.5:1))),y:Math.max(79,Math.min(height-48,a.y+l.offset[1]))};});
    for(let pass=0;pass<15;pass++)for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j],dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2+8-Math.abs(dx),oy=(a.h+b.h)/2+7-Math.abs(dy);if(ox>0&&oy>0){if(oy<ox){const d=(oy+.1)/2*(dy>=0?1:-1);a.y-=d;b.y+=d;}else{const d=(ox+.1)/2*(dx>=0?1:-1);a.x-=d;b.x+=d;}for(const q of [a,b]){q.x=Math.max(q.w/2+7,Math.min(width-q.w/2-7,q.x));q.y=Math.max(78,Math.min(height-46,q.y));}}}
    boxes.forEach(({l,a,x,y})=>{l.el.style.display='flex';l.el.style.left=`${x}px`;l.el.style.top=`${y}px`;l.line.style.display='';const t=projected(l.target);l.line.setAttribute('x1',t.x);l.line.setAttribute('y1',t.y);l.line.setAttribute('x2',x);l.line.setAttribute('y2',y);});}
  function updatePhase(){if(phase!=='startup')return {activity:phase==='standby'?0:1,generator:phase==='standby'?0:1,alpha:phase==='standby'?0:1,index:4,name:phase==='standby'?'停机':'持续运行'};const t=time-phaseStart,index=t<3?0:t<7?1:t<10?2:t<14?3:4;const name=['外部电网供电','击穿与辅助升温','α 粒子自加热','蒸汽推动汽轮机','厂内电力回供'][index];if(t>=18){phase='running';callbacks.onPhase?.({phase:'running',index:4,name:'持续运行'});}return {activity:THREE.MathUtils.clamp((t-2)/7,0,1),generator:THREE.MathUtils.clamp((t-9)/5,0,1),alpha:THREE.MathUtils.clamp((t-6)/5,0,1),index,name};}
  function animate(now){if(disposed)return;requestAnimationFrame(animate);const dt=frameDelta(now,last);last=now;if(!paused)time+=dt;const visualTime=reduced?0:time;
    const oldExplode=explode;explode=reduced?explodeGoal:THREE.MathUtils.lerp(explode,explodeGoal,Math.min(dt*3.3,1));if(Math.abs(oldExplode-explode)>.0002){renderer.shadowMap.needsUpdate=true;inspectionVisibility.invalidate?.();}
    const operating=updatePhase();if(operating.name!==lastPhaseName){lastPhaseName=operating.name;callbacks.onPhase?.({phase,index:operating.index,name:operating.name});}
    const live=operatingPowers(energy,operating);
    for(const [o,visible] of isolationVisibility)o.visible=visible;isolationVisibility.clear();
    plant.update(visualTime,paused||reduced?0:dt,{activity:operating.activity,explode,power:energy.fusionMW/2000,phase,netMW:live.netMW,generator:operating.generator,alpha:operating.alpha,lighting,nbiDiagnostic});
    const loadKey=live.netMW>1e-8&&operating.generator>0?'on':'off';if(loadKey!==lastLoadState){lastLoadState=loadKey;callbacks.onLoadState?.({powered:loadKey==='on',netMW:live.netMW});}
    if(tween){let f=tween.duration?Math.min((now-tween.start)/tween.duration,1):1;f=f<.5?4*f*f*f:1-Math.pow(-2*f+2,3)/2;camera.position.lerpVectors(tween.from,tween.to,f);controls.target.lerpVectors(tween.fromTarget,tween.target,f);if(f===1)tween=null;}controls.update();
    flows.forEach(({route,curve,dots,trace,count})=>{const isElectrical=['electricity','feedback','grid'].includes(route.kind);let activity=isElectrical?operating.generator:operating.activity;let reverse=false;if(route.kind==='grid'){activity=Math.abs(live.netMW)>1e-8?Math.min(1,Math.abs(live.netMW)/Math.max(Math.abs(energy.netMW),120)):0;reverse=live.netMW<0;}if(route.kind==='feedback')activity=Math.min(1,live.demandMW/Math.max(energy.recirculatingMW,1));dots.visible=activity>.02;trace.material.opacity=mode==='energy'?(isElectrical?.62:.32):.08;dots.material.opacity=mode==='energy'?.95:.7;for(let i=0;i<count;i++){const p=loopPhase(visualTime,.07+(route.kind==='feedback'?.03:0),i/count);dummy.position.copy(curve.getPoint(reverse?1-p:p));const radius=(mode==='energy'&&isElectrical?.16:.085)*Math.min(1,activity+.15);dummy.scale.setScalar(radius);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);}dots.instanceMatrix.needsUpdate=true;});
    if(isolated){const part=plant.parts.find(p=>p.id===selectedPart);for(const [o] of originalVisibility){let node=o,inside=false;while(node){if(node===part?.object){inside=true;break;}node=node.parent;}if(!inside){isolationVisibility.set(o,o.visible);o.visible=false;}}}flowRoot.visible=!isolated;
    layoutLabels();partLabels.forEach(({el,part,index})=>{const box=new THREE.Box3().setFromObject(part.object),p=box.getCenter(new THREE.Vector3());p.y=box.max.y+.35+index*.18;const q=projected(p);el.style.display=(!isolated||part.id===selectedPart)&&q.z>-1&&q.z<1?'grid':'none';el.style.left=`${Math.max(16,Math.min(width-16,q.x))}px`;el.style.top=`${Math.max(75,Math.min(height-44,q.y))}px`;});
    energyLabels.forEach(({id,el,anchor})=>{el.style.display=mode==='energy'&&!selected?'block':'none';if(el.style.display==='none')return;const p=projected(anchor),offset=id==='alpha'?[-82,-22]:id==='recirc'?[85,-8]:[35,22];el.style.left=`${Math.max(75,Math.min(width-75,p.x+offset[0]*(width<600?.7:1)))}px`;el.style.top=`${Math.max(92,Math.min(height-70,p.y+offset[1]))}px`;const value=id==='alpha'?live.alphaMW:id==='recirc'?live.demandMW:Math.abs(live.netMW);if(id==='net')el.querySelector('span').textContent=live.netMW<0?'外部电力补入':live.netMW>0?'净电力送往负载':'电网功率收支平衡';if(id==='recirc')el.querySelector('span').textContent=live.netMW>=0?'发电回供厂用':'辅助系统用电';el.querySelector('small').textContent=id==='alpha'?'MWth':'MWe';el.querySelector('b').textContent=Math.round(value).toLocaleString('en-US');});
    updateOcclusion(now);updateEmphasis(now);renderer.render(scene,camera);
  }
  resize();const initial=overviewCamera();camera.position.copy(initial.position);controls.target.copy(initial.target);tween=null;requestAnimationFrame(animate);callbacks.onReady?.();
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();callbacks.onError?.('三维画面中断，请刷新页面恢复。');});
  return {selectStep,focusPart,overview,getParts,setIsolated,setAutoReveal,setMode,setLighting,setNbiDiagnostic(value){nbiDiagnostic=!!value;inspectionVisibility.invalidate();renderer.shadowMap.needsUpdate=true;},setPower,startSequence,resize,zoom(factor){tween=null;const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);offset.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset);controls.update();},setPaused(value){paused=value;},getState(){return {selected,selectedPart,mode,phase,explode,energy,partCount:plant.parts.length,width,height};},dispose(){disposed=true;observer.disconnect();controls.dispose();inspectionVisibility.dispose();highlightMaterial.dispose();renderer.dispose();environmentMap.dispose();}};
}
