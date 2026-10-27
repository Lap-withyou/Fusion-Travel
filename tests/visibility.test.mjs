import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createInspectionVisibility} from '../dist/js/visibility.js';
import {buildPlant} from '../dist/js/plant.js';
import {inspectionView,inspectionDirections,framingDistance} from '../dist/js/inspection.js';

function fixture(){
  const root=new THREE.Group(),target=new THREE.Group();root.add(target);
  const material=new THREE.MeshStandardMaterial({color:'#888888'});
  const mesh=(parent,position,size=[2,2,2],mat=material)=>{
    const object=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);object.position.fromArray(position);parent.add(object);return object;
  };
  const subject=mesh(target,[0,2,0]);
  const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.set(0,2,10);camera.lookAt(0,2,0);camera.updateMatrixWorld();
  assert.equal(typeof createInspectionVisibility,'function','inspection requires an actual geometry occlusion controller');
  const visibility=createInspectionVisibility(root);visibility.setTarget(target);
  return {root,target,subject,material,mesh,camera,visibility};
}

test('a foreground wall is ghosted without changing another mesh sharing its material',()=>{
  const f=fixture(),wall=f.mesh(f.root,[0,2,5],[6,5,.5]),other=f.mesh(f.root,[8,2,5]);
  assert.equal(f.visibility.update(f.camera,0),1);
  assert.ok(f.visibility.blockers.has(wall));assert.notEqual(wall.material,f.material);
  assert.ok(wall.material.opacity>=.1&&wall.material.opacity<=.16);
  assert.equal(wall.material.transparent,true);assert.equal(wall.material.depthWrite,false);
  assert.equal(other.material,f.material);assert.equal(f.material.opacity,1);assert.equal(f.subject.material,f.material);
});

test('geometry behind the selected surface and geometry outside the sightline stay opaque',()=>{
  const f=fixture(),back=f.mesh(f.root,[0,2,-4],[6,5,.5]),side=f.mesh(f.root,[7,2,5]);
  assert.equal(f.visibility.update(f.camera,0),0);assert.equal(back.material,f.material);assert.equal(side.material,f.material);
});

test('overview/reset restores original material identity and disposes only ghost clones',()=>{
  const f=fixture(),wall=f.mesh(f.root,[0,2,5],[6,5,.5]);
  wall.castShadow=true;
  let originalDisposed=0,geometryDisposed=0,cloneDisposed=0;
  f.material.addEventListener('dispose',()=>originalDisposed++);wall.geometry.addEventListener('dispose',()=>geometryDisposed++);
  f.visibility.update(f.camera,0);assert.equal(wall.castShadow,false);wall.material.addEventListener('dispose',()=>cloneDisposed++);
  f.visibility.setTarget(null);
  assert.equal(wall.material,f.material);assert.equal(f.visibility.blockers.size,0);assert.equal(cloneDisposed,1);
  assert.equal(wall.castShadow,true);
  assert.equal(originalDisposed,0);assert.equal(geometryDisposed,0);assert.equal(f.visibility.update(f.camera,10),0);
  f.visibility.dispose();assert.equal(cloneDisposed,1);
});

test('hidden ancestors, invisible materials, flat foundations and beam effects do not become blockers',()=>{
  const f=fixture(),hidden=new THREE.Group();hidden.visible=false;f.root.add(hidden);
  const wall=f.mesh(hidden,[0,2,6],[6,5,.5]);
  const disabled=f.mesh(f.root,[0,2,5],[6,5,.5],f.material.clone());disabled.material.visible=false;
  const glow=f.mesh(f.root,[0,2,4],[6,5,.5],new THREE.MeshBasicMaterial({transparent:true,opacity:.8,depthWrite:false}));
  const particles=f.mesh(f.root,[0,2,3],[6,5,.5]);particles.name='nbi-neutral-particles';
  const floor=f.mesh(f.root,[0,2,2],[8,.06,8]);floor.material=f.material.clone();floor.material.name='floor';
  f.camera.position.set(0,5,10);f.camera.lookAt(0,2,0);f.camera.updateMatrixWorld();
  assert.equal(f.visibility.update(f.camera,0),0);
  for(const mesh of [wall,disabled,glow,particles,floor])assert.ok(!f.visibility.blockers.has(mesh));
});

test('all nested target meshes stay intact while an obstructing sibling coil can ghost',()=>{
  const f=fixture(),nested=new THREE.Group();f.target.add(nested);f.mesh(nested,[.3,2,1.5],[.7,1,.3]);
  const sibling=f.mesh(f.root,[0,2,5],[6,5,.5]);sibling.name='coil';
  assert.equal(f.visibility.update(f.camera,0),1);assert.ok(f.visibility.blockers.has(sibling));
  f.target.traverse(object=>{if(object.isMesh)assert.equal(object.material,f.material);});
  f.visibility.setTarget(sibling);assert.equal(sibling.material,f.material);
  assert.equal(f.visibility.update(f.camera,1),0);
});

test('actual target surfaces reject a blocker seen only through an empty group bounding-box centre',()=>{
  const f=fixture();f.target.remove(f.subject);
  f.mesh(f.target,[-3,2,0],[1,1,1]);f.mesh(f.target,[3,2,0],[1,1,1]);
  const gap=f.mesh(f.root,[0,2,5],[.7,3,.5]);
  assert.equal(f.visibility.update(f.camera,0),0);assert.equal(gap.material,f.material);
  const analysis=f.visibility.analyze(f.camera);assert.ok(analysis.sampleCount>0);assert.equal(analysis.visibleRatio,1);
});

test('an instanced foreground batch ghosts only after a real instance intersection',()=>{
  const f=fixture(),batch=new THREE.InstancedMesh(new THREE.BoxGeometry(3,5,.5),f.material,2),matrix=new THREE.Matrix4();
  batch.setMatrixAt(0,matrix.makeTranslation(0,2,5));batch.setMatrixAt(1,matrix.makeTranslation(12,2,5));f.root.add(batch);
  assert.equal(f.visibility.update(f.camera,0),1);assert.ok(f.visibility.blockers.has(batch));
  f.camera.position.set(-10,2,0);f.camera.lookAt(0,2,0);f.camera.updateMatrixWorld();
  assert.equal(f.visibility.update(f.camera,200),0);assert.equal(batch.material,f.material);
});

test('analysis is read only and an occluder is restored when it becomes hidden or the camera moves',()=>{
  const f=fixture(),wall=f.mesh(f.root,[0,2,5],[6,5,.5]);
  const before=f.visibility.analyze(f.camera);assert.equal(before.blockers.size,1);assert.equal(before.visibleRatio,0);assert.equal(wall.material,f.material);
  f.visibility.update(f.camera,0);const clone=wall.material;
  const ghostedAnalysis=f.visibility.analyze(f.camera);assert.equal(ghostedAnalysis.blockers.size,1);assert.equal(ghostedAnalysis.visibleRatio,0);
  assert.equal(wall.material,clone,'analysis uses original opacity without changing active ghosts');
  f.visibility.update(f.camera,20);assert.equal(wall.material,clone,'retain clones between bounded checks');
  wall.visible=false;assert.equal(f.visibility.update(f.camera,200),0);assert.equal(wall.material,f.material);
  wall.visible=true;f.visibility.update(f.camera,400);f.visibility.reset();
  assert.equal(wall.material,f.material);assert.equal(f.visibility.update(f.camera,600),0);
});

test('a large instance batch surrounding the camera still finds its foreground instance',()=>{
  const f=fixture(),batch=new THREE.InstancedMesh(new THREE.BoxGeometry(3,5,.5),f.material,3),matrix=new THREE.Matrix4();
  for(const [index,z] of [5,-4,20].entries())batch.setMatrixAt(index,matrix.makeTranslation(0,2,z));f.root.add(batch);
  assert.equal(f.visibility.update(f.camera,0),1);assert.ok(f.visibility.blockers.has(batch));
});

function desktopPose(part,vector){
  const box=new THREE.Box3().setFromObject(part.object),target=box.getCenter(new THREE.Vector3()),profile=inspectionView(part);
  const distance=framingDistance({min:box.min.toArray(),max:box.max.toArray()},target.toArray(),vector,40,770/610,profile.padding,330/1100);
  const direction=new THREE.Vector3(...vector),camera=new THREE.PerspectiveCamera(40,1100/610,.12,320);
  camera.position.copy(target).addScaledVector(direction,distance);
  const shift=new THREE.Vector3(0,1,0).cross(direction).normalize().multiplyScalar(distance*Math.tan(40*Math.PI/360)*camera.aspect*330/1100);
  camera.position.add(shift);target.add(shift);camera.lookAt(target);camera.updateMatrixWorld(true);return camera;
}

// Deliberately independent of the controller's sampling and original-material
// bookkeeping: test actual remaining opaque geometry over a dense screen grid.
function denseOpaqueFraction(root,target,camera){
  const targets=[],obstacles=[],raycaster=new THREE.Raycaster(),intersection=new THREE.Vector3();
  target.traverseVisible(mesh=>{if(mesh.isMesh)targets.push(mesh);});const selected=new Set(targets);
  root.traverseVisible(mesh=>{
    if(!mesh.isMesh||selected.has(mesh))return;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(!materials.some(material=>material.visible!==false&&material.opacity>=.55&&material.depthWrite!==false&&material.blending!==THREE.AdditiveBlending))return;
    const box=new THREE.Box3().setFromObject(mesh),size=box.getSize(new THREE.Vector3());
    if(materials.some(material=>/^(floor|asphalt|ground|road|pavement)(\b|[-_ ])/i.test(material.name))||/^(floor|asphalt|ground|road|pavement)(\b|[-_ ])/i.test(mesh.name)||size.y<.045||(box.max.y<=.45&&size.y<Math.max(size.x,size.z)*.09)||mesh.userData.beamPath||mesh.userData.poweredEffect||/(particle|glow|beam[-_ ]?path|luminous core)/i.test(mesh.name))return;
    obstacles.push({mesh,box});
  });
  let sampled=0,blocked=0;const missed=new Map();
  for(let y=0;y<65;y++)for(let x=0;x<85;x++){
    raycaster.setFromCamera(new THREE.Vector2(-1+2*(x+.5)/85,-1+2*(y+.5)/65),camera);raycaster.far=320;
    const surface=raycaster.intersectObjects(targets,false).find(hit=>hit.object.material.opacity>.015);if(!surface)continue;
    sampled++;raycaster.far=surface.distance-Math.max(.012,surface.distance*.0002);
    const nearby=obstacles.filter(record=>record.box.containsPoint(camera.position)||(raycaster.ray.intersectBox(record.box,intersection)&&camera.position.distanceTo(intersection)<raycaster.far)).map(record=>record.mesh);
    const hit=raycaster.intersectObjects(nearby,false)[0];if(hit){blocked++;const name=hit.object.parent.name+':'+hit.object.name;missed.set(name,(missed.get(name)||0)+1);}
  }
  return {sampled,blocked,fraction:sampled?blocked/sampled:0,missed:[...missed]};
}

test('whole-plant hollow targets remain clear under independent dense screen sampling',t=>{
  const plant=buildPlant();plant.update(8,0,{activity:1,alpha:1,generator:1,power:1,phase:'running',netMW:520,explode:0});plant.group.updateMatrixWorld(true);
  const visibility=createInspectionVisibility(plant.group);
  for(const id of ['plasma','vessel','field']){
    const part=plant.parts.find(part=>part.id===id);visibility.setTarget(part.object);
    let best,bestScore=-Infinity,analysis,bestIndex;
    for(const [index,vector] of inspectionDirections(inspectionView(part).direction).entries()){
      const camera=desktopPose(part,vector),result=visibility.analyze(camera,{quality:'preview'}),score=(result.visibleRatio-.32*(1-result.confidence))*100-result.assemblyCount*.25-index*.18;
      if(result.sampleCount&&score>bestScore){bestScore=score;best=camera;analysis=result;bestIndex=index;}
    }
    visibility.update(best,0);visibility.update(best,200);const dense=denseOpaqueFraction(plant.group,part.object,best);
    assert.ok(dense.sampled>10,`${id} independent probe must hit actual target surfaces`);
    assert.ok(dense.fraction<.08,`${id}: ${dense.blocked}/${dense.sampled} rays remain opaque blocked; controller had ${analysis.sampleCount} samples`);
    t.diagnostic(`${id}: candidate ${bestIndex}, ${analysis.sampleCount} surface rays, ${dense.blocked}/${dense.sampled} (${(dense.fraction*100).toFixed(2)}%) remaining opaque obstruction; ${JSON.stringify(dense.missed)}`);
    const priorViews={
      plasma:{position:[5.116238254023372,11.747363081170295,5.995202579687433],target:[.20020332131400354,3.05,-2.303387271833893]},
      vessel:{position:[11.188372233087925,7.749631924924214,-4.038941390550997],target:[-2.083681831806086,3.0500001311302185,-3.890164520762646]},
      field:{position:[5.628947549648826,12.599901600367318,6.451900590543899],target:[.3794601919609608,3.0499993562698364,-2.409578855491895]}
    },prior=new THREE.PerspectiveCamera(40,1100/610,.12,320);
    prior.position.fromArray(priorViews[id].position);prior.lookAt(new THREE.Vector3(...priorViews[id].target));prior.updateMatrixWorld(true);
    visibility.update(prior,400);visibility.update(prior,600);const priorDense=denseOpaqueFraction(plant.group,part.object,prior);
    assert.ok(priorDense.fraction<.08,`${id} previously failing fixed pose: ${priorDense.blocked}/${priorDense.sampled} rays remain blocked`);
    t.diagnostic(`${id} prior fixed pose: ${priorDense.blocked}/${priorDense.sampled} (${(priorDense.fraction*100).toFixed(2)}%) remaining opaque obstruction`);
  }
  visibility.dispose();
});

test('ghosted light fixtures follow live power changes between geometry checks',()=>{
  const f=fixture(),source=new THREE.MeshStandardMaterial({color:'#888888',emissive:'#ffbd69',emissiveIntensity:5});
  const lightFixture=f.mesh(f.root,[0,2,5],[6,5,.5],source);
  f.visibility.update(f.camera,0);assert.equal(lightFixture.material.emissiveIntensity,5);
  source.emissiveIntensity=0;f.visibility.update(f.camera,20);
  assert.equal(lightFixture.material.emissiveIntensity,0);
  assert.ok(lightFixture.material.opacity<.2);
  f.visibility.reset();assert.equal(lightFixture.material,source);
});

test('a foreground semantic assembly ghosts coherently while protecting selected nested subtrees',()=>{
  const f=fixture(),assembly=new THREE.Group();assembly.userData.partId='coils';f.root.add(assembly);
  const front=f.mesh(assembly,[0,2,5],[6,5,.5]),side=f.mesh(assembly,[6,2,5]);
  assert.equal(f.visibility.update(f.camera,0),2);assert.ok(f.visibility.blockers.has(front));assert.ok(f.visibility.blockers.has(side));
  f.visibility.setTarget(side);f.visibility.update(f.camera,200);
  assert.equal(side.material,f.material);assert.ok(!f.visibility.blockers.has(side));
});

test('powered halos do not count as selected physical target coverage',()=>{
  const f=fixture();f.target.remove(f.subject);
  const halo=f.mesh(f.target,[0,2,0],[4,4,.1]);halo.userData.poweredEffect='spill';
  const wall=f.mesh(f.root,[0,2,5],[6,5,.5]),analysis=f.visibility.analyze(f.camera);
  assert.equal(analysis.sampleCount,0);assert.equal(analysis.confidence,0);assert.equal(f.visibility.update(f.camera,0),0);assert.equal(wall.material,f.material);
});

test('static camera views reuse obstruction results until camera or layout invalidation changes',()=>{
  const f=fixture(),wall=f.mesh(f.root,[0,2,5],[6,5,.5]),raycast=wall.raycast;let calls=0;
  wall.raycast=function(...args){calls++;return raycast.apply(this,args);};
  f.visibility.update(f.camera,0);f.visibility.update(f.camera,200);const initial=calls;assert.ok(initial>0);
  f.visibility.update(f.camera,400);assert.equal(calls,initial,'settled inspection should not repeat triangle work');
  f.camera.position.x=.3;f.camera.lookAt(0,2,0);f.visibility.update(f.camera,600);assert.ok(calls>initial);
  wall.position.x=20;f.visibility.invalidate();assert.equal(f.visibility.update(f.camera,800),0);assert.equal(wall.material,f.material);
});

test('preview analysis has a fixed ray budget while full analysis verifies more surface coverage',()=>{
  const f=fixture();f.mesh(f.root,[0,2,5],[6,5,.5]);
  const preview=f.visibility.analyze(f.camera,{quality:'preview'}),full=f.visibility.analyze(f.camera);
  assert.ok(preview.sampleCount>0&&preview.sampleCount<=41);assert.ok(full.sampleCount>preview.sampleCount);
  assert.ok(preview.confidence<full.confidence);assert.equal(preview.blockers.size,full.blockers.size);
});
