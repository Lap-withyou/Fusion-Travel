import * as THREE from '../vendor/three.module.js';

// A real end use for the electricity route. All light emitters, spill decals and
// halos share the same delivered-power gate so an unpowered shop stays dark.
export function buildConvenienceStore(){
  const group=new THREE.Group();group.name='7-ELEVEN style neighbourhood convenience store';
  group.userData.endpointType='convenience-store';
  group.userData.inspection={direction:[.35,.7,1.65],padding:1.18};
  group.userData.physicalFootprint={minX:-3.325,maxX:3.325,minZ:-2,maxZ:2.4,roadStartsZ:2.5,roadClearance:.1};
  const fixtures=[],effects=[],lights=[],poweredMaterials=[];
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  const cylinderGeometry=new THREE.CylinderGeometry(1,1,1,20);
  const sphereGeometry=new THREE.SphereGeometry(1,20,12);
  const standard=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.64,metalness:.08,...extra});
  const wall=standard('#d8d6bd'),trim=standard('#343e3b',{metalness:.66,roughness:.35});
  const sidewalk=standard('#aea992',{roughness:.92}),floor=standard('#c8b38c',{roughness:.42});
  const shelfMat=standard('#d8d4ba',{metalness:.35,roughness:.45}),dark=standard('#313c3a');
  const glass=standard('#9fbcb5',{transparent:true,opacity:.13,metalness:.04,roughness:.12,depthWrite:false,side:THREE.DoubleSide});
  function box(parent,name,position,size,material,feature){
    const mesh=new THREE.Mesh(boxGeometry,material);mesh.name=name;mesh.position.fromArray(position);mesh.scale.fromArray(size);
    mesh.castShadow=true;mesh.receiveShadow=true;if(feature)mesh.userData.storeFeature=feature;parent.add(mesh);return mesh;
  }
  function cylinder(parent,name,position,radius,height,material){
    const mesh=new THREE.Mesh(cylinderGeometry,material);mesh.name=name;mesh.position.fromArray(position);mesh.scale.set(radius,height,radius);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function poweredMaterial(color,strength=1){
    const material=standard(color,{emissive:color,emissiveIntensity:0,toneMapped:false});poweredMaterials.push({material,strength});return material;
  }
  const lampMat=poweredMaterial('#ffcc7b',5.3),signMat=poweredMaterial('#fff1ca',1.25);
  const green=poweredMaterial('#007953',.24),orange=poweredMaterial('#e87c21',.28),red=poweredMaterial('#cb392f',.24);

  // Texture data is generated locally; the radial alpha also works in headless
  // scene tests and keeps the light footprint soft without external assets.
  const radialSize=64,radialData=new Uint8Array(radialSize*radialSize*4);
  for(let y=0;y<radialSize;y++)for(let x=0;x<radialSize;x++){
    const distance=Math.hypot((x+.5)/radialSize*2-1,(y+.5)/radialSize*2-1),index=(y*radialSize+x)*4;
    radialData[index]=255;radialData[index+1]=255;radialData[index+2]=255;radialData[index+3]=Math.round(Math.pow(Math.max(0,1-distance),1.6)*255);
  }
  const radialTexture=new THREE.DataTexture(radialData,radialSize,radialSize,THREE.RGBAFormat);radialTexture.needsUpdate=true;
  const planeGeometry=new THREE.PlaneGeometry(1,1);
  function glow(parent,name,position,size,type,opacity,color='#ffc067',rotation=[-Math.PI/2,0,0]){
    const material=new THREE.MeshBasicMaterial({color,map:radialTexture,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
    const mesh=new THREE.Mesh(planeGeometry,material);mesh.name=name;mesh.position.fromArray(position);mesh.scale.set(size[0],size[1],1);mesh.rotation.set(...rotation);mesh.renderOrder=3;mesh.visible=false;
    mesh.userData.poweredEffect=type;mesh.userData.peakOpacity=opacity;parent.add(mesh);effects.push(mesh);return mesh;
  }
  function point(parent,name,position,intensity,distance){
    const light=new THREE.PointLight('#ffbd69',0,distance,1.55);light.name=name;light.position.fromArray(position);light.userData.peakIntensity=intensity;parent.add(light);lights.push(light);return light;
  }
  function fixture(parent,name,position,size){
    box(parent,name+' dark housing',[position[0],position[1]+.045,position[2]],[size[0]+.09,.11,size[2]+.07],trim);
    const mesh=box(parent,name,position,size,lampMat,'ceiling-lamp');mesh.userData.warmFixture=true;fixtures.push(mesh);return mesh;
  }

  box(group,'Raised pavement and shop threshold',[0,.1,.2],[6.65,.18,4.4],sidewalk);
  // An inlaid signature belongs to the entrance promenade. Its transparent
  // canvas uses installed script fonts, so the complete scene works offline.
  let signatureTexture=null;
  if(typeof document!=='undefined'&&document.createElement){
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=352;
    const context=canvas.getContext('2d');
    if(context){
      context.clearRect(0,0,canvas.width,canvas.height);
      const ink=context.createLinearGradient(0,65,0,260);
      ink.addColorStop(0,'#173a38');ink.addColorStop(.56,'#29403a');ink.addColorStop(1,'#705126');
      context.font='italic 700 240px "Segoe Script", "Brush Script MT", cursive';
      context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';
      context.shadowColor='rgba(59,39,17,.46)';context.shadowBlur=3;context.shadowOffsetY=3;
      context.lineWidth=3;context.strokeStyle='rgba(246,222,166,.8)';
      context.strokeText('Designed by LAP',1024,153,1780);
      context.fillStyle=ink;context.fillText('Designed by LAP',1024,153,1780);
      context.shadowBlur=0;context.shadowOffsetY=0;
      // A fine, asymmetric pen flourish echoes a handwritten final stroke.
      context.strokeStyle='rgba(106,73,32,.92)';context.lineWidth=3.2;context.lineCap='round';
      context.beginPath();context.moveTo(350,261);
      context.bezierCurveTo(650,224,1185,287,1587,247);
      context.bezierCurveTo(1730,233,1773,202,1733,196);
      context.bezierCurveTo(1688,192,1660,251,1790,263);context.stroke();
      context.strokeStyle='rgba(255,239,198,.63)';context.lineWidth=1.5;
      for(const x of [158,1890]){
        context.beginPath();context.moveTo(x,120);context.lineTo(x,233);
        context.moveTo(x-22,176);context.lineTo(x+22,176);context.stroke();
        context.fillStyle='#dfbd7c';context.beginPath();context.moveTo(x,156);
        context.lineTo(x+6,176);context.lineTo(x,196);context.lineTo(x-6,176);context.closePath();context.fill();
      }
      signatureTexture=new THREE.CanvasTexture(canvas);signatureTexture.colorSpace=THREE.SRGBColorSpace;signatureTexture.anisotropy=8;
    }
  }
  const signatureMaterial=standard('#ffffff',{map:signatureTexture,transparent:true,opacity:signatureTexture ? .96 : 0,roughness:.78,metalness:.1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const signature=new THREE.Mesh(planeGeometry,signatureMaterial);signature.name='Designed by LAP — promenade calligraphy';
  signature.position.set(0,.194,1.88);signature.rotation.x=-Math.PI/2;signature.scale.set(4.2,.72,1);signature.receiveShadow=true;signature.renderOrder=4;
  signature.userData={storeFeature:'floor-signature',text:'Designed by LAP',artwork:'offline-canvas-calligraphy',physicalBounds:{minX:-2.1,maxX:2.1,minZ:1.52,maxZ:2.24},readsFrom:'+z'};group.add(signature);
  box(group,'Cream tiled shop floor',[0,.22,-.2],[5.7,.1,3.05],floor);
  for(let x=-2.4;x<=2.5;x+=.6)box(group,'Tile grout',[x,.274,-.2],[.014,.006,3.05],sidewalk);
  for(let z=-1.4;z<1.4;z+=.6)box(group,'Tile grout',[0,.274,z],[5.7,.006,.014],sidewalk);
  box(group,'Rear stucco wall',[0,1.6,-1.77],[5.9,2.8,.16],wall);
  for(const x of [-2.9,2.9]){
    box(group,'Side stucco wall',[x,1.6,-.23],[.16,2.8,3.1],wall);
    box(group,'Front structural column',[x,1.6,1.32],[.18,2.8,.2],wall);
  }
  box(group,'Flat roof slab',[0,3.06,-.14],[6.05,.18,3.5],wall);
  box(group,'Roof perimeter cap',[0,3.2,-.14],[6.22,.12,3.66],trim);
  box(group,'Front canopy soffit',[0,2.94,1.45],[6.15,.12,.55],shelfMat);
  // Green, orange and red run continuously across the storefront and sides.
  for(const [y,height,material]of [[3.12,.18,green],[2.95,.1,orange],[2.83,.1,red]]){
    box(group,'Brand stripe across front',[0,y,1.735],[6.18,height,.065],material,'brand-fascia');
    for(const x of [-3.06,3.06])box(group,'Brand stripe around corner',[x,y,-.03],[.065,height,3.45],material,'brand-fascia');
  }
  // Tall glass sheets deliberately reveal the stocked shop rather than using
  // opaque glowing windows. Frames and handles remain legible when unpowered.
  for(const [x,width]of [[-1.78,2.1],[1.68,2.22]]){
    box(group,'Clear full-height shopfront glass',[x,1.58,1.37],[width,2.45,.025],glass,'glass-facade');
    box(group,'Shopfront lower rail',[x,.36,1.4],[width,.075,.07],trim);
  }
  for(const x of [-2.82,-.69,.61,2.82])box(group,'Shopfront aluminium mullion',[x,1.58,1.415],[.055,2.5,.06],trim);
  box(group,'Glazed entrance door',[-.04,1.55,1.41],[1.18,2.38,.026],glass,'glass-facade');
  box(group,'Door bottom rail',[-.04,.38,1.445],[1.2,.08,.06],trim);
  box(group,'Door centre divider',[-.04,1.57,1.45],[.035,2.4,.06],trim);
  for(const x of [-.17,.09])box(group,'Door pull handle',[x,1.36,1.49],[.035,.42,.055],trim);
  box(group,'Entrance rubber mat',[-.04,.29,1.14],[1.2,.025,.4],dark);
  box(group,'Front glazing top rail',[0,2.8,1.42],[5.75,.07,.07],trim);
  // Small waist-high glazing strips reproduce the familiar convenience-shop
  // frontage while leaving most of the glass clear.
  for(const [y,material]of [[1.03,green],[.94,orange],[.85,red]]){
    for(const [x,width]of [[-1.78,2.1],[1.68,2.22]])box(group,'Brand stripe on glazing',[x,y,1.452],[width,.055,.018],material);
  }

  const sign=new THREE.Group();sign.name='7-ELEVEN illuminated shop sign';sign.userData.storeFeature='brand-sign';group.add(sign);
  box(sign,'Sign cabinet',[0,3.42,1.61],[2.35,.94,.2],trim);
  let signTexture=null;
  if(typeof document!=='undefined'&&document.createElement){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=320;const context=canvas.getContext('2d');
    if(context){
      context.fillStyle='#fff8dc';context.fillRect(0,0,768,320);
      context.fillStyle='#007a50';context.fillRect(0,0,768,15);context.fillRect(0,305,768,15);
      context.fillStyle='#ef832a';context.fillRect(40,34,235,47);
      context.fillStyle='#ca392f';context.font='900 222px Arial, sans-serif';context.textAlign='center';context.fillText('7',163,250);
      context.fillStyle='#007a50';context.font='900 104px Arial, sans-serif';context.fillText('ELEVEN',478,187);
      context.font='700 30px Arial, sans-serif';context.fillText('OPEN 24 HOURS',482,251);
      signTexture=new THREE.CanvasTexture(canvas);signTexture.colorSpace=THREE.SRGBColorSpace;
    }
  }
  const signFaceMaterial=signTexture?standard('#ffffff',{map:signTexture,emissive:'#fff1cd',emissiveMap:signTexture,emissiveIntensity:0,toneMapped:false}):signMat;
  if(signTexture)poweredMaterials.push({material:signFaceMaterial,strength:1.3});
  box(sign,'7-ELEVEN sign face',[0,3.42,1.721],[2.24,.83,.018],signFaceMaterial);
  // Geometric seven keeps the brand cue available without a browser canvas.
  if(!signTexture){
    box(sign,'Orange top of seven',[-.66,3.67,1.743],[.52,.105,.012],orange);
    const seven=box(sign,'Red diagonal of seven',[-.61,3.44,1.744],[.105,.51,.012],red);seven.rotation.z=-.33;
    for(let i=0;i<6;i++)box(sign,'Green ELEVEN letter bar',[-.18+i*.18,3.43,1.744],[.1,.2,.012],green);
  }

  const interior=new THREE.Group();interior.name='Warm shop interior, groceries and checkout';interior.userData.storeFeature='store-interior';group.add(interior);
  const productColors=['#d86632','#dbbe51','#588c67','#587d9f','#b95745','#e2dbc6'];
  const productMaterials=productColors.map(color=>standard(color,{roughness:.62}));
  function stockedShelf(name,x,z,width,height=1.65,depth=.48){
    const shelf=new THREE.Group();shelf.name=name;shelf.userData.storeFeature='stocked-shelf';shelf.position.set(x,0,z);interior.add(shelf);
    box(shelf,'Shelf back panel',[0,height/2+.3,-depth*.42],[width,height,.05],shelfMat);
    for(const side of [-1,1])box(shelf,'Shelf upright',[side*(width/2-.025),height/2+.3,0],[.045,height,depth],trim);
    const productTransforms=productColors.map(()=>[]),dummy=new THREE.Object3D();
    for(let tier=0;tier<3;tier++){
      const y=.38+tier*.48;box(shelf,'Merchandise shelf board',[0,y,0],[width,.045,depth],shelfMat);
      box(shelf,'Small shelf price rail',[0,y+.03,depth*.51],[width,.07,.025],wall);
      const count=Math.floor(width/.16);
      for(let i=0;i<count;i++)for(let row=0;row<2;row++){
        const colorIndex=(i+tier*2+row)%productColors.length,h=.18+((i+tier)%3)*.035;
        dummy.position.set(-width/2+.105+i*(width-.15)/count,y+h/2+.035,-.09+row*.18);dummy.scale.set(.105,h,.11);dummy.updateMatrix();productTransforms[colorIndex].push(dummy.matrix.clone());
      }
    }
    for(let i=0;i<productTransforms.length;i++){
      const mesh=new THREE.InstancedMesh(boxGeometry,productMaterials[i],productTransforms[i].length);mesh.name='Colourful stocked groceries';mesh.userData.storeFeature='products';productTransforms[i].forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;shelf.add(mesh);
    }
  }
  stockedShelf('Back-wall snack and drinks shelves',-1.63,-1.35,1.9,2.05,.43);
  stockedShelf('Back-wall packaged groceries',.46,-1.35,1.85,2.05,.43);
  stockedShelf('Low centre gondola',-1.5,.05,1.62,1.65,.5);
  stockedShelf('Centre snack display',.25,-.22,1.2,1.65,.5);
  // Refrigerated drinks cabinets and a coffee machine add a second readable
  // layer behind the glass, especially from the low front inspection camera.
  box(interior,'Drinks refrigerator cabinet',[2.13,1.3,-1.31],[1.2,2.12,.65],shelfMat);
  for(const x of [1.84,2.42]){
    box(interior,'Cooler dark inner door',[x,1.34,-.967],[.52,1.84,.035],dark);
    box(interior,'Cooler glazed door',[x,1.34,-.941],[.49,1.78,.018],glass);
    box(interior,'Cooler door handle',[x+.19,1.35,-.913],[.026,.62,.035],trim);
    for(let tier=0;tier<4;tier++){
      box(interior,'Cooler shelf',[x,.58+tier*.41,-.91],[.45,.025,.14],shelfMat);
      for(let n=0;n<3;n++)cylinder(interior,'Coloured chilled drink',[x-.14+n*.14,.72+tier*.41,-.9],.045,.23,productMaterials[(tier+n)%6]);
    }
  }
  const checkout=box(interior,'Checkout counter',[2,.81,.65],[1.24,1.04,.76],wall,'checkout-counter');
  box(interior,'Dark checkout worktop',[2,1.36,.65],[1.33,.08,.86],trim);
  box(interior,'Checkout till base',[1.78,1.43,.69],[.35,.08,.28],dark);
  const till=box(interior,'Checkout till screen',[1.78,1.62,.64],[.34,.27,.055],dark);till.rotation.x=-.15;
  box(interior,'Coffee machine',[2.34,1.64,.5],[.32,.51,.35],trim);
  box(interior,'Coffee machine control',[2.34,1.7,.682],[.22,.17,.012],shelfMat);
  for(const x of [-2.15,-.75,.75,2.15])fixture(interior,'Warm ceiling light',[x,2.85,-.23],[.82,.035,.24]);
  fixture(interior,'Entrance canopy light',[0,2.84,1.48],[1.55,.035,.2]);
  point(interior,'Warm interior left',[-1.55,2.55,-.12],20,6.2);
  point(interior,'Warm interior right',[1.55,2.55,-.12],20,6.2);
  glow(group,'Warm floor inside the shop',[0,.285,-.05],[6.1,3.8],'interior-spill',.43);
  glow(group,'Warm light spilling through the entrance',[0,.204,1.78],[5.8,3.1],'interior-spill',.46);
  glow(group,'Soft warm light behind the glass',[0,1.45,1.32],[5.6,2.5],'window-haze',.14,'#ffd28b',[0,0,0]);

  const street=new THREE.Group();street.name='Warm streetlights and illuminated pavement';street.userData.storeFeature='street-light';group.add(street);
  box(street,'Front kerb',[0,.1,2.31],[6.65,.19,.16],sidewalk);
  for(const x of [-2.95,2.95]){
    const z=2.12,lampX=x+(x<0?.38:-.38);
    cylinder(street,'Streetlight concrete footing',[x,.21,z],.18,.38,sidewalk);
    cylinder(street,'Streetlight metal post',[x,1.98,z],.047,3.58,trim);
    cylinder(street,'Streetlight post collar',[x,.48,z],.067,.25,trim);
    box(street,'Streetlight horizontal arm',[(x+lampX)/2,3.74,z],[.49,.06,.07],trim);
    box(street,'Streetlight lamp housing',[lampX,3.71,z],[.49,.12,.32],trim);
    const lamp=box(street,'Bright amber streetlight lens',[lampX,3.635,z],[.41,.035,.25],lampMat);lamp.userData.warmFixture=true;fixtures.push(lamp);
    point(street,'Streetlight pool source',[lampX,3.48,z],28,7.8);
    glow(street,'Amber streetlight pool on the road',[lampX,.08,z+.52],[4.25,4.5],'street-pool',.58);
    glow(street,'Streetlight lens halo',[lampX,3.58,z+.05],[.85,.62],'lamp-halo',.43,'#ffd38b',[0,0,0]);
    const bulbMaterial=new THREE.MeshBasicMaterial({color:'#ffc77e',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const bulb=new THREE.Mesh(sphereGeometry,bulbMaterial);bulb.name='Streetlight luminous core';bulb.position.set(lampX,3.59,z);bulb.scale.set(.2,.07,.14);bulb.userData.poweredEffect='lamp-core';bulb.userData.peakOpacity=.78;bulb.visible=false;street.add(bulb);effects.push(bulb);
  }
  // Bollards stay beside the entrance artwork and all solid frontage stays
  // behind the kerb. Only the soft light pools extend onto the open road.
  for(const x of [-2.5,2.5])cylinder(group,'Entrance safety bollard',[x,.62,1.85],.06,.82,orange);
  box(group,'Rooftop condenser unit',[-1.35,3.55,-.7],[1.15,.56,.83],shelfMat);
  for(let i=0;i<7;i++)box(group,'Condenser ventilation grille',[-1.8+i*.15,3.84,-.7],[.04,.025,.69],trim);
  group.userData.fixtureCount=fixtures.length;group.userData.interiorShelfCount=4;

  function update(state={}){
    const legacyRunning=state.phase===undefined||state.phase==='running';
    const generator=THREE.MathUtils.clamp(state.generator??(legacyRunning?Math.sqrt(Math.max(0,state.power??.65))*(state.activity??1):0),0,1);
    const delivered=Number.isFinite(state.netMW)?Math.max(0,state.netMW)/520:(legacyRunning?Math.max(0,state.power??.65):0);
    const power=state.phase==='standby'?0:THREE.MathUtils.clamp(delivered*generator,0,1.5);
    const on=power>0,brightness=on?Math.min(1.35,Math.sqrt(power)):0;
    for(const entry of poweredMaterials)entry.material.emissiveIntensity=entry.strength*brightness;
    for(const light of lights)light.intensity=light.userData.peakIntensity*brightness;
    for(const effect of effects){effect.visible=on;effect.material.opacity=effect.userData.peakOpacity*Math.min(1,brightness);}
    group.userData.deliveredPowerFraction=power;group.userData.powered=on;
  }
  update({phase:'running',generator:1,netMW:520});
  return {group,update};
}
