export default function QuestionField({ question, value, onChange }) {
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
          onChange={(event) => onChange(question.key, Number(event.target.value))}
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
