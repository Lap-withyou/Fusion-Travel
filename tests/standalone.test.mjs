import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('double-click artifact is syntactically valid and contains all runtime resources',()=>{
  const html=readFileSync(new URL('../聚变之旅.html',import.meta.url),'utf8');
  assert.ok(html.includes('<style>'));
  assert.ok(!/<script[^>]+src=/.test(html));
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));
  const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match,'one inline module is present');
  assert.doesNotThrow(()=>new vm.Script(match[1]));
  assert.ok(!/^import\s/m.test(match[1]));
  assert.ok(!match[1].includes("await import('./scene.js')"));
});
