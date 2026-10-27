import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {frameDelta,loopPhase} from '../dist/js/animation.js';

test('a first frame timestamp earlier than setup cannot send particles outside their curve',()=>{
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(2,1,0)]);
  let time=0,previous=100;
  for(const now of [95,101,110,11000]){
    const dt=frameDelta(now,previous);previous=now;time+=dt;
    assert.ok(dt>=0&&dt<=.05);
    assert.doesNotThrow(()=>curve.getPoint(loopPhase(time,.18,0)));
  }
  for(const t of [-100,-.001,0,1e7]){
    const phase=loopPhase(t,.18,.2);assert.ok(phase>=0&&phase<1);
    assert.ok(Number.isFinite(curve.getPoint(phase).x));
  }
});
