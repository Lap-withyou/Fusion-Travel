import * as THREE from '../vendor/three.module.js';

const CHECK_INTERVAL=180;
const GHOST_OPACITY=.13;
const GRID_COLUMNS=13,GRID_ROWS=11,SURFACE_BUDGET=112;
const FLOOR_NAMES=/^(?:floor|asphalt|ground|road|pavement)(?:\b|[-_ ])/i;
const EFFECT_NAMES=/(?:particle|glow|beam[-_ ]?path|luminous core)/i;

const materialList=material=>Array.isArray(material)?material:[material];
const drawn=material=>material&&material.visible!==false&&material.opacity>.015;
const solid=material=>drawn(material)&&material.opacity>=.55&&material.depthWrite!==false&&material.blending!==THREE.AdditiveBlending;
const effect=mesh=>mesh.userData.beamPath||mesh.userData.poweredEffect||EFFECT_NAMES.test(mesh.name);

function isVisible(object){
  for(let node=object;node;node=node.parent)if(!node.visible)return false;
  return true;
}

function meshBounds(mesh){
  if(mesh.isInstancedMesh){
    if(!mesh.boundingBox)mesh.computeBoundingBox();
    return mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
  }
  if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
}

function isFloor(mesh,box,materials){
  const size=box.getSize(new THREE.Vector3());
  if(materials.some(material=>FLOOR_NAMES.test(material?.name||''))||FLOOR_NAMES.test(mesh.name))return true;
  // Ground/foundation slabs have no useful vertical silhouette. Elevated roofs
  // and the site's mixed structural instance batches remain valid occluders.
  return size.y<.045||(box.max.y<=.45&&size.y<Math.max(size.x,size.z)*.09);
}

// Rays end at a real selected triangle, rather than at the often empty centre
// of a torus or group. This prevents unrelated buildings behind a cutaway from
// becoming transparent just because they overlap its enclosing box.
export function createInspectionVisibility(root){
  const active=new Map(),raycaster=new THREE.Raycaster();
  const surfaceCache=new WeakMap(),chunkCache=new WeakMap(),probe=new THREE.Mesh();
  const origin=new THREE.Vector3(),direction=new THREE.Vector3(),intersection=new THREE.Vector3();
  const blockers=new Set();
  let target=null,lastCheck=-Infinity,disposed=false,layoutRevision=0,lastPose=null,lastAnalysisPose=null,lastQuality=null,poseChangedAt=-Infinity;

  const originalMaterial=mesh=>active.get(mesh)?.original??mesh.material;
  function restore(mesh){
    const record=active.get(mesh);if(!record)return;
    mesh.material=record.original;
    mesh.castShadow=record.castShadow;
    for(const material of record.clones)material.dispose();
    active.delete(mesh);
  }
  function clear(){
    for(const mesh of active.keys())restore(mesh);
    blockers.clear();lastCheck=-Infinity;lastPose=null;lastAnalysisPose=null;lastQuality=null;
  }
  function setTarget(object){
    if(disposed||object===target)return;
    clear();target=object||null;
  }
  function reset(){clear();target=null;}
  function invalidate(){layoutRevision++;}

  function collect(){
    const targets=[],obstacles=[],targetMeshes=new Set();
    if(!target||!isVisible(target))return {targets,obstacles};
    target.traverseVisible(object=>{if(object.isMesh)targetMeshes.add(object);});
    root.updateWorldMatrix(true,true);
    root.traverseVisible(mesh=>{
      if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
      const materials=materialList(originalMaterial(mesh));
      if(!materials.some(drawn))return;
      const box=meshBounds(mesh);if(box.isEmpty())return;
      if(targetMeshes.has(mesh)){if(!effect(mesh))targets.push({mesh,box});return;}
      if(!materials.some(solid)||effect(mesh)||isFloor(mesh,box,materials))return;
      obstacles.push({mesh,box});
    });
    return {targets,obstacles};
  }

  function hitMaterial(hit){
    const material=originalMaterial(hit.object);
    return Array.isArray(material)?material[hit.face?.materialIndex??0]:material;
  }
  function nearby(records,far){
    const meshes=[];
    for(const {mesh,box} of records){
      if(!mesh.layers.test(raycaster.layers))continue;
      if(box.containsPoint(origin)||(raycaster.ray.intersectBox(box,intersection)&&origin.distanceToSquared(intersection)<=far*far))meshes.push(mesh);
    }
    return meshes;
  }

  function surfacePoints(geometry){
    if(surfaceCache.has(geometry))return surfaceCache.get(geometry);
    const positions=geometry.attributes.position,index=geometry.index;
    const triangleCount=Math.floor((index?index.count:positions.count)/3),points=[],vertex=new THREE.Vector3();
    // A low-discrepancy traversal avoids repeatedly selecting the same angular
    // meridian in regularly indexed tori, cylinders and field-line tubes.
    for(let i=0;i<SURFACE_BUDGET;i++){
      if(!triangleCount)break;
      const offset=Math.min(triangleCount-1,Math.floor(((i*.61803398875+.271828)%1)*triangleCount))*3,point=new THREE.Vector3();
      for(let j=0;j<3;j++)point.add(vertex.fromBufferAttribute(positions,index?index.getX(offset+j):offset+j));
      points.push(point.multiplyScalar(1/3));
    }
    surfaceCache.set(geometry,points);return points;
  }

  function chunksFor(geometry){
    if(chunkCache.has(geometry))return chunkCache.get(geometry);
    const positions=geometry.attributes.position,index=geometry.index,start=geometry.drawRange.start;
    const end=Math.min(index?index.count:positions.count,start+geometry.drawRange.count),chunks=[];
    if(end-start<=384){chunkCache.set(geometry,null);return null;}
    // Keep real triangles, shared read-only vertex data, and small local bounds.
    // Three's standard Raycaster then visits only the short intersecting spans
    // of a thin field-line tube, rather than every triangle around its torus.
    const vertex=new THREE.Vector3();
    for(let offset=start;offset<end;offset+=288){
      const count=Math.min(288,end-offset),indices=[],box=new THREE.Box3();
      for(let i=0;i<count;i++){
        const vertexIndex=index?index.getX(offset+i):offset+i;indices.push(vertexIndex);
        box.expandByPoint(vertex.fromBufferAttribute(positions,vertexIndex));
      }
      const part=new THREE.BufferGeometry();part.setAttribute('position',positions);part.setIndex(indices);
      part.boundingBox=box;part.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
      chunks.push({geometry:part,box,offset});
    }
    chunkCache.set(geometry,chunks);return chunks;
  }

  function intersectMeshes(meshes,cache){
    const hits=[];
    for(const mesh of meshes){
      const chunks=!mesh.isInstancedMesh&&!Array.isArray(mesh.material)&&mesh.raycast===THREE.Mesh.prototype.raycast?chunksFor(mesh.geometry):null;
      if(!chunks){raycaster.intersectObject(mesh,false,hits);continue;}
      let world=cache.get(mesh);
      if(!world){world=chunks.map(chunk=>({...chunk,box:chunk.box.clone().applyMatrix4(mesh.matrixWorld)}));cache.set(mesh,world);}
      probe.matrixWorld.copy(mesh.matrixWorld);probe.material=originalMaterial(mesh);
      for(const chunk of world){
        if(!chunk.box.containsPoint(origin)&&(!raycaster.ray.intersectBox(chunk.box,intersection)||origin.distanceToSquared(intersection)>raycaster.far*raycaster.far))continue;
        probe.geometry=chunk.geometry;const found=[];probe.raycast(raycaster,found);
        for(const hit of found){hit.object=mesh;hit.faceIndex+=chunk.offset/3;hits.push(hit);}
      }
    }
    return hits.sort((a,b)=>a.distance-b.distance);
  }

  function expandAssemblies(found,obstacles){
    const ancestors=new Set();for(let node=target;node;node=node.parent)ancestors.add(node);
    const assemblies=new Set();
    for(const mesh of found){
      let fallback=mesh,assembly=null;
      for(let node=mesh;node&&!ancestors.has(node);node=node.parent){
        fallback=node;
        if(node.userData.partId){assembly=node;break;}
      }
      assemblies.add(assembly||fallback);
    }
    const expanded=new Set();
    for(const {mesh} of obstacles)for(let node=mesh;node&&!ancestors.has(node);node=node.parent){
      if(assemblies.has(node)){expanded.add(mesh);break;}
    }
    return {blockers:expanded,assemblyCount:assemblies.size};
  }

  function analyze(camera,{quality='full'}={}){
    const found=new Set();
    if(disposed||!target||!camera)return {blockers:found,visibleRatio:1,sampleCount:0,confidence:0,coverage:0,assemblyCount:0};
    const {targets,obstacles}=collect();
    if(!targets.length)return {blockers:found,visibleRatio:1,sampleCount:0,confidence:0,coverage:0,assemblyCount:0};
    camera.updateWorldMatrix(true,false);camera.getWorldPosition(origin);raycaster.layers.mask=camera.layers.mask;
    const bounds=new THREE.Box3(),projected=new THREE.Vector3();
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const record of targets){
      bounds.union(record.box);
      let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
      for(const x of [record.box.min.x,record.box.max.x])for(const y of [record.box.min.y,record.box.max.y])for(const z of [record.box.min.z,record.box.max.z]){
        projected.set(x,y,z).project(camera);
        if(projected.z<-1||projected.z>1)continue;
        left=Math.min(left,projected.x);right=Math.max(right,projected.x);bottom=Math.min(bottom,projected.y);top=Math.max(top,projected.y);
      }
      record.area=Math.max(0,Math.min(1,right)-Math.max(-1,left))*Math.max(0,Math.min(1,top)-Math.max(-1,bottom));
      minX=Math.min(minX,left);maxX=Math.max(maxX,right);minY=Math.min(minY,bottom);maxY=Math.max(maxY,top);
    }
    const rays=[],preview=quality==='preview',columns=preview?3:GRID_COLUMNS,rows=preview?3:GRID_ROWS;
    minX=Math.max(-.98,minX);maxX=Math.min(.98,maxX);minY=Math.max(-.98,minY);maxY=Math.min(.98,maxY);
    if(minX<=maxX&&minY<=maxY)for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      raycaster.setFromCamera(new THREE.Vector2(THREE.MathUtils.lerp(minX,maxX,(x+.5)/columns),THREE.MathUtils.lerp(minY,maxY,(y+.5)/rows)),camera);
      rays.push(raycaster.ray.direction.clone());
    }
    // Every target mesh gets surface coverage. Remaining samples follow its
    // projected area, rather than discarding all but eight large submeshes.
    const totalArea=targets.reduce((sum,record)=>sum+record.area,0),matrix=new THREE.Matrix4(),point=new THREE.Vector3();
    const samples=preview?Array.from({length:32},(_,i)=>{
      let threshold=((i*.61803398875+.5)%1)*(totalArea||targets.length),record=targets[targets.length-1];
      for(const candidate of targets){threshold-=totalArea?candidate.area:1;if(threshold<=0){record=candidate;break;}}
      return {...record,seed:i,count:1};
    }):targets;
    for(const {mesh,box,area,seed=0,count:fixedCount} of samples){
      if(!preview)rays.push(box.getCenter(new THREE.Vector3()).sub(origin).normalize());
      const points=surfacePoints(mesh.geometry),count=fixedCount??Math.max(2,Math.ceil(SURFACE_BUDGET*(totalArea?area/totalArea:1/targets.length)));
      for(let i=0;i<count&&points.length;i++){
        point.copy(points[(i+seed)%points.length]);
        if(mesh.isInstancedMesh){
          // Traverse the complete physical assembly, not one middle instance.
          const instance=Math.min(mesh.count-1,Math.floor((((i+seed)*.754877666+.5)%1)*mesh.count));
          mesh.getMatrixAt(instance,matrix);point.applyMatrix4(matrix);
        }
        point.applyMatrix4(mesh.matrixWorld);projected.copy(point).project(camera);
        if(Math.abs(projected.x)>1||Math.abs(projected.y)>1||Math.abs(projected.z)>1)continue;
        rays.push(point.clone().sub(origin).normalize());
      }
    }
    const far=Math.max(camera.far||0,origin.distanceTo(bounds.getCenter(new THREE.Vector3()))+bounds.getSize(new THREE.Vector3()).length());
    const seenRays=new Set(),coveredMeshes=new Set(),intersectionCache=new Map();let sampleCount=0,clearCount=0;
    for(const ray of rays){
      if(!ray.lengthSq())continue;
      const key=ray.toArray().map(value=>Math.round(value*10000)).join(',');if(seenRays.has(key))continue;seenRays.add(key);
      direction.copy(ray);raycaster.set(origin,direction);raycaster.near=0;raycaster.far=far;
      const targetHits=intersectMeshes(nearby(targets,far),intersectionCache);
      const surface=targetHits.find(hit=>drawn(hitMaterial(hit)));if(!surface)continue;
      // A small tolerance leaves touching flanges and coincident cut faces alone.
      const limit=surface.distance-Math.max(.012,surface.distance*.0002);if(limit<=0)continue;
      sampleCount++;coveredMeshes.add(surface.object);raycaster.far=limit;
      const hits=intersectMeshes(nearby(obstacles,limit),intersectionCache);let obstructed=false;
      for(const hit of hits){if(hit.distance>limit||!solid(hitMaterial(hit)))continue;found.add(hit.object);obstructed=true;}
      if(!obstructed)clearCount++;
    }
    const expanded=expandAssemblies(found,obstacles),coverage=coveredMeshes.size/targets.length;
    return {...expanded,directBlockers:found,visibleRatio:sampleCount?clearCount/sampleCount:1,sampleCount,coverage,confidence:Math.min(1,sampleCount/64)};
  }

  function ghost(mesh){
    if(active.has(mesh))return;
    const original=mesh.material,clones=new Set(),bySource=new Map();
    function clone(source){
      if(!solid(source))return source;
      if(bySource.has(source))return bySource.get(source);
      const material=source.clone();material.transparent=true;material.opacity=GHOST_OPACITY;material.depthWrite=false;material.needsUpdate=true;
      clones.add(material);bySource.set(source,material);return material;
    }
    mesh.material=Array.isArray(original)?original.map(clone):clone(original);
    active.set(mesh,{original,clones,castShadow:mesh.castShadow});mesh.castShadow=false;
  }
  function update(camera,now=performance.now()){
    for(const [mesh,record] of active){const originals=materialList(record.original),current=materialList(mesh.material);if(!isVisible(mesh)||!originals.some(solid)){restore(mesh);blockers.delete(mesh);continue;}current.forEach((material,index)=>{const source=originals[index];if(material===source)return;if(material.color&&source.color)material.color.copy(source.color);if(material.emissive&&source.emissive)material.emissive.copy(source.emissive);if('emissiveIntensity' in source)material.emissiveIntensity=source.emissiveIntensity;material.visible=source.visible;});}
    if(disposed||!target||!camera){clear();return 0;}
    camera.updateWorldMatrix(true,false);
    const pose=[...camera.matrixWorld.elements,...camera.projectionMatrix.elements].map(value=>Math.round(value*10000)).join(',')+`:${layoutRevision}:${isVisible(target)}`;
    if(pose!==lastPose){lastPose=pose;poseChangedAt=now;}
    if(now>=lastCheck&&now-lastCheck<CHECK_INTERVAL)return blockers.size;
    const quality=now-poseChangedAt>=CHECK_INTERVAL?'full':'preview';
    if(pose===lastAnalysisPose&&(lastQuality==='full'||quality===lastQuality))return blockers.size;
    const result=analyze(camera,{quality});lastCheck=now;lastAnalysisPose=pose;lastQuality=quality;
    for(const mesh of active.keys())if(!result.blockers.has(mesh))restore(mesh);
    blockers.clear();
    for(const mesh of result.blockers){ghost(mesh);blockers.add(mesh);}
    return blockers.size;
  }
  function dispose(){reset();disposed=true;}
  return {setTarget,update,analyze,invalidate,reset,dispose,get blockers(){return new Set(blockers);}};
}
