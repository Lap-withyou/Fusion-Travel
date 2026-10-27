// View directions point from the subject towards the camera. Keep teaching
// viewpoints independent of model builders so new parts can add a profile.
const DEFAULT_VIEW={direction:[1,.65,1.5],padding:1.18};
const VIEWS={
  tanks:{direction:[-1.5,.95,.45],padding:1.22},
  injection:{direction:[-1.2,1.1,.55],padding:1.25},
  vessel:{direction:[1.6,.65,.9],padding:1.17},
  vacuum:{direction:[1.5,.8,1],padding:1.24},
  plasma:{direction:[1.6,.65,.9],padding:1.23},
  coils:{direction:[1.4,.75,1],padding:1.18},
  field:{direction:[1.6,.8,.9],padding:1.2},
  'neutral-beam':{direction:[-.3,.8,1.65],padding:1.2},
  'rf-antenna':{direction:[.9,.6,1.35],padding:1.25},
  'power-supplies':{direction:[-.8,.65,1.5],padding:1.22},
  cryogenics:{direction:[-.6,.65,1.4],padding:1.25},
  exchanger:{direction:[1,.65,-1.4],padding:1.22},
  coolant:{direction:[1,.7,-1.4],padding:1.22},
  lamp:{direction:[.25,.42,1.65],padding:1.2},
  'store-interior':{direction:[.15,.26,1.7],padding:1.3},
  'street-light':{direction:[.45,.5,1.5],padding:1.25}
};
export function inspectionView(part){
  const custom=part?.object?.userData?.inspection;
  const profile=custom||VIEWS[part?.id]||(part?.id?.startsWith('nbi-')?VIEWS['neutral-beam']:DEFAULT_VIEW);
  return {direction:[...profile.direction],padding:profile.padding??1.2};
}

// Compare nearby front-facing directions before entering a system. Higher and
// slightly rotated views clear neighbouring roofs without reversing the lesson.
export function inspectionDirections(preferred){
  const normal=v=>{const length=Math.hypot(...v);return v.map(n=>n/length);};
  const base=normal(preferred),raised=normal([base[0],Math.max(.85,base[1]*1.75),base[2]]);
  const rotate=(vector,angle)=>normal([vector[0]*Math.cos(angle)-vector[2]*Math.sin(angle),vector[1],vector[0]*Math.sin(angle)+vector[2]*Math.cos(angle)]);
  return [base,raised,rotate(base,Math.PI/6),rotate(base,-Math.PI/6),rotate(raised,Math.PI/6),rotate(raised,-Math.PI/6)];
}

export function framingDistance(bounds,target,direction,fov,aspect,padding=1.18,panelFraction=0){
  const length=Math.hypot(...direction),d=direction.map(v=>v/length);
  const horizontal=Math.hypot(d[0],d[2]),r=[d[2]/horizontal,0,-d[0]/horizontal];
  const u=[d[1]*r[2],d[2]*r[0]-d[0]*r[2],-d[1]*r[0]];
  const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
  const vertical=Math.tan(fov*Math.PI/360),h=vertical*aspect,fullH=h/(1-panelFraction);
  let distance=1.35;
  for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]]){
    const p=[x-target[0],y-target[1],z-target[2]];
    const depth=dot(p,d),horizontal=dot(p,r)-fullH*panelFraction*depth;
    distance=Math.max(distance,depth+Math.max(Math.abs(horizontal)*padding/h,Math.abs(dot(p,u))*padding/vertical));
  }
  return distance;
}

// Two slow, smooth emphasis pulses. Uses wall time, independent of plant pause.
// A quiet outline replaces the pulses when reduced motion is requested.
export function highlightOpacity(elapsed,reduced=false){
  if(elapsed<0)return 0;
  if(reduced)return elapsed<1800?.13:0;
  const cycle=800;
  if(elapsed>=cycle*2)return 0;
  const phase=(elapsed%cycle)/cycle;
  return phase<.72?Math.sin(Math.PI*phase/.72)*.34:0;
}
