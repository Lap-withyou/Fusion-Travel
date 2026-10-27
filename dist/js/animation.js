export const frameDelta=(now,previous)=>Math.max(0,Math.min((now-previous)/1000,.05));
export const loopPhase=(time,speed,offset=0)=>((time*speed+offset)%1+1)%1;
