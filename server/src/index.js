import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { connectDb } from './connectDb.js';
import { Config } from './models/Config.js';
import { Lead } from './models/Lead.js';
import seedConfig from './seedConfig.js';
import { calculateEstimate } from './services/calculator.js';
import { requireAdminAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

function normalizeConfigRecord(configRecord) {
  if (!configRecord) return null;

  const normalized = JSON.parse(JSON.stringify(configRecord.toObject ? configRecord.toObject() : configRecord));

  normalized.questions = (normalized.questions || []).map((question) => ({
    ...question,
    options: (question.options || []).map((option) => ({
      ...option,
      rate_per_sqft: option.rate_per_sqft !== undefined ? Number(option.rate_per_sqft) : undefined,
      multiplier: option.multiplier !== undefined ? Number(option.multiplier) : undefined,
      tear_off_per_sqft: option.tear_off_per_sqft !== undefined ? Number(option.tear_off_per_sqft) : undefined
    }))
  }));

  normalized.modifiers = {
    waste_factor: Number(normalized.modifiers?.waste_factor ?? 0.1),
    permit_flat_fee: Number(normalized.modifiers?.permit_flat_fee ?? 350),
    range_spread_pct: Number(normalized.modifiers?.range_spread_pct ?? 0.12)
  };

  return normalized;
}

async function ensureSeedConfig() {
  const existing = await Config.findOne({ active: true });
  if (existing) return existing;

  const saved = await Config.create(seedConfig);
  return saved;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', async (req, res) => {
  try {
    const config = await Config.findOne({ active: true }).sort({ config_version: -1 }).lean();
    const activeConfig = normalizeConfigRecord(config || await ensureSeedConfig());

    if (!activeConfig) {
      return res.status(404).json({ error: 'No active config found' });
    }

    const publicQuestions = (activeConfig.questions || [])
      .filter((question) => question.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((question) => ({
        ...question,
        options: (question.options || []).map((option) => ({
          ...option,
          label: option.label,
          value: option.value
        }))
      }));

    return res.json({
      business: activeConfig.business,
      questions: publicQuestions,
      modifiers: activeConfig.modifiers,
      config_version: activeConfig.config_version
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load public config' });
  }
});

app.post('/api/estimate', async (req, res) => {
  try {
    const { name, phone, email, answers = {} } = req.body || {};

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required.' });
    }

    const config = normalizeConfigRecord(await Config.findOne({ active: true }).sort({ config_version: -1 }).lean());

    if (!config) {
      return res.status(404).json({ error: 'No active config available' });
    }

    const questions = config.questions || [];
    const allRequired = questions.filter((question) => question.active && question.required);

    for (const question of allRequired) {
      const value = answers[question.key];
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({ error: `${question.label} is required.` });
      }

      if (question.type === 'number') {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
          return res.status(400).json({ error: `${question.label} must be a number.` });
        }
        if (question.min !== undefined && numericValue < Number(question.min)) {
          return res.status(400).json({ error: `${question.label} cannot be below ${question.min}.` });
        }
        if (question.max !== undefined && numericValue > Number(question.max)) {
          return res.status(400).json({ error: `${question.label} cannot exceed ${question.max}.` });
        }
      }
    }

    const estimate = calculateEstimate(config, answers);

    const lead = await Lead.create({
      config_version: config.config_version,
      customer: { name, phone, email },
      answers,
      estimate: {
        low: estimate.low,
        high: estimate.high,
        midpoint: estimate.midpoint
      }
    });

    return res.status(201).json({
      estimate: {
        low: estimate.low,
        high: estimate.high,
        midpoint: estimate.midpoint
      },
      leadId: lead._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Estimate calculation failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'roofing2026!';
  const normalUser = process.env.USER_USERNAME || 'user';
  const normalPass = process.env.USER_PASSWORD || 'roofing2024!';

  const account =
    username === adminUser && password === adminPass
      ? { username: adminUser, role: 'admin' }
      : username === normalUser && password === normalPass
        ? { username: normalUser, role: 'user' }
        : null;

  if (!account) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: account.username, role: account.role },
    process.env.JWT_SECRET || 'northline-dev-secret',
    { expiresIn: '8h' }
  );

  if (account.role === 'admin') {
    res.cookie('northline_admin', 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    });
  }

  return res.json({
    success: true,
    token,
    user: {
      username: account.username,
      role: account.role
    }
  });
});

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

app.get('/api/admin/leads', requireAdminAuth, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).lean();
    res.json(leads.map((lead) => {
      const rawAnswers = lead.answers;
      const answers = rawAnswers instanceof Map
        ? Object.fromEntries(rawAnswers.entries())
        : rawAnswers && typeof rawAnswers === 'object'
          ? rawAnswers
          : {};

      return {
        _id: lead._id,
        config_version: lead.config_version,
        customer: lead.customer,
        estimate: lead.estimate,
        createdAt: lead.createdAt,
        answers
      };
    }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load leads' });
  }
});

app.put('/api/admin/config', requireAdminAuth, async (req, res) => {
  try {
    const { config } = req.body || {};

    if (!config) {
      return res.status(400).json({ error: 'Config payload is required.' });
    }

    const current = await Config.findOne({ active: true }).sort({ config_version: -1 });
    const newVersion = current ? (current.config_version || 1) + 1 : 1;

    const nextConfig = {
      config_version: newVersion,
      active: true,
      business: config.business || current?.business || { name: 'Northline Roofing & Exteriors', region: 'Midwest', currency: 'USD' },
      modifiers: {
        waste_factor: Number(config.modifiers?.waste_factor ?? current?.modifiers?.waste_factor ?? 0.1),
        permit_flat_fee: Number(config.modifiers?.permit_flat_fee ?? current?.modifiers?.permit_flat_fee ?? 350),
        range_spread_pct: Number(config.modifiers?.range_spread_pct ?? current?.modifiers?.range_spread_pct ?? 0.12)
      },
      questions: (config.questions || []).map((question) => ({
        ...question,
        order: Number(question.order ?? 0),
        active: Boolean(question.active),
        required: Boolean(question.required),
        min: question.min !== undefined ? Number(question.min) : undefined,
        max: question.max !== undefined ? Number(question.max) : undefined,
        options: (question.options || []).map((option) => ({
          ...option,
          rate_per_sqft: option.rate_per_sqft !== undefined ? Number(option.rate_per_sqft) : undefined,
          multiplier: option.multiplier !== undefined ? Number(option.multiplier) : undefined,
          tear_off_per_sqft: option.tear_off_per_sqft !== undefined ? Number(option.tear_off_per_sqft) : undefined
        }))
      }))
    };

    if (current) {
      current.active = false;
      await current.save();
    }

    const saved = await Config.create(nextConfig);
    return res.json({ success: true, config: normalizeConfigRecord(saved) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update config.' });
  }
});

async function startServer() {
  await connectDb();
  await ensureSeedConfig();

  app.listen(PORT, () => {
    console.log(`Northline API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
