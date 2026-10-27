import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlant} from '../dist/js/plant.js';
import {buildConvenienceStore} from '../dist/js/store.js';
import * as THREE from '../dist/vendor/three.module.js';

const powered={activity:1,generator:1,power:1,phase:'running',netMW:520};
const descendants=(object,predicate)=>{const result=[];object.traverse(child=>{if(predicate(child))result.push(child);});return result;};

test('the endpoint is a glass convenience store with stocked shelves and branded fascia',()=>{
  const plant=buildPlant(),store=plant.parts.find(part=>part.id==='lamp').object;
  assert.equal(store.userData.endpointType,'convenience-store');
  assert.ok(descendants(store,object=>object.userData.storeFeature==='glass-facade').length>0);
  assert.ok(descendants(store,object=>object.userData.storeFeature==='stocked-shelf').length>=3);
  assert.ok(descendants(store,object=>object.userData.storeFeature==='checkout-counter').length>0);
  assert.ok(descendants(store,object=>object.userData.storeFeature==='brand-fascia').length>=3);
  assert.ok(descendants(store,object=>object.userData.storeFeature==='ceiling-lamp').length>=4);
});

test('positive delivered power produces obvious warm lamps, interior spill and street pools',()=>{
  const plant=buildPlant(),store=plant.parts.find(part=>part.id==='lamp').object;
  plant.update(10,.016,powered);
  const lights=descendants(store,object=>object.isPointLight);
  const effects=descendants(store,object=>object.userData.poweredEffect);
  const fixtures=descendants(store,object=>object.userData.warmFixture);
  assert.ok(lights.length>=4);
  assert.ok(lights.every(light=>light.intensity>=8));
  assert.ok(lights.every(light=>light.color.r>light.color.b));
  assert.ok(effects.some(effect=>effect.userData.poweredEffect==='street-pool'));
  assert.ok(effects.some(effect=>effect.userData.poweredEffect==='interior-spill'));
  assert.ok(effects.every(effect=>effect.visible&&effect.material.opacity>0));
  assert.ok(fixtures.length>=6);
  assert.ok(fixtures.every(fixture=>fixture.material.emissiveIntensity>=3));
});

test('startup, a net deficit and a stopped generator extinguish all powered store effects',()=>{
  const plant=buildPlant(),store=plant.parts.find(part=>part.id==='lamp').object;
  for(const state of [
    {...powered,phase:'startup',generator:0,netMW:-120},
    {...powered,netMW:0},
    {...powered,netMW:-40},
    {...powered,generator:0},
    {activity:1,power:1,phase:'startup'},
  ]){
    plant.update(12,.016,powered);plant.update(12,.016,state);
    assert.ok(descendants(store,object=>object.isPointLight).every(light=>light.intensity===0));
    assert.ok(descendants(store,object=>object.userData.poweredEffect).every(effect=>effect.visible===false));
    assert.ok(descendants(store,object=>object.userData.warmFixture).every(fixture=>fixture.material.emissiveIntensity===0));
  }
});

test('store lighting is deterministic when the same paused frame is evaluated repeatedly',()=>{
  const plant=buildPlant(),store=plant.parts.find(part=>part.id==='lamp').object;
  const capture=()=>descendants(store,object=>object.isPointLight||object.userData.poweredEffect).map(object=>[object.visible,object.intensity??object.material.opacity]);
  plant.update(4,0,powered);const first=capture();
  plant.update(4,0,powered);assert.deepEqual(capture(),first);
});

test('every solid store feature stays on the promenade and clears the front road',()=>{
  const {group}=buildConvenienceStore();group.updateMatrixWorld(true);
  const solids=descendants(group,object=>object.isMesh&&!object.userData.poweredEffect);
  for(const solid of solids){
    const bounds=new THREE.Box3().setFromObject(solid);
    assert.ok(bounds.max.z<=2.4+1e-6,`${solid.name} extends onto the road approach at z=${bounds.max.z}`);
  }
  const pavement=group.getObjectByName('Raised pavement and shop threshold');
  assert.ok(new THREE.Box3().setFromObject(pavement).max.z>=2.39,'the floor signature needs a complete pavement beneath it');
  assert.equal(group.userData.physicalFootprint.roadStartsZ,2.5);
  assert.ok(group.userData.physicalFootprint.roadClearance>=.1-1e-6);
});

test('the exact designer signature is integrated into the floor and reads from the front approach',()=>{
  const {group}=buildConvenienceStore();group.updateMatrixWorld(true);
  const signature=descendants(group,object=>object.userData.storeFeature==='floor-signature')[0];
  assert.ok(signature,'the storefront has an artistic floor signature');
  assert.equal(signature.userData.text,'Designed by LAP');
  assert.equal(signature.userData.artwork,'offline-canvas-calligraphy');
  const bounds=new THREE.Box3().setFromObject(signature);
  assert.ok(bounds.min.z>1.49,'the signature sits just outside the glass doors');
  assert.ok(bounds.max.z<2.4,'the signature clears the front kerb');
  assert.ok(bounds.max.y<.21,'the artwork stays flush to the promenade');
  const normal=new THREE.Vector3(0,0,1).transformDirection(signature.matrixWorld);
  assert.ok(normal.y>.999,'the artwork faces up as a floor marking');
  const top=new THREE.Vector3(0,.5,0).applyMatrix4(signature.matrixWorld);
  const bottom=new THREE.Vector3(0,-.5,0).applyMatrix4(signature.matrixWorld);
  assert.ok(top.z<bottom.z,'the top of the lettering points toward the shop for a viewer arriving from +z');
  const bollards=descendants(group,object=>object.name==='Entrance safety bollard');
  for(const bollard of bollards){
    const bollardBounds=new THREE.Box3().setFromObject(bollard);
    assert.ok(bollardBounds.max.x<bounds.min.x||bollardBounds.min.x>bounds.max.x,'bollards leave the complete signature visible');
  }
});

test('the offline floor signature safely builds without a browser canvas',()=>{
  assert.equal(typeof document,'undefined');
  const {group}=buildConvenienceStore();
  const signature=descendants(group,object=>object.userData.storeFeature==='floor-signature')[0];
  assert.ok(signature,'headless scene construction preserves signature geometry and metadata');
  assert.equal(signature.material.map,null);
  assert.deepEqual(signature.userData.physicalBounds,{minX:-2.1,maxX:2.1,minZ:1.52,maxZ:2.24});
});
