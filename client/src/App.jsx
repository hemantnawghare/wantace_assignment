import { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return currencyFormatter.format(Number(value || 0));
}

function QuestionField({ question, value, onChange }) {
  if (!question || !question.active) return null;

  if (question.type === 'number') {
    return (
      <div className="field">
        <label htmlFor={question.key}>
          {question.label}
          {question.unit ? ` (${question.unit})` : ''}
        </label>
        <input
          id={question.key}
          type="number"
          min={question.min}
          max={question.max}
          value={value ?? ''}
          onChange={(event) => onChange(question.key, question.type === 'number' ? Number(event.target.value) : event.target.value)}
          placeholder={question.min !== undefined && question.max !== undefined ? `Enter ${question.min} to ${question.max}` : 'Enter amount'}
        />
      </div>
    );
  }

  if (question.type === 'select') {
    return (
      <div className="field">
        <label>{question.label}</label>
        <div className="option-list">
          {(question.options || []).map((option) => (
            <label key={option.value} className={`option-card ${value === option.value ? 'selected' : ''}`}>
              <span>{option.label}</span>
              <input
                type="radio"
                name={question.key}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(question.key, option.value)}
              />
            </label>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function EstimatorPage() {
  const [config, setConfig] = useState({ business: {}, questions: [] });
  const [answers, setAnswers] = useState({});
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [step, setStep] = useState(0);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        setError(err.message || 'Unable to load estimator');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const activeQuestions = useMemo(() => (config.questions || []).filter((question) => question.active), [config.questions]);

  const currentQuestion = activeQuestions[step] || null;

  const goNext = () => {
    if (step < activeQuestions.length - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const onAnswerChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const result = await api.submitEstimate({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        answers
      });
      setEstimate(result.estimate);
    } catch (err) {
      setError(err.message || 'Unable to calculate estimate');
    }
  };

  if (loading) return <div className="container"><h2>Loading estimator…</h2></div>;

  return (
    <div className="page-shell">
      <div className="container" style={{ width: '100%' }}>
        <header className="header">
          <div>
            <h1 className="brand">{config.business?.name || 'Northline Roofing & Exteriors'}</h1>
          </div>
          <a href="/admin/login" className="secondary-btn">Owner login</a>
        </header>

        <div className="estimator-grid">
          <section className="card panel">
            {!estimate && (
              <>
                <h2>Free roofing estimate</h2>
                <p className="subtext">Answer a few quick questions to get a realistic cost range.</p>

                {currentQuestion ? (
                  <>
                    <QuestionField
                      question={currentQuestion}
                      value={answers[currentQuestion.key]}
                      onChange={onAnswerChange}
                    />

                    <div className="button-row">
                      <button type="button" className="secondary-btn" onClick={goBack} disabled={step === 0}>Back</button>
                      {step < activeQuestions.length - 1 ? (
                        <button type="button" className="primary-btn" onClick={goNext}>Next</button>
                      ) : (
                        <button type="button" className="primary-btn" onClick={() => setStep(step + 1)}>Continue to contact</button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="field">
                    <label>Name</label>
                    <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                    <label>Phone</label>
                    <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                    <label>Email</label>
                    <input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                    <div className="button-row">
                      <button type="button" className="secondary-btn" onClick={goBack}>Back</button>
                      <button type="button" className="primary-btn" onClick={handleSubmit}>Get estimate</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {estimate && (
              <div className="summary-box">
                <h2>Your estimate range</h2>
                <div className="price-range">{formatMoney(estimate.low)} – {formatMoney(estimate.high)}</div>
                <p className="subtext">This range is based on your roof details and current configuration.</p>
                <div className="button-row">
                  <button className="primary-btn" onClick={() => window.location.reload()}>Start over</button>
                </div>
              </div>
            )}

            {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
          </section>

          <aside className="card panel">
            <h3>Project summary</h3>
            <ul>
              {activeQuestions.map((question) => (
                <li key={question.key}>
                  <strong>{question.label}:</strong> {answers[question.key] !== undefined && answers[question.key] !== '' ? String(answers[question.key]) : 'Not answered yet'}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('roofing2026!');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await api.login({ username, password });
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="card panel">
          <h2>Owner panel login</h2>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="primary-btn" type="submit">Log in</button>
            {error && <p style={{ color: '#b91c1c', marginTop: 14 }}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function OwnerPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [config, setConfig] = useState({ business: {}, questions: [], modifiers: {} });
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        await api.getAdminMe();
        setAuthenticated(true);
      } catch {
        window.location.href = '/admin/login';
        return;
      }
    }

    async function loadOwnerData() {
      try {
        const data = await api.getConfig();
        setConfig(data);
        const leadData = await api.getLeads();
        setLeads(leadData);
      } catch (err) {
        setError(err.message || 'Could not load owner data');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
    loadOwnerData();
  }, []);

  const updateQuestion = (idx, field, value) => {
    setConfig((prev) => {
      const nextQuestions = [...prev.questions];
      nextQuestions[idx] = { ...nextQuestions[idx], [field]: value };
      return { ...prev, questions: nextQuestions };
    });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    setConfig((prev) => {
      const nextQuestions = [...prev.questions];
      const nextOptions = [...(nextQuestions[questionIndex].options || [])];
      nextOptions[optionIndex] = { ...nextOptions[optionIndex], [field]: value };
      nextQuestions[questionIndex] = { ...nextQuestions[questionIndex], options: nextOptions };
      return { ...prev, questions: nextQuestions };
    });
  };

  const saveConfig = async () => {
    try {
      setError('');
      await api.saveConfig({ config });
      const freshConfig = await api.getConfig();
      setConfig(freshConfig);
      alert('Config saved successfully');
    } catch (err) {
      setError(err.message || 'Failed to save config');
    }
  };

  if (!authenticated && loading) return <div className="container"><h2>Checking access…</h2></div>;

  return (
    <div className="container">
      <header className="header">
        <h1 className="brand">Owner panel</h1>
        <a href="/" className="secondary-btn">Public estimator</a>
      </header>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="card panel" style={{ marginBottom: 24 }}>
        <h2>Configuration editor</h2>
        {config.questions.map((question, questionIndex) => (
          <div key={question.key || questionIndex} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div className="inline-form">
              <div>
                <label>Question key</label>
                <input value={question.key} onChange={(e) => updateQuestion(questionIndex, 'key', e.target.value)} />
              </div>
              <div>
                <label>Label</label>
                <input value={question.label} onChange={(e) => updateQuestion(questionIndex, 'label', e.target.value)} />
              </div>
              <div>
                <label>Type</label>
                <select value={question.type} onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                </select>
              </div>
            </div>

            <div className="toggle">
              <input type="checkbox" checked={Boolean(question.active)} onChange={(e) => updateQuestion(questionIndex, 'active', e.target.checked)} />
              <span>Active</span>
            </div>

            {question.type === 'number' && (
              <div className="inline-form">
                <div>
                  <label>Min</label>
                  <input type="number" value={question.min ?? ''} onChange={(e) => updateQuestion(questionIndex, 'min', Number(e.target.value))} />
                </div>
                <div>
                  <label>Max</label>
                  <input type="number" value={question.max ?? ''} onChange={(e) => updateQuestion(questionIndex, 'max', Number(e.target.value))} />
                </div>
              </div>
            )}

            {question.type === 'select' && (question.options || []).map((option, optionIndex) => (
              <div key={`${question.key}-${option.value || optionIndex}`} style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                <div className="inline-form">
                  <div>
                    <label>Option label</label>
                    <input value={option.label} onChange={(e) => updateOption(questionIndex, optionIndex, 'label', e.target.value)} />
                  </div>
                  <div>
                    <label>Value</label>
                    <input value={option.value} onChange={(e) => updateOption(questionIndex, optionIndex, 'value', e.target.value)} />
                  </div>
                </div>
                <div className="inline-form">
                  <div>
                    <label>Rate / sqft</label>
                    <input type="number" step="0.01" value={option.rate_per_sqft ?? ''} onChange={(e) => updateOption(questionIndex, optionIndex, 'rate_per_sqft', Number(e.target.value))} />
                  </div>
                  <div>
                    <label>Multiplier</label>
                    <input type="number" step="0.01" value={option.multiplier ?? ''} onChange={(e) => updateOption(questionIndex, optionIndex, 'multiplier', Number(e.target.value))} />
                  </div>
                  <div>
                    <label>Tear-off / sqft</label>
                    <input type="number" step="0.01" value={option.tear_off_per_sqft ?? ''} onChange={(e) => updateOption(questionIndex, optionIndex, 'tear_off_per_sqft', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="button-row">
          <button className="primary-btn" onClick={saveConfig}>Save changes</button>
        </div>
      </div>

      <div className="card panel">
        <h2>Leads</h2>
        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td>{lead.customer?.name}</td>
                  <td>{lead.customer?.phone}</td>
                  <td>{lead.customer?.email}</td>
                  <td>{new Date(lead.createdAt).toLocaleString()}</td>
                  <td>{formatMoney(lead.estimate?.low)} – {formatMoney(lead.estimate?.high)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === '/admin/login') return <AdminLogin />;
  if (pathname === '/admin') return <OwnerPanel />;
  return <EstimatorPage />;
}
