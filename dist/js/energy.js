// Educational steady-state accounting, not a reactor design or plasma simulation.
export const DEFAULT_ENERGY = Object.freeze({
  fusionMW: 2000,
  auxiliaryMW: 100,
  thermalEfficiency: .4,
  wallPlugEfficiency: .5,
  plantMW: 120
});

const ALPHA_FRACTION = 3.5 / 17.6;
const NEUTRON_FRACTION = 14.1 / 17.6;
const AVOGADRO = 6.02214076e23;
const ELECTRON_VOLT_J = 1.602176634e-19;
const DT_PAIR_MOLAR_MASS_G = 5.030;
const LED_WATTS = 10;
const HOUSEHOLD_KWH_PER_DAY = 10;

function nonnegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a finite non-negative number`);
  return value;
}

function efficiency(value, name) {
  if (!Number.isFinite(value) || value <= 0 || value > 1) throw new RangeError(`${name} must be greater than zero and no greater than one`);
  return value;
}

function finiteResults(values) {
  if (values.some(value => !Number.isFinite(value))) throw new RangeError('Scenario exceeds the supported numeric range');
}

/**
 * All powers are MW. Auxiliary power means heat absorbed by the plasma;
 * heatingElectricMW is the larger electrical input needed to deliver that heat.
 * We recover fusion + auxiliary heat once, omit blanket reaction heat, and treat
 * conversion losses and all plant loads as heat ultimately rejected to the environment.
 */
export function calculateEnergy(params = DEFAULT_ENERGY) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) throw new RangeError('Energy parameters must be an object');
  const input = {...DEFAULT_ENERGY, ...params};
  const fusionMW = nonnegative(input.fusionMW, 'fusionMW');
  const auxiliaryMW = nonnegative(input.auxiliaryMW, 'auxiliaryMW');
  const plantMW = nonnegative(input.plantMW, 'plantMW');
  const thermalEfficiency = efficiency(input.thermalEfficiency, 'thermalEfficiency');
  const wallPlugEfficiency = efficiency(input.wallPlugEfficiency, 'wallPlugEfficiency');

  const alphaMW = fusionMW * ALPHA_FRACTION;
  const neutronMW = fusionMW * NEUTRON_FRACTION;
  const thermalMW = fusionMW + auxiliaryMW;
  const grossMW = thermalMW * thermalEfficiency;
  const heatingElectricMW = auxiliaryMW / wallPlugEfficiency;
  const recirculatingMW = heatingElectricMW + plantMW;
  const netMW = grossMW - recirculatingMW;
  const lossesMW = thermalMW - grossMW + (heatingElectricMW - auxiliaryMW) + plantMW;
  const lamps = Math.max(0, netMW) * 1e6 / LED_WATTS;
  finiteResults([thermalMW, grossMW, heatingElectricMW, recirculatingMW, netMW, lossesMW, lamps]);

  return {
    fusionMW,
    auxiliaryMW,
    thermalMW,
    alphaMW,
    neutronMW,
    grossMW,
    heatingElectricMW,
    plantMW,
    recirculatingMW,
    netMW,
    lossesMW,
    plasmaQ: auxiliaryMW > 0 ? fusionMW / auxiliaryMW : Infinity,
    alphaFraction: ALPHA_FRACTION,
    recirculatingFraction: grossMW > 0 ? recirculatingMW / grossMW : (recirculatingMW > 0 ? Infinity : 0),
    lamps,
    positive: netMW > 0
  };
}

/**
 * Energy from the stated mass of D-T that actually reacts completely, with equal
 * numbers of D and T nuclei. Electrical comparisons are gross, before plant loads.
 */
export function fuelEnergy(grams, conversionEfficiency = .4) {
  nonnegative(grams, 'grams');
  efficiency(conversionEfficiency, 'conversionEfficiency');
  const joules = grams / DT_PAIR_MOLAR_MASS_G * AVOGADRO * 17.6e6 * ELECTRON_VOLT_J;
  const thermalMWh = joules / 3.6e9;
  const grossElectricMWh = thermalMWh * conversionEfficiency;
  const lampHours = grossElectricMWh * 1e6 / LED_WATTS;
  const lampYears = lampHours / (24 * 365);
  const householdDays = grossElectricMWh * 1000 / HOUSEHOLD_KWH_PER_DAY;
  finiteResults([joules, thermalMWh, grossElectricMWh, lampHours, lampYears, householdDays]);
  return {grams, joules, thermalMWh, grossElectricMWh, lampHours, lampYears, householdDays};
}

// Plain offline text; opening a primary-source link is optional.
export const ENERGY_NOTES = Object.freeze([
  'α粒子携带约20%的聚变能，约束良好时可在等离子体内自加热；持续运行仍需补充燃料、排出氦灰并补偿热损失。',
  '毛发电先供辅助加热、制冷与泵，余量才送入电网。这里是未来电站的示意参数，不代表ITER；等离子体Q不等于全厂净发电。',
  '燃料换算指完全反应的等核数氘氚混合物：1克约94 MWh热；40%转换率约37.5 MWh毛电，未扣厂用电。LED按10 W、家庭按10 kWh/日示意。'
]);

export const ENERGY_SOURCES = Object.freeze([
  Object.freeze({title:'ITER｜燃烧等离子体与α自加热', url:'https://www.iter.org/node/20687/what-burning-plasma'}),
  Object.freeze({title:'ITER｜聚变增益Q与全厂功率的区别', url:'https://www.iter.org/faqs'}),
  Object.freeze({title:'IAEA｜D-T反应产物的3.5与14.1 MeV能量', url:'https://www-pub.iaea.org/MTCD/Meetings/PDFplus/2010/cn180/cn180_papers/ife_p6-11.pdf'}),
  Object.freeze({title:'UKAEA｜电站毛发电、加热效率与循环用电模型', url:'https://scientific-publications.ukaea.uk/wp-content/uploads/1-S2-0-S0920379622000229-MAIN.PDF'}),
  Object.freeze({title:'ITER｜燃料补给、氦灰排出与未燃燃料回收', url:'https://www.iter.org/machine/supporting-systems/fuelling'})
]);
