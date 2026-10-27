import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {fitDistance} from '../dist/js/camera-fit.js';
import {buildModel} from '../dist/js/models.js';

test('every part fits both horizontal and vertical field of view, including portrait',()=>{
  for(const aspect of [.55,.7,1,1.8]) for(let id=1;id<=9;id++){
    const model=buildModel(id);model.update(2,.016);
    for(const part of model.parts){
      const bounds=new THREE.Box3().setFromObject(part.object),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      const distance=fitDistance(size.toArray(),aspect,40);
      const camera=new THREE.PerspectiveCamera(40,aspect,.1,220);
      camera.position.copy(center).add(new THREE.Vector3(5,3.9,7).normalize().multiplyScalar(distance));camera.lookAt(center);camera.updateMatrixWorld();
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=new THREE.Vector3(x,y,z).project(camera);
        assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95,`${id}/${part.id} clipped at aspect ${aspect}`);
      }
    }
  }
});
