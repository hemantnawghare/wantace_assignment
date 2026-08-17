import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return currencyFormatter.format(Number(value || 0));
}

export default function OwnerPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [config, setConfig] = useState({ business: {}, questions: [], modifiers: {} });
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function seed() {
      try {
        await api.getAdminMe();
        setAuthenticated(true);
        const configData = await api.getConfig();
        const leadData = await api.getLeads();
        setConfig(configData);
        setLeads(leadData);
      } catch {
        window.location.href = '/admin/login';
        return;
      } finally {
        setLoading(false);
      }
    }

    seed();
  }, []);

  const updateQuestion = (idx, field, value) => {
    setConfig((prev) => {
      const next = [...prev.questions];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, questions: next };
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
      const fresh = await api.getConfig();
      setConfig(fresh);
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
