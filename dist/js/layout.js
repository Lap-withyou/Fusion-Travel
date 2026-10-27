import {STORE_SITE,GRID_OUTPUT_POINTS} from './site-layout.js';

export const PLANT_LAYOUT={reactor:[-2,0,-1],fuel:[-13,0,-6],heating:[-11,0,0],recovery:[-12,0,6],heat:[6,0,-4],turbine:[8,0,6],electric:[15,0,3],city:STORE_SITE.position};
export const STEP_BINDINGS={
  1:{target:[-13,1.7,-6],label:[-13,3.1,-6],offset:[-35,-26]},
  2:{target:[-2,2.5,-1],label:[-3,5.8,-4],offset:[-75,-28]},
  3:{target:[-10.7,3.05,2.9],label:[-10.7,5.4,2.9],offset:[-60,-5]},
  4:{target:[-2,3,-1],label:[1,6,-1],offset:[40,-38]},
  5:{target:[-2,2.8,-1],label:[-1,2.8,1],offset:[40,8]},
  6:{target:[6,2.2,-4],label:[6,4.6,-4],offset:[35,-25]},
  7:{target:[-12,1.6,6],label:[-12,3.6,6],offset:[-25,28]},
  8:{target:[8,1.6,6],label:[8,3.5,6],offset:[35,20]},
  9:{target:[PLANT_LAYOUT.city[0],1.4,PLANT_LAYOUT.city[2]],label:[PLANT_LAYOUT.city[0],3.4,PLANT_LAYOUT.city[2]],offset:[25,25]},
};
export const FLOW_ROUTES=[
  {id:'fuel-feed',kind:'fuel',label:'燃料供给',steps:[1,2],color:'#4ca77a',radius:.11,points:[[-12,1.1,-6],[-9,1.1,-6],[-7,1.1,-6],[-7,1.1,-3],[-5.4,2,-3]]},
  {id:'neutral-beam-feed',kind:'electricity',label:'束源高压供电与辅助连接',steps:[3],color:'#d5ad42',radius:.10,points:[[-10,1.7,0],[-10,.55,-.05],[-15.3,.55,-.05],[-15.3,2.2,3.4],[-13.7,2.2,3.4]]},
  {id:'hot-coolant',kind:'heat',label:'主回路 · 高温冷却剂',steps:[5,6],color:'#e08a42',radius:.22,points:[[2.55,1.85,-3],[3.3,1.85,-3],[3.3,1.9,-5],[5,1.9,-5],[6,1.9,-4.8]]},
  {id:'cold-coolant',kind:'coolant',label:'主回路 · 冷却剂返回',steps:[6],color:'#4a98b6',radius:.2,points:[[6,1.05,-3],[4.2,1.05,-3],[2.55,1.05,-3]]},
  {id:'steam-main',kind:'steam',label:'二回路 · 蒸汽',steps:[6,8],color:'#a5c6cf',radius:.24,points:[[7,2.5,-4],[10.8,2.5,-4],[10.8,2.5,3.7],[7.6,2.5,3.7],[7.6,1.6,5.3]]},
  {id:'condensate',kind:'coolant',label:'冷凝水返回',steps:[8,6],color:'#4a98b6',radius:.14,points:[[7.4,.8,6.7],[5,.8,6.7],[5,.8,0],[6,.8,0],[6,.8,-2.9]]},
  {id:'exhaust-fuel',kind:'fuel',label:'排气与燃料处理',steps:[7],color:'#4ca77a',radius:.15,points:[[-4.1,.8,1],[-6,.8,1],[-6,.8,6],[-10.5,.8,6]]},
  {id:'fuel-return',kind:'fuel',label:'燃料闭环 · 回收再注入',steps:[7,1],color:'#4ca77a',radius:.12,points:[[-13,1,6],[-16,1,6],[-16,1,-9],[-13,1,-9],[-13,1,-7.2]]},
  {id:'generator-bus',kind:'electricity',label:'发电机输出',steps:[8,9],color:'#d5ad42',radius:.09,points:[[11,2,6],[13,2,6],[13,2,3],[14,2,3]]},
  {id:'aux-feedback',kind:'feedback',label:'厂内电力回供',steps:[3,4,8],color:'#e7bc40',radius:.075,points:[[15,1.4,2],[15,1.4,-8],[2,1.4,-8],[-9,1.4,-8],[-9,1.4,-1],[-10,1.4,-1]]},
  {id:'magnet-feedback',kind:'feedback',label:'低温与磁体辅助系统供电',steps:[4],color:'#e7bc40',radius:.06,points:[[2,1.4,-8],[2,1.4,-6],[.8,1.4,-5],[.8,1.4,-3.3]]},
  {id:'grid-output',kind:'grid',label:'净电力送出',steps:[9],color:'#e7bc40',radius:.08,path:'polyline',points:GRID_OUTPUT_POINTS},
];
