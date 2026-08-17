import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema(
  {
    config_version: { type: Number, required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true }
    },
    answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    estimate: {
      low: { type: Number, required: true },
      high: { type: Number, required: true },
      midpoint: { type: Number, required: true }
    }
  },
  { timestamps: true }
);

export const Lead = mongoose.model('Lead', LeadSchema);
