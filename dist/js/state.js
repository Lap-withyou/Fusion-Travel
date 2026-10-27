import {STEPS} from './steps.js';
const STEP_IDS=new Set(STEPS.map(step=>step.id));
export const CONNECTIONS = [
  ...STEPS.slice(0,-1).map((step,i)=>({from:step.id,to:STEPS[i+1].id,kind:'sequence'})),
  {from:7,to:1,kind:'fuel'},
  {from:6,to:8,kind:'heat'},
];
export const createJourneyState=()=>({mode:'overview',selected:null,part:null,visited:[],paused:false});
export function transition(state,event) {
  switch(event.type) {
    case 'select':
      if(!Number.isInteger(event.id)||!STEP_IDS.has(event.id)) return state;
      return {...state,mode:'step',selected:event.id,part:null,visited:[...new Set([...state.visited,event.id])]};
    case 'part': return state.selected&&event.id ? {...state,mode:'part',part:event.id} : state;
    case 'overview': return {...state,mode:'overview',selected:null,part:null};
    case 'pause': return {...state,paused:!!event.value};
    default: return state;
  }
}
