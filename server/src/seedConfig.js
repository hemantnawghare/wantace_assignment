const seedConfig = {
  config_version: 3,
  active: true,
  business: {
    name: 'Northline Roofing & Exteriors',
    region: 'Midwest',
    currency: 'USD'
  },
  modifiers: {
    waste_factor: 0.1,
    permit_flat_fee: 350,
    range_spread_pct: 0.12
  },
  questions: [
    {
      key: 'roof_area',
      label: 'Roof area',
      type: 'number',
      unit: 'sqft',
      required: true,
      min: 300,
      max: 6000,
      active: true,
      order: 1,
      help: 'Enter your roof area in square feet.'
    },
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      required: true,
      active: true,
      order: 2,
      options: [
        { value: 'asphalt_3tab', label: '3-Tab Asphalt', rate_per_sqft: 3.45 },
        { value: 'architectural', label: 'Architectural Shingle', rate_per_sqft: 4.25 },
        { value: 'metal', label: 'Metal Roofing', rate_per_sqft: 8.5 },
        { value: 'luxury', label: 'Luxury Shingle', rate_per_sqft: 6.75 }
      ]
    },
    {
      key: 'pitch',
      label: 'Pitch',
      type: 'select',
      required: true,
      active: true,
      order: 3,
      options: [
        { value: 'low', label: 'Low Pitch', multiplier: 1.0 },
        { value: 'average', label: 'Average Pitch', multiplier: 1.12 },
        { value: 'steep', label: 'Steep Pitch', multiplier: 1.28 }
      ]
    },
    {
      key: 'stories',
      label: 'Stories',
      type: 'select',
      required: true,
      active: true,
      order: 4,
      options: [
        { value: 'one', label: '1 Story', multiplier: 1.0 },
        { value: 'two', label: '2 Story', multiplier: 1.2 },
        { value: 'three', label: '3 Story', multiplier: 1.4 }
      ]
    },
    {
      key: 'layers',
      label: 'Existing roof layers',
      type: 'select',
      required: true,
      active: true,
      order: 5,
      options: [
        { value: 'none', label: 'No tear-off', tear_off_per_sqft: 0 },
        { value: 'one', label: '1 layer', tear_off_per_sqft: 1.2 },
        { value: 'two', label: '2 layers', tear_off_per_sqft: 1.8 }
      ]
    }
  ]
};

export default seedConfig;
