import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {STEPS} from '../dist/js/steps.js';
import {calculateEnergy, fuelEnergy} from '../dist/js/energy.js';

const moduleURL = new URL('../dist/js/principles.js', import.meta.url);
const loadPrinciples = async () => {
  assert.ok(existsSync(moduleURL), 'the nine-step scientific principle module must exist');
  return import(moduleURL);
};
const words = cards => cards.map(card => [card.title, card.formula, card.explanation, ...(card.stages || [])].join(' ')).join(' ');

test('all nine stations expose concise, cited principle cards using the public schema', async () => {
  const {PRINCIPLES, PRINCIPLE_SOURCES} = await loadPrinciples();
  assert.deepEqual(Object.keys(PRINCIPLES).map(Number), STEPS.map(step => step.id));
  const sourceIds = new Set(PRINCIPLE_SOURCES.map(source => source.id));
  assert.equal(sourceIds.size, PRINCIPLE_SOURCES.length, 'source IDs must be unique');
  const cardIds = new Set();
  for (const step of STEPS) {
    const cards = PRINCIPLES[step.id];
    assert.ok(cards.length >= 1 && cards.length <= 3, `station ${step.id} needs 1–3 cards`);
    for (const card of cards) {
      assert.ok(!cardIds.has(card.id), `duplicate card ID ${card.id}`);
      cardIds.add(card.id);
      for (const key of ['id', 'title', 'formula', 'explanation']) assert.ok(typeof card[key] === 'string' && card[key].trim(), `${card.id}: ${key}`);
      assert.ok(card.explanation.length <= 240, `${card.id} must stay readable in the panel`);
      assert.ok(card.sourceIds.length > 0 && card.sourceIds.every(id => sourceIds.has(id)), `${card.id} needs resolvable citations`);
      assert.doesNotMatch(words([card]), /\uFFFD|<script|TODO|TBD|NaN|undefined/);
    }
  }
  for (const source of PRINCIPLE_SOURCES) {
    assert.ok(source.title.trim());
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(/(^|\.)(iter\.org|iaea\.org|ipp\.mpg\.de|pure\.mpg\.de|igi\.cnr\.it|energy\.gov|energystar\.gov|eia\.gov|pjm\.com|psfc\.mit\.edu|cambridge\.org|doi\.org)$/.test(url.hostname), `primary-source host: ${url.hostname}`);
  }
});

test('breakdown, ohmic heating and confinement explain distinct physical mechanisms', async () => {
  const {PRINCIPLES} = await loadPrinciples();
  const start = words(PRINCIPLES[2]);
  assert.match(start, /电场/);
  assert.match(start, /电子/);
  assert.match(start, /碰撞/);
  assert.match(start, /电离/);
  assert.match(start, /I²R/);
  const magnetic = words(PRINCIPLES[4]);
  assert.match(magnetic, /q\(v × B\)/);
  assert.match(magnetic, /环向/);
  assert.match(magnetic, /极向/);
  assert.match(magnetic, /螺旋/);
  assert.match(magnetic, /不做功/);
});

test('negative-ion NBI keeps production, acceleration, neutralization and plasma thermalization in order', async () => {
  const {PRINCIPLES} = await loadPrinciples();
  const beam = PRINCIPLES[3].find(card => Array.isArray(card.stages));
  assert.ok(beam, 'station 3 must provide the visible NBI stage chain');
  assert.equal(beam.stages.length, 7);
  const expected = [/负离子/, /加速/, /中性化/, /残余离子/, /穿入/, /重新电离/, /碰撞.*减速/];
  expected.forEach((pattern, index) => assert.match(beam.stages[index], pattern));
  assert.match(words(PRINCIPLES[3]), /D⁻.*D⁰.*D⁺/);
  assert.match(words(PRINCIPLES[3]), /电子和离子/);
});

test('fusion gives the correct kinetic energies and counts alpha self-heating only once', async () => {
  const {PRINCIPLES} = await loadPrinciples();
  const fusion = words(PRINCIPLES[5]);
  assert.match(fusion, /D \+ T → ⁴He \(3\.5 MeV\) \+ n \(14\.1 MeV\)/);
  assert.match(fusion, /Δmc²/);
  assert.match(fusion, /自加热/);
  assert.match(fusion, /不是额外/);
  assert.equal(3.5 + 14.1, 17.6);
  const result = calculateEnergy();
  assert.ok(Math.abs(result.alphaMW + result.neutronMW - result.fusionMW) < 1e-9);
});

test('thermal extraction and fuel recovery retain their separate paths and finite supply', async () => {
  const {PRINCIPLES} = await loadPrinciples();
  assert.match(words(PRINCIPLES[6]), /中子/);
  assert.match(words(PRINCIPLES[6]), /热交换器/);
  const recovery = words(PRINCIPLES[7]);
  assert.match(recovery, /未反应/);
  assert.match(recovery, /补充/);
  assert.match(recovery, /⁶Li \+ n → ⁴He \+ T/);
  assert.match(recovery, /不能无限/);
});

test('electricity cards agree with the illustrative plant balance and do not label gross electricity as net', async () => {
  const {PRINCIPLES} = await loadPrinciples();
  const generation = words(PRINCIPLES[8]);
  assert.match(generation, /−N ΔΦ\/Δt/);
  assert.match(generation, /涡轮/);
  assert.match(generation, /840/);
  assert.match(generation, /320/);
  assert.match(generation, /520/);
  assert.match(generation, /概念/);
  const result = calculateEnergy();
  assert.equal(result.grossMW, 840);
  assert.equal(result.recirculatingMW, 320);
  assert.equal(result.netMW, 520);
  const fuel = fuelEnergy(1);
  assert.ok(Math.abs(fuel.thermalMWh - 93.8) < .1);
  assert.ok(Math.abs(fuel.grossElectricMWh - 37.5) < .1);
  assert.match(words(PRINCIPLES[5]), /37\.5 MWh.*毛电/);
});

test('the endpoint explains LED conversion and load balance within the future-plant boundary', async () => {
  const {PRINCIPLES} = await loadPrinciples();
  const light = words(PRINCIPLES[9]);
  assert.match(light, /LED/);
  assert.match(light, /光.*热/);
  assert.match(light, /暖白/);
  assert.match(light, /负载/);
  assert.match(light, /ITER.*不发电/);
});
