import { useEffect, useState } from "react";
import "./aptitude-progress.css";

const API_URL = "http://localhost:5000/api/aptitude";
const studentHeaders = { "x-student-id": "demo-student" };

export default function AptitudeProgress() {
  const [tests, setTests] = useState([]); const [attempt, setAttempt] = useState(null); const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); const [history, setHistory] = useState([]); const [message, setMessage] = useState(""); const [clock, setClock] = useState(0);
  async function loadDashboard() {
    const [testResponse, historyResponse] = await Promise.all([fetch(`${API_URL}/tests`), fetch(`${API_URL}/attempts`, { headers: studentHeaders })]);
    if (testResponse.ok) setTests(await testResponse.json());
    if (historyResponse.ok) setHistory(await historyResponse.json());
  }
  useEffect(() => { loadDashboard().catch(() => setMessage("Start the backend and MongoDB to load aptitude data.")); }, []);
  useEffect(() => { if (!attempt) return undefined; const interval = setInterval(() => setClock(Math.max(0, Math.ceil((new Date(attempt.expiresAt) - Date.now()) / 1000))), 1000); return () => clearInterval(interval); }, [attempt]);
  useEffect(() => { if (attempt && clock === 0) submitAttempt(); }, [clock, attempt]);
  async function startTest(testId) {
    const response = await fetch(`${API_URL}/attempts`, { method: "POST", headers: { "Content-Type": "application/json", ...studentHeaders }, body: JSON.stringify({ testId }) });
    if (!response.ok) return setMessage("Unable to start the selected test.");
    const data = await response.json(); setAttempt({ ...data.test, id: data.attemptId, expiresAt: data.expiresAt }); setClock(Math.ceil((new Date(data.expiresAt) - Date.now()) / 1000)); setAnswers({}); setResult(null); setMessage("");
  }
  async function submitAttempt() {
    if (!attempt) return; const answersPayload = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
    const response = await fetch(`${API_URL}/attempts/${attempt.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json", ...studentHeaders }, body: JSON.stringify({ answers: answersPayload }) });
    if (!response.ok) return setMessage("Your test could not be submitted. Please try again.");
    const data = await response.json(); setResult(data.attempt); setAttempt(null); await loadDashboard();
  }
  return <section className="aptitude-section" aria-labelledby="aptitude-heading">
    <div className="section-heading"><div><h2 id="aptitude-heading">Aptitude and Progress</h2><p>Take timed practice tests and use saved results to plan your next steps.</p></div></div>
    {message && <p className="feedback-message" role="status">{message}</p>}
    {!attempt && !result && <div className="test-grid">{tests.map((test) => <article className="test-card" key={test.id}><p className="eyebrow">{test.categoryLabel}</p><h3>{test.title}</h3><p>{test.questionCount} questions · {test.durationMinutes} minutes</p><button type="button" onClick={() => startTest(test.id)}>Start test</button></article>)}</div>}
    {attempt && <div className="test-runner"><div className="test-runner-header"><h3>{attempt.title}</h3><strong aria-live="polite">Time left: {String(Math.floor(clock / 60)).padStart(2, "0")}:{String(clock % 60).padStart(2, "0")}</strong></div>{attempt.questions.map((question, index) => <fieldset key={question.id}><legend>Question {index + 1} of {attempt.questions.length}: {question.question}</legend>{question.options.map((option, optionIndex) => <label className="option" key={option}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}/>{option}</label>)}</fieldset>)}<button type="button" onClick={submitAttempt}>Submit test</button></div>}
    {result && <div className="result-panel"><h3>Test result</h3><p className="result-score">{result.score}/{result.totalQuestions} ({result.percentage}%)</p><p>{result.correctCount} correct · {result.incorrectCount} incorrect · {result.unansweredCount} unanswered</p><button type="button" onClick={() => setResult(null)}>Choose another test</button></div>}
    <div className="progress-panel"><h3>Previous attempts</h3>{history.length === 0 ? <p>Complete a test to build your saved attempt history.</p> : <ul>{history.map((item) => <li key={item._id}><strong>{item.testTitle}</strong> — {item.score}/{item.totalQuestions} ({item.percentage}%) on {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}</li>)}</ul>}</div>
  </section>;
}

