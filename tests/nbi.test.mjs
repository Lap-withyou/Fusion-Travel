import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildReactor} from '../dist/js/reactor.js';

test('the heating injector exposes the physical stages in the same reactor and tangential neutral path',()=>{
  const model=buildReactor();
  const main=model.parts.find(p=>p.id==='neutral-beam');
  for(const id of ['beam-source','beam-neutralizer','beam-ion-dump','beam-calorimeter','beam-duct']){
    const part=model.parts.find(p=>p.id===id);
    assert.ok(part,`${id} must be independently inspectable`);
    assert.deepEqual(part.stepIds,[3]);
    assert.ok(part.object.userData.inspection.direction);
    let node=part.object;
    while(node&&node!==main.object)node=node.parent;
    assert.equal(node,main.object);
  }
  const neutral=model.group.getObjectByName('nbi-neutral-axis');
  assert.ok(neutral,'the neutral trajectory must be visible');
  const curve=neutral.geometry.parameters.path;
  const start=curve.getPoint(0),end=curve.getPoint(1);
  for(let t=0;t<=1;t+=.05){
    const point=curve.getPoint(t);
    assert.ok(Math.abs(point.y-start.y)<1e-8);
    assert.ok(Math.abs(point.z-start.z)<1e-8,'neutral atoms must never bend');
  }
  assert.ok(end.x>start.x);
  assert.ok(Math.abs(start.z)>2.5&&Math.abs(start.z)<2.8,'impact parameter must be tangential to plasma major radius');
  for(const charge of ['positive','negative']){
    const ion=model.group.getObjectByName(`nbi-${charge}-ion-dump-path`);
    assert.ok(ion);
    const path=ion.geometry.parameters.path;
    assert.ok(Math.abs(path.getPoint(1).z-path.getPoint(0).z)>.15,'only residual ions bend into the bounding dump plates');
    assert.ok(Math.abs(path.getPoint(1).z-path.getPoint(0).z)<.22,'ions must hit their channel wall without crossing another solid panel');
  }
});

test('the diagnostic calorimeter intercepts the beam and injection remains deterministic',()=>{
  const model=buildReactor();
  model.update(2,.016,{phase:'startup',activity:1,nbiDiagnostic:false});
  const downstream=model.group.getObjectByName('nbi-to-plasma');
  const left=model.group.getObjectByName('nbi-calorimeter-leaf-positive');
  const particles=model.group.getObjectByName('nbi-neutral-particles');
  assert.ok(downstream&&left&&particles);
  assert.ok(downstream.visible);
  const first=Array.from(particles.instanceMatrix.array);
  model.update(2,0,{phase:'startup',activity:1,nbiDiagnostic:false});
  assert.deepEqual(Array.from(particles.instanceMatrix.array),first,'fixed simulation time must freeze particles');
  assert.equal(left.rotation.y,0,'the calorimeter leaves are parallel to the open beam');
  model.update(2,.016,{phase:'startup',activity:1,nbiDiagnostic:true});
  assert.equal(downstream.visible,false,'no beam reaches the tokamak while the diagnostic dump is closed');
  assert.ok(Math.abs(left.rotation.y)>.4);
  model.update(-999,0,{phase:'standby',activity:0,nbiDiagnostic:false});
  assert.equal(downstream.visible,false);
  const bounds=new THREE.Box3().setFromObject(model.group);
  for(const value of [...bounds.min,...bounds.max])assert.ok(Number.isFinite(value));
});

test('the neutral axis and all particle offsets clear actual channel separator geometry',()=>{
  const model=buildReactor();
  const matrix=new THREE.Matrix4();
  for(const name of ['nbi-neutralizer-separator-walls','nbi-rid-panels']){
    const walls=model.group.getObjectByName(name);
    assert.ok(walls?.isInstancedMesh);
    const main=model.group.getObjectByName('nbi-neutral-axis').geometry.parameters.path;
    for(let i=0;i<walls.count;i++){
      walls.getMatrixAt(i,matrix);
      const bounds=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(matrix);
      for(let t=0;t<=1;t+=.025){
        const p=main.getPoint(t);
        // Neutrals occupy a narrow bundle with max transverse offset .092,
        // max vertical offset .075 and particle radius .025.
        const particleEnvelope=new THREE.Box3(new THREE.Vector3(p.x-.025,p.y-.1,p.z-.117),new THREE.Vector3(p.x+.025,p.y+.1,p.z+.117));
        assert.equal(bounds.intersectsBox(particleEnvelope),false,`${name}/${i} obstructs the neutral channel`);
      }
    }
  }
  const positive=model.group.getObjectByName('nbi-positive-ion-dump-path').geometry.parameters.path.getPoint(1);
  const patch=model.group.getObjectByName('nbi-positive-ion-interception-patch');
  const surface=patch.position.z-patch.scale.z/2;
  assert.ok(Math.abs(positive.z-surface)<1e-7,'positive ions must terminate at their physical plate surface');
});
