import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateEnergy} from '../dist/js/energy.js';

const moduleURL = new URL('../dist/js/operation.js', import.meta.url);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} should equal ${expected}`);

test('cold startup imports the fixed plant demand without claiming generator recirculation', async () => {
  const {operatingPowers} = await import(moduleURL);
  assert.deepEqual(operatingPowers(calculateEnergy(), {activity:0, generator:0, alpha:0}), {
    grossMW:0, demandMW:120, netMW:-120, alphaMW:0,
    internalFromGeneratorMW:0, importMW:120, exportMW:0
  });
});

test('fully running plant matches the steady-state accounting exactly', async () => {
  const {operatingPowers} = await import(moduleURL);
  const energy = calculateEnergy();
  const live = operatingPowers(energy);
  assert.equal(live.grossMW, energy.grossMW);
  assert.equal(live.demandMW, energy.recirculatingMW);
  assert.equal(live.netMW, 520);
  assert.equal(live.alphaMW, energy.alphaMW);
  assert.equal(live.internalFromGeneratorMW, 320);
  assert.equal(live.importMW, 0);
  assert.equal(live.exportMW, 520);
});

test('intermediate startup shares generator output and imports only the deficit', async () => {
  const {operatingPowers} = await import(moduleURL);
  const energy = calculateEnergy();
  const live = operatingPowers(energy, {activity:.5, generator:.2, alpha:.6});
  assert.equal(live.grossMW, 168);
  assert.equal(live.demandMW, 220);
  assert.equal(live.netMW, -52);
  close(live.alphaMW, energy.alphaMW * .5 * .6);
  assert.equal(live.internalFromGeneratorMW, 168);
  assert.equal(live.importMW, 52);
  assert.equal(live.exportMW, 0);
});

test('operating factors are clamped to their physical display range', async () => {
  const {operatingPowers} = await import(moduleURL);
  const energy = calculateEnergy();
  const live = operatingPowers(energy, {activity:2, generator:-1, alpha:3});
  assert.equal(live.grossMW, 0);
  assert.equal(live.demandMW, 320);
  assert.equal(live.alphaMW, energy.alphaMW);
  assert.equal(live.netMW, -320);
});

test('zero and floating-point residue are balanced rather than grid imports or exports', async () => {
  const {operatingPowers} = await import(moduleURL);
  const balanced = calculateEnergy({fusionMW:500, auxiliaryMW:50, thermalEfficiency:.4});
  const live = operatingPowers(balanced);
  assert.equal(live.netMW, 0);
  assert.equal(live.importMW, 0);
  assert.equal(live.exportMW, 0);
  const residue = operatingPowers({...balanced, grossMW:balanced.grossMW + 1e-9});
  assert.equal(residue.netMW, 0);
  assert.equal(residue.importMW, 0);
  assert.equal(residue.exportMW, 0);
});

test('every displayed phase conserves generator, grid, and plant electrical power', async () => {
  const {operatingPowers} = await import(moduleURL);
  for (const energy of [calculateEnergy(), calculateEnergy({fusionMW:500, auxiliaryMW:400, thermalEfficiency:.3})]) {
    for (const factors of [{activity:0,generator:0,alpha:0},{activity:.2,generator:.1,alpha:.3},{activity:.8,generator:.7,alpha:.9},{}]) {
      const live = operatingPowers(energy, factors);
      close(live.grossMW + live.importMW, live.demandMW + live.exportMW);
      close(live.internalFromGeneratorMW + live.exportMW, live.grossMW);
      close(live.internalFromGeneratorMW + live.importMW, live.demandMW);
      assert.ok(live.importMW === 0 || live.exportMW === 0);
    }
  }
});

test('non-finite phase factors are rejected', async () => {
  const {operatingPowers} = await import(moduleURL);
  for (const key of ['activity','generator','alpha']) {
    for (const value of [NaN, Infinity, -Infinity, '1']) {
      assert.throws(() => operatingPowers(calculateEnergy(), {[key]:value}), RangeError);
    }
  }
});
