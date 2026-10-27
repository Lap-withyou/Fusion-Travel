import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {buildPlant} from '../dist/js/plant.js';
import {FLOW_ROUTES,PLANT_LAYOUT,STEP_BINDINGS} from '../dist/js/layout.js';
import * as siteLayout from '../dist/js/site-layout.js';

function installedSite(){
  const plant=buildPlant();plant.group.updateMatrixWorld(true);
  const store=plant.parts.find(part=>part.id==='lamp').object;
  const solids=[];
  store.traverse(object=>{
    if(object.isMesh&&!object.userData.poweredEffect)solids.push({name:object.name,bounds:new THREE.Box3().setFromObject(object)});
  });
  const roadMesh=plant.group.getObjectByName('asphalt box');
  return {plant,store,solids,road:new THREE.Box3().setFromObject(roadMesh)};
}

const overlapXZ=(a,b)=>a.min.x<b.max.x&&a.max.x>b.min.x&&a.min.z<b.max.z&&a.max.z>b.min.z;

test('the shop, apron, kerb and streetlight hardware leave the straight road clear',()=>{
  const {solids,road}=installedSite();
  assert.ok(Math.abs(road.min.z-12)<1e-5&&Math.abs(road.max.z-14.4)<1e-5,'the through road retains its continuous 2.4 metre width');
  assert.ok(Math.abs(road.min.x+17.75)<1e-5&&Math.abs(road.max.x-19.75)<1e-5,'the road remains a single straight strip');
  for(const {name,bounds}of solids)assert.equal(overlapXZ(bounds,road),false,`${name} occupies the carriageway`);
  assert.deepEqual(STEP_BINDINGS[9].target,[PLANT_LAYOUT.city[0],1.4,PLANT_LAYOUT.city[2]],'the chapter view follows the installed shop');
});

test('the complete outgoing cable and its moving markers clear the shop solids',()=>{
  const {solids}=installedSite(),route=FLOW_ROUTES.find(route=>route.id==='grid-output');
  for(let segment=1;segment<route.points.length;segment++){
    const start=new THREE.Vector3(...route.points[segment-1]),end=new THREE.Vector3(...route.points[segment]);
    const samples=Math.ceil(start.distanceTo(end)/.015);
    for(let n=0;n<=samples;n++)for(const lift of [0,route.radius*1.25]){
      const point=start.clone().lerp(end,n/samples);point.y+=lift;
      const swept=new THREE.Sphere(point,route.radius);
      for(const {name,bounds}of solids)assert.equal(bounds.intersectsSphere(swept),false,`cable segment ${segment} crosses ${name}`);
    }
  }
});

test('the animated electricity tracer follows the installed straight cable at every bend',()=>{
  assert.equal(typeof siteLayout.createFlowCurve,'function','the scene and physical cable must share one route builder');
  const route=FLOW_ROUTES.find(route=>route.id==='grid-output'),lift=route.radius*1.25;
  const curve=siteLayout.createFlowCurve(route,{lift});
  const segments=route.points.slice(1).map((point,index)=>new THREE.Line3(
    new THREE.Vector3(...route.points[index]).add(new THREE.Vector3(0,lift,0)),
    new THREE.Vector3(...point).add(new THREE.Vector3(0,lift,0)),
  ));
  const {solids}=installedSite();
  for(let n=0;n<=1000;n++){
    const point=curve.getPointAt(n/1000),distance=Math.min(...segments.map(segment=>segment.closestPointToPoint(point,true,new THREE.Vector3()).distanceTo(point)));
    assert.ok(distance<1e-7,'the tracer must not round a corner into the store or float away from its cable');
    for(const {name,bounds}of solids)assert.equal(bounds.intersectsSphere(new THREE.Sphere(point,route.radius)),false,`animated electricity crosses ${name}`);
  }
  assert.deepEqual(curve.getPointAt(1).toArray(),siteLayout.STORE_SERVICE.incomingPort.map((value,index)=>value+(index===1?lift:0)));
  assert.equal(FLOW_ROUTES.length,12,'the complete plant retains all twelve teaching routes');
});

test('net power terminates at the exterior cabinet and a short service enters only at the side wall',()=>{
  const {plant,solids,road}=installedSite(),line=plant.parts.find(part=>part.id==='electric-line').object;
  const cabinet=line.getObjectByName('Exterior shop service cabinet');
  assert.ok(cabinet,'the feeder needs a real exterior receiving cabinet');
  const bounds=new THREE.Box3().setFromObject(cabinet);
  const body=new THREE.Box3();
  for(const solid of solids.filter(solid=>/stucco wall|structural column|shopfront glass|entrance door/i.test(solid.name)))body.union(solid.bounds);
  assert.equal(bounds.intersectsBox(body),false,'the service cabinet must not occupy the shop or its stocked interior');
  assert.equal(overlapXZ(bounds,road),false,'the cabinet must not obstruct the road');
  const incoming=new THREE.Vector3(...siteLayout.STORE_SERVICE.incomingPort);
  assert.ok(Math.abs(incoming.z-bounds.min.z)<1e-5,'the grid feeder lands on the receiving face of the cabinet');
  assert.ok(incoming.x>bounds.min.x&&incoming.x<bounds.max.x&&incoming.y>bounds.min.y&&incoming.y<bounds.max.y);
  const route=FLOW_ROUTES.find(route=>route.id==='grid-output');
  assert.deepEqual(route.points.at(-1),incoming.toArray());
  const [start,end]=siteLayout.STORE_SERVICE.connection;
  assert.ok(Math.abs(start[0]-bounds.min.x)<1e-5,'the service branch starts on the west cabinet face');
  const sideWallX=Math.max(...solids.filter(solid=>solid.name==='Side stucco wall').map(solid=>solid.bounds.max.x));
  assert.ok(Math.abs(end[0]-sideWallX)<1e-5,'only the service termination touches the external side wall');
  assert.ok(Math.abs(end[2]-start[2])<1e-8&&Math.abs(end[1]-start[1])<1e-8,'the service does not turn or traverse the shop interior');
});
