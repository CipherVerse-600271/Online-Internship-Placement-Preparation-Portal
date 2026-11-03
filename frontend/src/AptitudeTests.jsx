import { useEffect, useMemo, useState } from "react";
import "./aptitude-tests.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function readToken() {
  return localStorage.getItem("portalToken") || localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

function AptitudeTests() {
  const [token] = useState(readToken);
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState("");
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}/aptitude${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "The request could not be completed.");
    return data;
  };

  useEffect(() => {
    if (!token) return;
    let active = true;
    request("/topics")
      .then((data) => { if (active) setTopics(data); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!session || finished) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) submitTest(true);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session, finished]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
    const seconds = (remaining % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remaining]);

  async function startTest(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
    try {
      const data = await request("/start", {
        method: "POST",
        body: JSON.stringify({ topic })
      });
      setSession(data);
      setAnswers({});
      setFinished(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectAnswer(questionId, selectedOption) {
    if (!session || finished) return;
    setAnswers((previous) => ({ ...previous, [questionId]: selectedOption }));
    try {
      await request(`/sessions/${session.sessionId}/answers`, {
        method: "PUT",
        body: JSON.stringify({ questionId, selectedOption })
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitTest(automatic = false) {
    if (!session || finished || loading) return;
    setLoading(true);
    setError("");
    try {
      const submission = await request(`/sessions/${session.sessionId}/submit`, { method: "POST" });
      setResult(submission.result || null);
      setFinished(true);
      setNotice(automatic || submission.status === "expired"
        ? "Time is up. Your test has ended automatically."
        : "Your test has been submitted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetTest() {
    setSession(null);
    setAnswers({});
    setFinished(false);
    setNotice("");
    setError("");
    setResult(null);
    setRemaining(0);
  }

  if (!token) {
    return (
      <section className="aptitude-shell">
        <div className="aptitude-heading">
          <p className="aptitude-eyebrow">PLACEMENT PREPARATION</p>
          <h2>Aptitude practice</h2>
          <p>Sign in through the portal to access timed aptitude tests.</p>
        </div>
        <div className="aptitude-message">
          Your frontend login integration is not available in the current application yet.
          Once the authentication module stores its JWT as <code>token</code> in local storage,
          this section will connect automatically.
        </div>
      </section>
    );
  }

  return (
    <section className="aptitude-shell">
      <div className="aptitude-heading">
        <p className="aptitude-eyebrow">PLACEMENT PREPARATION</p>
        <h2>Aptitude practice</h2>
        <p>Choose a topic, answer each question and submit before the timer expires.</p>
      </div>

      {error && <p className="aptitude-alert" role="alert">{error}</p>}
      {notice && <p className="aptitude-success" role="status">{notice}</p>}

      {!session ? (
        <form className="aptitude-topic-form" onSubmit={startTest}>
          <label htmlFor="aptitude-topic">Choose a test topic</label>
          <select id="aptitude-topic" value={topic} onChange={(event) => setTopic(event.target.value)} required>
            <option value="">Select a topic</option>
            {topics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.questionCount} questions · {Math.floor(item.durationSeconds / 60)} minutes
              </option>
            ))}
          </select>
          <button type="submit" disabled={!topic || loading || topics.length === 0}>
            {loading ? "Starting..." : "Start test"}
          </button>
        </form>
      ) : (
        <>
          <div className="aptitude-test-toolbar">
            <div>
              <span className="aptitude-eyebrow">{finished ? "TEST RESULT" : "CURRENT TEST"}</span>
              <h3>{session.topicName}</h3>
            </div>
            {!finished && (
              <div className={remaining <= 60 ? "aptitude-timer urgent" : "aptitude-timer"} aria-live="polite">
                <span>Time remaining</span>
                <strong>{formattedTime}</strong>
              </div>
            )}
          </div>

          {!finished && (
            <>
              <div className="aptitude-progress-track">
                <span style={{ width: `${(Object.keys(answers).length / session.questions.length) * 100}%` }} />
              </div>
              <p className="aptitude-answer-count">{Object.keys(answers).length} of {session.questions.length} answered</p>
            </>
          )}

          <div className="aptitude-question-list">
            {session.questions.map((question, index) => (
              <fieldset className="aptitude-question" key={question.id} disabled={finished}>
                <legend><span>Question {index + 1}</span>{question.text}</legend>
                <div className="aptitude-options">
                  {question.options.map((option, optionIndex) => (
                    <label className={answers[question.id] === optionIndex ? "aptitude-option selected" : "aptitude-option"} key={optionIndex}>
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === optionIndex}
                        onChange={() => selectAnswer(question.id, optionIndex)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {finished && result && (
            <div className="aptitude-result" role="status">
              <h3>Your Result</h3>
              <p><strong>{result.score} / {result.totalQuestions}</strong> correct answers</p>
              <p><strong>{result.percentage}%</strong> score</p>
              <p>{result.correct} correct · {result.incorrect} incorrect · {result.unanswered} unanswered</p>
            </div>
          )}

          <div className="aptitude-submit-row">
            {finished ? (
              <button type="button" onClick={resetTest}>Back to topics</button>
            ) : (
              <button type="button" disabled={loading} onClick={() => submitTest(false)}>
                {loading ? "Submitting..." : "Submit test"}
              </button>
            )}
          </div>
          <p className="aptitude-note">Answers are saved as you go. Results are calculated and stored when the test is submitted.</p>
        </>
      )}
    </section>
  );
}

export default AptitudeTests;
