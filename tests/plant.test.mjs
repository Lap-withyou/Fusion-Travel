import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildPlant} from '../dist/js/plant.js';
import {FLOW_ROUTES,STEP_BINDINGS} from '../dist/js/layout.js';

test('nine chapters refer to actual components of one connected plant',()=>{
  const plant=buildPlant();
  for(let id=1;id<=9;id++){
    assert.ok(STEP_BINDINGS[id]);
    const parts=plant.parts.filter(p=>p.stepIds.includes(id));
    assert.ok(parts.length>=2,`chapter ${id} needs inspectable installed parts`);
    for(const part of parts){let o=part.object;while(o&&o!==plant.group)o=o.parent;assert.equal(o,plant.group);}
  }
  assert.equal(new Set(plant.parts.map(p=>p.id)).size,plant.parts.length);
  assert.ok(FLOW_ROUTES.some(r=>r.kind==='feedback'));
  for(const state of [{activity:0,explode:0,power:0,phase:'standby'},{activity:1,explode:0,power:1,phase:'running'},{activity:1,explode:1,power:1,phase:'running'}]){
    plant.update(10,.016,state);
    const box=new THREE.Box3().setFromObject(plant.group);
    for(const n of [...box.min,...box.max])assert.ok(Number.isFinite(n));
    assert.ok(box.max.y<20&&box.min.y>=-2);
  }
});

test('alpha heating and external lights follow fusion onset and electrical output',()=>{
  const plant=buildPlant(),self=plant.parts.find(p=>p.id==='self-heating').object,load=plant.parts.find(p=>p.id==='lamp').object;
  const lights=[];load.traverse(o=>{if(o.isPointLight)lights.push(o);});
  assert.ok(lights.length>0);
  plant.update(0,.016,{activity:.5,alpha:0,generator:0,explode:0,power:1,phase:'startup',netMW:-120});
  assert.equal(self.visible,false);assert.ok(lights.every(l=>l.intensity===0));
  plant.update(10,.016,{activity:1,alpha:1,generator:1,explode:0,power:1,phase:'running',netMW:520});
  assert.equal(self.visible,true);assert.ok(lights.every(l=>l.intensity>0));
  plant.update(11,.016,{activity:1,alpha:1,generator:1,explode:0,power:1,phase:'running',netMW:0});
  assert.ok(lights.every(l=>l.intensity===0));
});

test('industrial reactor disassembly is reversible and does not accumulate transforms',()=>{
  const plant=buildPlant(),coils=plant.parts.find(p=>p.id==='coils').object;
  const positions=()=>coils.children.map(o=>o.position.toArray());
  const state={activity:1,alpha:1,generator:1,power:1,phase:'running',netMW:520};
  plant.update(4,.016,{...state,explode:0});const original=positions();
  plant.update(4,.016,{...state,explode:1});assert.notDeepEqual(positions(),original);
  plant.update(4,.016,{...state,explode:0});assert.deepEqual(positions(),original);
});
