import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyState, transition, CONNECTIONS} from '../dist/js/state.js';

test('every required station is reachable in sequence', () => {
  const state = createJourneyState();
  for (let id=1;id<=9;id++) {
    const next = transition(state,{type:'select',id});
    assert.equal(next.selected,id);
    assert.equal(next.mode,'step');
  }
  assert.equal(CONNECTIONS.filter(c=>c.kind==='sequence').length,8);
  for(let id=1;id<9;id++) assert.ok(CONNECTIONS.some(c=>c.from===id&&c.to===id+1));
});
test('fuel loop and actual heat path are distinct from numbered learning order', () => {
  assert.ok(CONNECTIONS.some(c=>c.from===7&&c.to===1&&c.kind==='fuel'));
  assert.ok(CONNECTIONS.some(c=>c.from===6&&c.to===8&&c.kind==='heat'));
});
test('part inspection returns to step and overview without losing visits', () => {
  let state = transition(createJourneyState(),{type:'select',id:3});
  state=transition(state,{type:'part',id:'beam'});
  assert.equal(state.mode,'part');
  assert.equal(state.part,'beam');
  state=transition(state,{type:'select',id:3});
  assert.equal(state.part,null);
  state=transition(state,{type:'overview'});
  assert.equal(state.mode,'overview');
  assert.equal(state.selected,null);
  assert.deepEqual(state.visited,[3]);
});
test('invalid selection and orphan part inspection cannot corrupt state', () => {
  const state=createJourneyState();
  for(const id of [0,10,NaN,'3',null]) assert.deepEqual(transition(state,{type:'select',id}),state);
  assert.deepEqual(transition(state,{type:'part',id:'beam'}),state);
});
test('pause explicitly controls animation state and visit count stays unique', () => {
  let state=transition(createJourneyState(),{type:'pause',value:true});
  assert.equal(state.paused,true);
  state=transition(state,{type:'select',id:1});
  state=transition(state,{type:'select',id:1});
  assert.deepEqual(state.visited,[1]);
  assert.equal(state.paused,true);
});
