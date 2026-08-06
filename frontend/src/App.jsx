import { useState } from 'react';
import './App.css';
 
// Circular "confidence gauge" - clarity score ko ek ring ke roop mein dikhata hai
function ClarityGauge({ score }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;
 
  let color = 'var(--danger)';
  if (score >= 7) color = 'var(--success)';
  else if (score >= 4) color = 'var(--accent)';
 
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="40" y="46" textAnchor="middle" fontFamily="Space Grotesk" fontSize="18" fontWeight="600" fill="var(--text-primary)">
        {score}
      </text>
    </svg>
  );
}
 
function App() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
 
  async function fetchQuestion() {
    const response = await fetch('http://localhost:3000/api/question');
    const data = await response.json();
    setQuestion(data);
    setResult(null);
    setAnswer('');
  }
 
  async function submitAnswer() {
    setLoading(true);
 
    const response = await fetch('http://localhost:3000/api/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.question,
        answer: answer,
        questionId: question.id
      })
    });
 
    const data = await response.json();
    setResult(data);
    setLoading(false);
  }
 
  return (
    <div className="app-shell">
      <div className="stage">
        <div className="eyebrow-row">
          <span className="live-dot"></span>
          Practice Session
        </div>
        <h1 className="title">MockMate</h1>
        <p className="subtitle">Real interview questions. Honest feedback. No fluff.</p>
 
        <button className="btn btn-secondary" onClick={fetchQuestion}>
          {question ? 'Next Question' : 'Get a Question'}
        </button>
 
        {question && (
          <div className="question-card">
            <span className={`category-badge ${question.category}`}>
              {question.category}
            </span>
            <p className="question-text">"{question.question}"</p>
 
            <textarea
              className="answer-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer like you would in the room..."
              rows={5}
            />
 
            <div className="actions-row">
              <button className="btn btn-primary" onClick={submitAnswer} disabled={loading || !answer}>
                {loading && (
                  <span className="waveform">
                    <span></span><span></span><span></span><span></span>
                  </span>
                )}
                {loading ? 'Analyzing' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}
 
        {result && (
          <div className="feedback-panel">
            <div className="feedback-header">
              <ClarityGauge score={result.starScore?.clarityScore ?? 0} />
              <div className="gauge-label">
                <p className="gauge-title">Clarity Score</p>
                <p className="gauge-sub">Based on structure and directness</p>
              </div>
            </div>
 
            <div className="feedback-row">
              <p className="feedback-label">Feedback</p>
              <p className="feedback-text">{result.starScore?.feedback}</p>
            </div>
 
            <div className="feedback-row">
              <p className="feedback-label">Filler Words ({result.fillerWords?.totalCount ?? 0})</p>
              <div className="filler-chips">
                {result.fillerWords && Object.entries(result.fillerWords.breakdown).length > 0 ? (
                  Object.entries(result.fillerWords.breakdown).map(([word, count]) => (
                    <span className="chip" key={word}>
                      "{word}" <strong>×{count}</strong>
                    </span>
                  ))
                ) : (
                  <span className="chip">None detected — clean delivery</span>
                )}
              </div>
            </div>
 
            <div className="feedback-row">
              <p className="feedback-label">Interviewer Follow-up</p>
              <div className="followup-block">
                <p>"{result.followUpQuestion}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
export default App;