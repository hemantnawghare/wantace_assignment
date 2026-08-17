export function calculateEstimate(config, answers = {}) {
  const { questions = [], modifiers = {} } = config || {};
  const roofArea = Number(answers.roof_area || 0);

  const findOption = (questionKey) => {
    const question = questions.find((item) => item.key === questionKey);
    if (!question || !question.options) return null;
    const selectedValue = answers[questionKey];
    return question.options.find((option) => String(option.value) === String(selectedValue)) || null;
  };

  const materialOption = findOption('material');
  const pitchOption = findOption('pitch');
  const layersOption = findOption('layers');
  const storiesOption = findOption('stories');

  const ratePerSqft = Number(materialOption?.rate_per_sqft || 0);
  const pitchMultiplier = Number(pitchOption?.multiplier || 1);
  const tearOffPerSqft = Number(layersOption?.tear_off_per_sqft || 0);
  const storiesMultiplier = Number(storiesOption?.multiplier || 1);
  const wasteFactor = Number(modifiers.waste_factor || 0.1);
  const permitFee = Number(modifiers.permit_flat_fee || 350);
  const spreadPct = Number(modifiers.range_spread_pct || 0.12);

  const baseMaterialCost = roofArea * ratePerSqft * (1 + wasteFactor);
  const tearOffCost = roofArea * tearOffPerSqft;
  const adjustedSubtotal = (baseMaterialCost + tearOffCost) * pitchMultiplier * storiesMultiplier;
  const midpointEstimate = adjustedSubtotal + permitFee;
  const low = Math.round(midpointEstimate * (1 - spreadPct));
  const high = Math.round(midpointEstimate * (1 + spreadPct));

  return {
    low,
    high,
    midpoint: Math.round(midpointEstimate)
  };
}
