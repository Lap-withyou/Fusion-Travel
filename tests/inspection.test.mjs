import test from 'node:test';
import assert from 'node:assert/strict';
import {highlightOpacity,inspectionView,inspectionDirections,framingDistance} from '../dist/js/inspection.js';
import * as THREE from '../dist/vendor/three.module.js';
import {buildPlant} from '../dist/js/plant.js';

test('selection emphasis produces exactly two separated pulses and then ends',()=>{
  assert.equal(highlightOpacity(-1),0);
  let pulses=0,previous=false;
  for(let t=0;t<=2400;t+=10){const active=highlightOpacity(t)>.001;if(active&&!previous)pulses++;previous=active;}
  assert.equal(pulses,2);
  assert.equal(highlightOpacity(1600),0);
  assert.equal(highlightOpacity(4000),0);
  assert.equal(highlightOpacity(200,true),highlightOpacity(1200,true));
});

test('every nearby candidate view keeps installed components inside desktop and phone inspection viewports',()=>{
  const plant=buildPlant();plant.update(8,0,{activity:1,alpha:1,generator:1,power:1,phase:'running',netMW:520,explode:0});
  for(const [width,height,panel] of [[1100,610,330],[390,520,0]])for(const part of plant.parts)for(const vector of inspectionDirections(inspectionView(part).direction)){
    const box=new THREE.Box3().setFromObject(part.object),target=box.getCenter(new THREE.Vector3());
    const profile=inspectionView(part),direction=new THREE.Vector3(...vector).normalize();
    const distance=framingDistance({min:box.min.toArray(),max:box.max.toArray()},target.toArray(),direction.toArray(),40,(width-panel)/height,profile.padding,panel/width);
    const camera=new THREE.PerspectiveCamera(40,width/height,.12,320),position=target.clone().addScaledVector(direction,distance);
    if(panel){const right=new THREE.Vector3(0,1,0).cross(direction).normalize(),shift=right.multiplyScalar(distance*Math.tan(40*Math.PI/360)*camera.aspect*panel/width);position.add(shift);target.add(shift);}
    camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld();
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const point=new THREE.Vector3(x,y,z).project(camera),screenX=(point.x+1)*width/2;
      assert.ok(screenX>0&&screenX<width-panel&&Math.abs(point.y)<1,`${part.id} clipped at ${width} × ${height}`);
    }
  }
});

test('model-specific view overrides are extensible and do not share mutable vectors',()=>{
  const part={id:'future-part',object:{userData:{inspection:{direction:[0,.4,1],padding:1.3}}}};
  assert.deepEqual(inspectionView(part),{direction:[0,.4,1],padding:1.3});
  const first=inspectionView({id:'vessel'});first.direction[0]=20;
  assert.notEqual(inspectionView({id:'vessel'}).direction[0],20);
  for(const id of ['tanks','vessel','neutral-beam','coils','lamp']){
    const view=inspectionView({id});assert.ok(view.direction.every(Number.isFinite));assert.ok(view.direction[1]>0&&view.padding>1);
  }
});
