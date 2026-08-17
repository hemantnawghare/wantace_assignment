import { useMemo, useState } from 'react';
import { api } from '../../services/api';
import QuestionField from '../dynamic/QuestionField';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return currencyFormatter.format(Number(value || 0));
}

export default function EstimatorWizard() {
  const [config, setConfig] = useState({ business: {}, questions: [] });
  const [answers, setAnswers] = useState({});
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [step, setStep] = useState(0);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useState(() => {
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
  });

  const activeQuestions = useMemo(() => (config.questions || []).filter((question) => question.active), [config.questions]);
  const currentQuestion = activeQuestions[step] || null;

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
                      <button type="button" className="secondary-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
                      {step < activeQuestions.length - 1 ? (
                        <button type="button" className="primary-btn" onClick={() => setStep((s) => s + 1)}>Next</button>
                      ) : (
                        <button type="button" className="primary-btn" onClick={() => setStep((s) => s + 1)}>Continue to contact</button>
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
                      <button type="button" className="secondary-btn" onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
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
