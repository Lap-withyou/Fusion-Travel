import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildModel} from '../dist/js/models.js';
import {STEPS,CONCEPTS} from '../dist/js/steps.js';

test('all nine educational steps have inspectable, finite animated geometry',()=>{
  assert.equal(STEPS.length,9);
  for(const step of STEPS){
    assert.ok(step.summary.length>=2&&step.summary.length<=3);
    const model=buildModel(step.id);
    assert.ok(model.group.isGroup);
    assert.ok(model.parts.length>=2);
    for(const part of model.parts){
      assert.ok(part.id&&part.label&&part.description);
      let object=part.object;
      while(object&&object!==model.group)object=object.parent;
      assert.equal(object,model.group,`${step.id}/${part.id} must belong to its station`);
      assert.ok(step.partNotes[part.id],`${step.id}/${part.id} needs grounded copy`);
    }
    for(const t of [0,.1,1,2,5,10,31]){
      model.update(t,.016);
      const box=new THREE.Box3().setFromObject(model.group);
      for(const n of [...box.min,...box.max])assert.ok(Number.isFinite(n));
      assert.ok(box.max.y<3.3&&box.min.y>-.3,`station ${step.id} must fit its stage`);
    }
  }
});
test('each scientific concept has a distinct visual key',()=>{
  for(const id of ['fuel','plasma','magnetic','heat','neutron','current','steam'])assert.ok(CONCEPTS.some(c=>c.id===id));
  assert.equal(new Set(CONCEPTS.map(c=>c.color)).size,7);
});
