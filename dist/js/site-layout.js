import * as THREE from '../vendor/three.module.js';

// Shared world coordinates keep the visible road, shop and electrical ports
// aligned. The shop's whole physical apron stays behind the road's north edge.
const roadPosition=[1,.04,13.2],roadSize=[37.5,.035,2.4];
export const SITE_ROAD={position:roadPosition,size:roadSize,minZ:roadPosition[2]-roadSize[2]/2,maxZ:roadPosition[2]+roadSize[2]/2};
export const STORE_SITE={position:[15,0,9.5]};

// A separate cabinet receives the plant feeder outside the east wall. Only
// the short, low service connection terminates at the shop's wall entry.
const servicePosition=[STORE_SITE.position[0]+3.95,0,STORE_SITE.position[2]-1.25];
const cabinet={center:[0,1.23,0],size:[.95,2.1,.4]};
const shopPort=[STORE_SITE.position[0]+2.98,.62,servicePosition[2]];
export const STORE_SERVICE={
  position:servicePosition,cabinet,
  incomingPort:[servicePosition[0],2,servicePosition[2]-cabinet.size[2]/2],
  shopPort,
  connection:[[servicePosition[0]-cabinet.size[0]/2,shopPort[1],servicePosition[2]],shopPort],
};
export const GRID_OUTPUT_POINTS=[[16,2,3],[STORE_SERVICE.incomingPort[0],2,3],STORE_SERVICE.incomingPort];

// Cable elbows are built from straight pipe segments. Their tracer must use
// the same segments: a smoothed spline can cut through walls at a safe bend.
export function createFlowCurve(route,{lift=0}={}){
  const points=route.points.map(([x,y,z])=>new THREE.Vector3(x,y+lift,z));
  if(route.path!=='polyline')return new THREE.CatmullRomCurve3(points,false,'centripetal');
  const curve=new THREE.CurvePath();
  for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(points[i-1],points[i]));
  return curve;
}
