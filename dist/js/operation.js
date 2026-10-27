const ZERO_TOLERANCE_MW = 1e-8;

function phaseFactor(value, name) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return Math.max(0, Math.min(1, value));
}

// An illustrative phase progression, not a time-dependent reactor model.
export function operatingPowers(energy, {activity=1, generator=1, alpha=1} = {}) {
  activity = phaseFactor(activity, 'activity');
  generator = phaseFactor(generator, 'generator');
  alpha = phaseFactor(alpha, 'alpha');
  const grossMW = energy.grossMW * generator;
  const demandMW = energy.plantMW + energy.heatingElectricMW * activity;
  const differenceMW = grossMW - demandMW;
  const netMW = Math.abs(differenceMW) <= ZERO_TOLERANCE_MW ? 0 : differenceMW;
  return {
    grossMW,
    demandMW,
    netMW,
    alphaMW: energy.alphaMW * activity * alpha,
    internalFromGeneratorMW: Math.min(grossMW, demandMW),
    importMW: Math.max(0, -netMW),
    exportMW: Math.max(0, netMW)
  };
}
