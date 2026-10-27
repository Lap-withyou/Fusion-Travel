import test from 'node:test';
import assert from 'node:assert/strict';

const moduleURL = new URL('../dist/js/energy.js', import.meta.url);
const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} should equal ${expected}`);

test('illustrative plant sends 520 MW to the grid after its internal loads', async () => {
  const {calculateEnergy, DEFAULT_ENERGY} = await import(moduleURL);
  assert.deepEqual(DEFAULT_ENERGY, {fusionMW:2000, auxiliaryMW:100, thermalEfficiency:.4, wallPlugEfficiency:.5, plantMW:120});
  const result = calculateEnergy();
  assert.equal(result.fusionMW, 2000);
  assert.equal(result.auxiliaryMW, 100);
  assert.equal(result.thermalMW, 2100);
  assert.equal(result.grossMW, 840);
  assert.equal(result.heatingElectricMW, 200);
  assert.equal(result.plantMW, 120);
  assert.equal(result.recirculatingMW, 320);
  assert.equal(result.netMW, 520);
  assert.equal(result.lossesMW, 1480);
  assert.equal(result.plasmaQ, 20);
  close(result.recirculatingFraction, 320 / 840);
  assert.equal(result.lamps, 52_000_000);
  assert.equal(result.positive, true);
});

test('alpha self-heating partitions fusion energy without creating a second energy source', async () => {
  const {calculateEnergy} = await import(moduleURL);
  const result = calculateEnergy();
  close(result.alphaFraction, 3.5 / 17.6);
  close(result.alphaMW, 2000 * 3.5 / 17.6);
  close(result.neutronMW, 2000 * 14.1 / 17.6);
  close(result.alphaMW + result.neutronMW, result.fusionMW);
  assert.equal(result.thermalMW, result.fusionMW + result.auxiliaryMW);
});

test('net electricity plus all rejected heat conserves the consumed fuel energy', async () => {
  const {calculateEnergy} = await import(moduleURL);
  for (const params of [
    {},
    {fusionMW:400, auxiliaryMW:100, thermalEfficiency:.3, wallPlugEfficiency:.4, plantMW:120},
    {fusionMW:0, auxiliaryMW:100, thermalEfficiency:.4, wallPlugEfficiency:.5, plantMW:10},
    {fusionMW:800, auxiliaryMW:0, thermalEfficiency:1, wallPlugEfficiency:1, plantMW:0}
  ]) {
    const result = calculateEnergy(params);
    close(result.netMW + result.lossesMW, result.fusionMW);
    assert.ok(result.lossesMW >= 0);
  }
});

test('a power-deficit scenario keeps the signed grid demand and cannot light net lamps', async () => {
  const {calculateEnergy} = await import(moduleURL);
  const result = calculateEnergy({fusionMW:100, auxiliaryMW:100, thermalEfficiency:.4, wallPlugEfficiency:.5, plantMW:120});
  assert.equal(result.netMW, -240);
  assert.equal(result.positive, false);
  assert.equal(result.lamps, 0);
  assert.ok(result.recirculatingFraction > 1);
});

test('zero auxiliary heating means infinite plasma Q, while a zero-output plant remains defined', async () => {
  const {calculateEnergy} = await import(moduleURL);
  assert.equal(calculateEnergy({auxiliaryMW:0}).plasmaQ, Infinity);
  const idle = calculateEnergy({fusionMW:0, auxiliaryMW:0, plantMW:0});
  assert.equal(idle.netMW, 0);
  assert.equal(idle.positive, false);
  assert.equal(idle.recirculatingFraction, 0);
  assert.equal(calculateEnergy({fusionMW:0, auxiliaryMW:0, plantMW:10}).recirculatingFraction, Infinity);
});

test('calculations use defaults for omitted fields without mutating caller inputs', async () => {
  const {calculateEnergy, DEFAULT_ENERGY} = await import(moduleURL);
  const input = Object.freeze({fusionMW:1000});
  assert.equal(calculateEnergy(input).netMW, 120);
  assert.deepEqual(input, {fusionMW:1000});
  assert.equal(calculateEnergy().fusionMW, DEFAULT_ENERGY.fusionMW);
});

test('invalid powers and efficiencies are rejected instead of silently changing the scenario', async () => {
  const {calculateEnergy} = await import(moduleURL);
  for (const key of ['fusionMW','auxiliaryMW','plantMW']) {
    for (const value of [-1, NaN, Infinity, '100', null]) {
      assert.throws(() => calculateEnergy({[key]:value}), RangeError, `${key}=${value}`);
    }
  }
  for (const key of ['thermalEfficiency','wallPlugEfficiency']) {
    for (const value of [-.1, 0, 1.01, NaN, Infinity, '.4', null]) {
      assert.throws(() => calculateEnergy({[key]:value}), RangeError, `${key}=${value}`);
    }
  }
  assert.throws(() => calculateEnergy(null), RangeError);
});

test('one completely reacted gram of equimolar D-T releases about 94 MWh of heat', async () => {
  const {fuelEnergy} = await import(moduleURL);
  const result = fuelEnergy(1);
  assert.equal(result.grams, 1);
  const joules = 6.02214076e23 / 5.030 * 17.6e6 * 1.602176634e-19;
  close(result.joules, joules);
  close(result.thermalMWh, joules / 3.6e9);
  assert.ok(result.thermalMWh > 93 && result.thermalMWh < 95);
  close(result.grossElectricMWh, result.thermalMWh * .4);
  close(result.lampHours, result.grossElectricMWh * 1e6 / 10);
  close(result.lampYears, result.lampHours / (24 * 365));
  close(result.householdDays, result.grossElectricMWh * 1000 / 10);
});

test('fuel comparisons scale with consumed mass and conversion efficiency', async () => {
  const {fuelEnergy} = await import(moduleURL);
  const one = fuelEnergy(1);
  const two = fuelEnergy(2, .2);
  close(two.thermalMWh, one.thermalMWh * 2);
  close(two.grossElectricMWh, one.grossElectricMWh);
  assert.equal(fuelEnergy(0).joules, 0);
  for (const grams of [-1, NaN, Infinity, '1']) assert.throws(() => fuelEnergy(grams), RangeError);
  for (const efficiency of [0, -.1, 1.1, NaN, Infinity, '.4']) assert.throws(() => fuelEnergy(1, efficiency), RangeError);
});

test('offline science notes identify the illustrative assumptions and primary sources', async () => {
  const {ENERGY_SOURCES, ENERGY_NOTES} = await import(moduleURL);
  assert.equal(ENERGY_NOTES.length, 3);
  assert.ok(ENERGY_NOTES.join(' ').includes('示意'));
  assert.ok(ENERGY_NOTES.join(' ').includes('完全反应'));
  assert.ok(ENERGY_SOURCES.length >= 3);
  for (const source of ENERGY_SOURCES) {
    assert.ok(source.title.length > 5);
    assert.ok(/^https:\/\//.test(source.url));
  }
});
