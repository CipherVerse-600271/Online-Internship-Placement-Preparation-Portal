import { useCallback, useEffect, useState } from "react";
import "./App.css";
import AptitudeTests from "./AptitudeTests.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import { API_BASE } from "./apiBase.js";

const API = API_BASE;
const STATUSES = ["Pending", "Shortlisted", "Rejected", "Accepted"];
const TODAY_UTC = new Date().toISOString().slice(0, 10);
const MIN_DEADLINE_UTC = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("portalUser") || "null"); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("portalToken") || "");
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("student");
  const [auth, setAuth] = useState({ fullName: "", email: "", srn: "", password: "", companyName: "", companyWebsite: "", companyEmail: "" });
  const [resetForm, setResetForm] = useState({ email: "", otp: "", newPassword: "" });
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minStipend, setMinStipend] = useState("");
  const [maxStipend, setMaxStipend] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobForm, setJobForm] = useState({title:"",company:"",location:"",stipend:"",duration:"",description:"",eligibility:"",skills:"",deadline:""});
  const [studentSkills, setStudentSkills] = useState("");
  const [studentDashboard, setStudentDashboard] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && token) {
        localStorage.removeItem("portalToken"); localStorage.removeItem("portalUser");
        setToken(""); setUser(null); setNotice("Your session has expired. Please sign in again.");
      }
      throw new Error(data.message || data.errors?.[0]?.msg || "Request failed.");
    }
    return data;
  }, [token]);

  const loadInternships = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (skillFilter.trim()) params.set("skill", skillFilter.trim());
      if (locationFilter.trim()) params.set("location", locationFilter.trim());
      if (minStipend !== "") params.set("minStipend", minStipend);
      if (maxStipend !== "") params.set("maxStipend", maxStipend);
      if (durationFilter.trim()) params.set("duration", durationFilter.trim());
      const data = await request("/internships" + (params.toString() ? "?" + params.toString() : ""));
      setInternships(data);
      setSelected(current => current || data[0] || null);
    } catch (error) { setNotice(error.message); }
  }, [request, search, skillFilter, locationFilter, minStipend, maxStipend, durationFilter]);

  const loadDashboard = useCallback(async () => {
    if (!token || !user) return;
    try {
      if (user.role === "student") {
        const [mine, alerts, progress] = await Promise.all([
          request("/applications/mine"), request("/notifications"), request("/dashboard/student")
        ]);
        setApplications(mine);
        setNotifications(alerts);
        setStudentDashboard(progress);
        setStudentSkills((progress.skills || []).join(", "));
      } else if (user.role === "recruiter" || user.role === "admin") {
        setApplications(await request("/applications/recruiter"));
      }
    } catch (error) { setNotice(error.message); }
  }, [request, token, user]);

  useEffect(() => { loadInternships(); }, [loadInternships]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const endpoint = authMode === "login"
        ? "/auth/login"
        : authRole === "student" ? "/auth/register/student" : "/auth/register/recruiter";
      const payload = authMode === "login" ? { email: auth.email, password: auth.password } : authRole === "student"
        ? { fullName: auth.fullName, email: auth.email, srn: auth.srn, password: auth.password }
        : { fullName: auth.fullName, email: auth.email, password: auth.password, companyName: auth.companyName, companyWebsite: auth.companyWebsite, companyEmail: auth.companyEmail };
      const data = await request(endpoint, { method: "POST", body: JSON.stringify(payload) });
      if (authMode === "register") {
        setNotice(data.message + (authRole === "recruiter" ? " Verify your email and await administrator approval before signing in." : " Check your inbox for the verification link, then sign in."));
      } else {
        localStorage.setItem("portalToken", data.token);
        localStorage.setItem("portalUser", JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); setNotice("Welcome, " + data.user.fullName + "!");
      }
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function requestPasswordReset(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: resetForm.email }) });
      setNotice(result.message + " Check your inbox for the six-digit code.");
      setAuthMode("reset");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function resetPassword(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await request("/auth/reset-password", { method: "POST", body: JSON.stringify({ email: resetForm.email, otp: resetForm.otp, newPassword: resetForm.newPassword }) });
      setNotice(result.message + ". You can now sign in with your new password.");
      setAuthMode("login"); setAuth({ ...auth, email: resetForm.email, password: "" }); setResetForm({ ...resetForm, otp: "", newPassword: "" });
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function resendVerification() {
    setBusy(true); setNotice("");
    try { const result = await request("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email: auth.email }) }); setNotice(result.message); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("portalToken"); localStorage.removeItem("portalUser");
    setToken(""); setUser(null); setApplications([]); setNotifications([]);
    setNotice("You have been logged out.");
  }

  async function apply(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      await request("/applications", { method: "POST", body: JSON.stringify({
        internshipId: selected._id, resumeUrl, resumeName, coverLetter
      })});
      setNotice("Application submitted successfully.");
      setResumeUrl(""); setResumeName(""); setCoverLetter("");
      await loadDashboard();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice("Application status updated. The student has been notified.");
      await loadDashboard();
    } catch (error) { setNotice(error.message); }
  }

  async function markRead(id) {
    try {
      await request(`/notifications/${id}/read`, { method: "PATCH", body: "{}" });
      await loadDashboard();
    } catch (error) { setNotice(error.message); }
  }

  const filtered = internships;
  const isSelectedOpen = selected && (!selected.deadline || selected.deadline.slice(0, 10) > TODAY_UTC);

  return <div className="app">
    <header className="hero"><div className="hero-content">
      <p className="eyebrow">YOUR CAREER STARTS HERE</p><h1>Launch your next opportunity</h1>
      <p>Discover opportunities, apply, and track every application.</p>
      <div className="portal-account">{user ? <><span>Signed in as <b>{user.fullName}</b> ({user.role})</span><button onClick={logout}>Log out</button></> : <span>Sign in to apply and manage applications</span>}</div>
    </div></header>
    {user && <nav className="portal-nav" aria-label="Portal navigation">
      <a href="#opportunities">Internships</a>
      {user.role === "student" && <><a href="#student-overview">My dashboard</a><a href="#my-applications">Applications</a><a href="#aptitude">Aptitude practice</a></>}
      {user.role === "recruiter" && <><a href="#post-internship">Post an internship</a><a href="#review-applications">Applications</a></>}
      {user.role === "admin" && <a href="#admin-dashboard">Administration</a>}
    </nav>}
    <main className="container">
      {notice && <p className="feedback-message" role="status">{notice}</p>}
      {!user && <section className="details-panel auth-panel">
        <p className="eyebrow">STUDENT · RECRUITER · ADMIN</p>
        <h2>{authMode === "login" ? "Welcome back" : authMode === "register" ? "Create your account" : authMode === "forgot" ? "Reset your password" : "Enter your reset code"}</h2>
        {authMode === "forgot" && <form onSubmit={requestPasswordReset}>
          <p className="form-note">We’ll email a six-digit code if an account matches that address. The code expires after 10 minutes.</p>
          <label htmlFor="reset-email">Email</label><input id="reset-email" type="email" autoComplete="email" required value={resetForm.email} onChange={e => setResetForm({...resetForm,email:e.target.value})}/>
          <button className="apply-button" disabled={busy}>{busy ? "Please wait…" : "Send reset code"}</button>
        </form>}
        {authMode === "reset" && <form onSubmit={resetPassword}>
          <label htmlFor="reset-email-confirm">Email</label><input id="reset-email-confirm" type="email" autoComplete="email" required value={resetForm.email} onChange={e => setResetForm({...resetForm,email:e.target.value})}/>
          <label htmlFor="reset-otp">Six-digit code</label><input id="reset-otp" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={resetForm.otp} onChange={e => setResetForm({...resetForm,otp:e.target.value.replace(/\D/g,"").slice(0,6)})}/>
          <label htmlFor="reset-new-password">New password</label><input id="reset-new-password" type="password" autoComplete="new-password" minLength="8" required value={resetForm.newPassword} onChange={e => setResetForm({...resetForm,newPassword:e.target.value})}/>
          <p className="form-note">Use at least 8 characters with uppercase, lowercase, and a number.</p>
          <button className="apply-button" disabled={busy}>{busy ? "Please wait…" : "Set new password"}</button>
        </form>}
        {(authMode === "login" || authMode === "register") && <form onSubmit={submitAuth}>
          {authMode === "register" && <><label htmlFor="account-role">Account type</label><select id="account-role" value={authRole} onChange={e => setAuthRole(e.target.value)}><option value="student">Student</option><option value="recruiter">Recruiter</option></select>
            <label htmlFor="account-name">Full name</label><input id="account-name" autoComplete="name" required minLength="2" maxLength="100" value={auth.fullName} onChange={e => setAuth({...auth, fullName:e.target.value})}/></>}
          <label htmlFor="account-email">Email</label><input id="account-email" type="email" autoComplete="email" required value={auth.email} onChange={e => setAuth({...auth,email:e.target.value})}/>
          {authMode === "register" && authRole === "student" && <><label htmlFor="account-srn">Student registration number (SRN)</label><input id="account-srn" required minLength="4" maxLength="30" value={auth.srn} onChange={e => setAuth({...auth,srn:e.target.value})}/><p className="form-note">Use an email address you can access so you can complete verification.</p></>}
          {authMode === "register" && authRole === "recruiter" && <><label htmlFor="company-name">Organization name</label><input id="company-name" autoComplete="organization" required minLength="2" maxLength="160" value={auth.companyName} onChange={e => setAuth({...auth,companyName:e.target.value})}/><label htmlFor="company-website">Organization website (optional)</label><input id="company-website" type="url" placeholder="https://example.com" value={auth.companyWebsite} onChange={e => setAuth({...auth,companyWebsite:e.target.value})}/><label htmlFor="company-email">Organization email (optional)</label><input id="company-email" type="email" value={auth.companyEmail} onChange={e => setAuth({...auth,companyEmail:e.target.value})}/></>}
          <label htmlFor="account-password">Password</label><input id="account-password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength="8" maxLength="128" required value={auth.password} onChange={e => setAuth({...auth,password:e.target.value})}/>
          {authMode === "register" && <p className="form-note">Use at least 8 characters with uppercase, lowercase, and a number.</p>}
          <button className="apply-button" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Register"}</button>
        </form>}
        {authMode === "login" && <div className="auth-links"><button type="button" className="text-button" onClick={() => {setResetForm({...resetForm,email:auth.email});setAuthMode("forgot");}}>Forgot password?</button><button type="button" className="text-button" disabled={!auth.email || busy} onClick={resendVerification}>Resend verification email</button></div>}
        {authMode === "register" && <p className="form-note">Email verification is required. Recruiter accounts also need administrator approval.</p>}
        {(authMode === "login" || authMode === "register") && <button className="details-button auth-toggle" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</button>}
        {(authMode === "forgot" || authMode === "reset") && <button className="text-button" onClick={() => setAuthMode("login")}>Back to sign in</button>}
      </section>}

      <section id="opportunities" className="section-heading"><div><h2>Explore Internships</h2><p>Search available roles and select one to view details.</p></div><span className="result-count">{filtered.length} opportunities</span></section>
      <section className="filters" aria-label="Filter internships"><input aria-label="Search role or company" type="search" placeholder="Search role or company..." value={search} onChange={e => setSearch(e.target.value)}/><input aria-label="Filter by skill" placeholder="Skill" value={skillFilter} onChange={e => setSkillFilter(e.target.value)}/><input aria-label="Filter by location" placeholder="Location" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}/><input aria-label="Minimum stipend" type="number" min="0" placeholder="Minimum stipend" value={minStipend} onChange={e => setMinStipend(e.target.value)}/><input aria-label="Maximum stipend" type="number" min="0" placeholder="Maximum stipend" value={maxStipend} onChange={e => setMaxStipend(e.target.value)}/><input aria-label="Filter by duration" placeholder="Duration" value={durationFilter} onChange={e => setDurationFilter(e.target.value)}/><button type="button" className="details-button" onClick={() => {setSearch("");setSkillFilter("");setLocationFilter("");setMinStipend("");setMaxStipend("");setDurationFilter("");}}>Clear filters</button></section>
      <section className="internship-list">
        {filtered.map(job => <article className={selected?._id === job._id ? "internship-card selected-card" : "internship-card"} key={job._id}>
          <div className="card-top"><div className="company-icon">{job.company?.[0] || "I"}</div><span className="location-tag">{job.location}</span></div>
          <h3>{job.title}</h3><p className="company-name">{job.company}</p>
          <div className="job-meta"><span>₹{Number(job.stipend || 0).toLocaleString("en-IN")}/month</span><span>{job.duration}</span></div>
          <div className="skill-list">{(job.skills || []).map(skill => <span className="skill-tag" key={skill}>{skill}</span>)}</div>
          <button className="details-button" onClick={() => setSelected(job)}>View details / Apply</button>
        </article>)}
        {filtered.length === 0 && <div className="empty-state">No internships match your search.</div>}
      </section>

      {selected && <section className="details-panel"><p className="eyebrow">INTERNSHIP DETAILS</p><h2>{selected.title}</h2><p className="company-name">{selected.company}</p>
        <p><b>Location:</b> {selected.location} · <b>Stipend:</b> ₹{selected.stipend}/month · <b>Duration:</b> {selected.duration}</p>
        <p>{selected.description}</p><p><b>Eligibility:</b> {selected.eligibility || "Not specified"}</p><p><b>Skills:</b> {(selected.skills || []).join(", ") || "Not specified"}</p><p><b>Deadline:</b> {selected.deadline ? new Date(selected.deadline).toLocaleDateString() : "Not specified"}</p><p><b>Application status:</b> {isSelectedOpen ? "Open" : "Closed"}</p>
        {user?.role === "student" && isSelectedOpen && <><hr/><h3>Submit your application</h3><form onSubmit={apply}>
          <label htmlFor="resume-url">Resume link (Google Drive / portfolio URL)</label><input id="resume-url" type="url" required placeholder="https://..." value={resumeUrl} onChange={e => setResumeUrl(e.target.value)}/>
          <label htmlFor="resume-name">Resume file name</label><input id="resume-name" required placeholder="MyResume.pdf" value={resumeName} onChange={e => setResumeName(e.target.value)}/>
          <label htmlFor="cover-letter">Cover letter (optional)</label><textarea id="cover-letter" rows="4" value={coverLetter} onChange={e => setCoverLetter(e.target.value)}/>
          <button className="apply-button" disabled={busy}>Submit application</button>
        </form></>}
        {user?.role === "student" && !isSelectedOpen && <p className="form-note">The application deadline has passed, so this listing is closed.</p>}
        {!user && <p className="form-note">Sign in as a student to apply.</p>}
      </section>}

      {user?.role === "student" && <section className="details-panel">
        <h2>My saved skills</h2>
        <p>Save your skills to receive alerts when matching internships are published.</p>
        <form onSubmit={async event => {
          event.preventDefault();
          try {
            const result = await request("/auth/skills", {method:"PATCH", body:JSON.stringify({skills:studentSkills.split(",").map(x=>x.trim()).filter(Boolean)})});
            setNotice(result.message); setStudentSkills((result.user?.skills || []).join(", ")); await loadDashboard();
          } catch(error) { setNotice(error.message); }
        }}>
          <label>Skills (comma-separated)<input value={studentSkills} onChange={e=>setStudentSkills(e.target.value)} placeholder="JavaScript, React, Python"/></label>
          <button className="apply-button">Save skills</button>
        </form>
      </section>}
      {user?.role === "student" && <>
        <section id="student-overview" className="applications-section" aria-labelledby="progress-heading">
          <h2 id="progress-heading">Progress and recommendations</h2>
          <div className="status-summary" aria-label="Application status summary">
            {["Pending", "Shortlisted", "Accepted", "Rejected"].map(status => <article className="status-summary-card" key={status}><span>{status}</span><strong>{applications.filter(item => item.status === status).length}</strong></article>)}
          </div>
          <section className="attempt-history" aria-labelledby="attempt-history-heading">
            <div className="section-heading"><div><h3 id="attempt-history-heading">Aptitude test attempt history</h3><p>{studentDashboard?.tests?.length || 0} completed attempts · latest first</p></div></div>
            {studentDashboard?.tests?.length ? (
              <>
                {studentDashboard.tests.length > 1 && (() => {
                  const difference = Number((Number(studentDashboard.tests[0].result?.percentage ?? 0) - Number(studentDashboard.tests[1].result?.percentage ?? 0)).toFixed(2));
                  return <p className="form-note" role="status">Latest attempt compared with the previous attempt: {difference > 0 ? "+" : ""}{difference} percentage points{difference > 0 ? " improvement." : difference < 0 ? " decrease." : " (no change)."}</p>;
                })()}
                <div className="application-list">
                  {studentDashboard.tests.map((item, index) => {
                    const older = studentDashboard.tests[index + 1];
                    const difference = older ? Number((Number(item.result?.percentage ?? 0) - Number(older.result?.percentage ?? 0)).toFixed(2)) : null;
                    return <article className="application-card" key={item._id || index}>
                      <div className="application-card-heading">
                        <div><h4>{item.result?.topic || item.topic}</h4><p className="company-name">{item.startedAt ? new Date(item.startedAt).toLocaleString() : "Date unavailable"}</p></div>
                        <span className="status-badge status-accepted">{item.status === "expired" ? "Time expired" : "Submitted"}</span>
                      </div>
                      <p><b>Score:</b> {item.result?.score ?? 0}/{item.result?.totalQuestions ?? 0} ({item.result?.percentage ?? 0}%)</p>
                      <p><b>Correct:</b> {item.result?.correct ?? 0} · <b>Incorrect:</b> {item.result?.incorrect ?? 0} · <b>Unanswered:</b> {item.result?.unanswered ?? 0}</p>
                      <p><b>Time taken:</b> {item.timeTakenSeconds == null ? "Unavailable" : `${Math.floor(item.timeTakenSeconds / 60)}m ${item.timeTakenSeconds % 60}s`}</p>
                      {difference != null && <p className="form-note">Compared with the next older attempt: {difference > 0 ? "+" : ""}{difference} percentage points.</p>}
                    </article>;
                  })}
                </div>
              </>
            ) : <div className="empty-state"><h4>No completed aptitude tests yet</h4><p>Complete a timed aptitude test to see your scores and performance history here.</p></div>}
          </section>
          <section aria-labelledby="aptitude-summary-heading">
            <h3 id="aptitude-summary-heading">Aptitude performance summary</h3>
            <p>{studentDashboard?.testPerformance?.completedAttempts ?? 0} completed tests · Overall average: {studentDashboard?.testPerformance?.overallAverage == null ? "Not available yet" : `${studentDashboard.testPerformance.overallAverage}%`}</p>
            <div className="status-summary">
              {(studentDashboard?.testPerformance?.byTopic || []).map(item => (
                <article className="status-summary-card" key={item.topic}>
                  <span>{item.topic.charAt(0).toUpperCase() + item.topic.slice(1)}</span>
                  <strong>{item.averagePercentage == null ? "—" : `${item.averagePercentage}%`}</strong>
                  <small>{item.attempts} attempt(s)</small>
                </article>
              ))}
            </div>
          </section>
          <section aria-labelledby="recommendations-heading">
            <h3 id="recommendations-heading">Recommended internships</h3>
            {studentDashboard?.recommendations?.length ? (
              <div className="application-list">
                {studentDashboard.recommendations.map(job => (
                  <article className="application-card" key={job._id}>
                    <div className="application-card-heading">
                      <div><h4>{job.title}</h4><p className="company-name">{job.company} · {job.location}</p></div>
                      <span className="status-badge status-accepted">{job.matchScore ?? 0}% skill match</span>
                    </div>
                    <p><b>Matched skills:</b> {(job.matchedSkills || []).join(", ") || "No direct skill match identified"}</p>
                    <p><b>Required skills:</b> {(job.skills || []).join(", ") || "Not specified"}</p>
                    <p><b>Stipend:</b> {job.stipend == null ? "Not specified" : job.stipend} · <b>Duration:</b> {job.duration || "Not specified"}</p>
                  </article>
                ))}
              </div>
            ) : <p>No matching internships are available right now. Update your profile skills or check again later.</p>}
            {studentDashboard?.skillGaps?.length > 0 && <p>Skills without a current internship match: {studentDashboard.skillGaps.join(", ")}</p>}
          </section>
        </section>
        <div id="aptitude"><AptitudeTests onCompleted={loadDashboard} /></div>
      </>}
      {user?.role === "admin" && <div id="admin-dashboard"><AdminDashboard token={token} /></div>}
      {user?.role === "student" && <section id="my-applications" className="applications-section"><div className="section-heading"><div><h2>My Applications</h2><p>Your latest saved application statuses.</p></div><span className="result-count">{applications.length} submitted</span></div>
        {applications.length === 0 ? <div className="empty-state"><h3>No applications yet</h3><p>Choose an internship and submit an application.</p></div> :
          <div className="application-list">{applications.map(app => <article className="application-card" key={app._id}>
            <div className="application-card-heading"><div><h3>{app.internship?.title}</h3><p className="company-name">{app.internship?.company}</p></div><span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span></div>
            <p><b>Applied:</b> {new Date(app.createdAt).toLocaleDateString()}</p><p><b>Resume:</b> <a href={app.resumeUrl} target="_blank" rel="noreferrer">{app.resumeName} (open)</a></p>
            {app.coverLetter && <p><b>Cover letter:</b> {app.coverLetter}</p>}
          </article>)}</div>}
        <h2>Notifications</h2>{notifications.length === 0 ? <p>No status notifications yet.</p> : notifications.map(item => <article className="application-card" key={item._id}>
          <p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small>{!item.read && <button className="details-button" onClick={() => markRead(item._id)}>Mark as read</button>}
        </article>)}
      </section>}

      {user?.role === "recruiter" && <section id="post-internship" className="details-panel">
        <h2>Post an internship</h2>
        <form onSubmit={async event => {
          event.preventDefault(); setBusy(true); setNotice("");
          try {
            const payload = {...jobForm, stipend:Number(jobForm.stipend), skills:jobForm.skills.split(",").map(x=>x.trim()).filter(Boolean)};
            const result = await request("/internships", {method:"POST", body:JSON.stringify(payload)});
            setNotice(result.message); setJobForm({title:"",company:"",location:"",stipend:"",duration:"",description:"",eligibility:"",skills:"",deadline:""});
            await loadInternships();
          } catch(error) { setNotice(error.message); } finally { setBusy(false); }
        }}>
          <label>Internship title<input required value={jobForm.title} onChange={e=>setJobForm({...jobForm,title:e.target.value})}/></label>
          <label>Company<input required value={jobForm.company} onChange={e=>setJobForm({...jobForm,company:e.target.value})}/></label>
          <label>Location<input required value={jobForm.location} onChange={e=>setJobForm({...jobForm,location:e.target.value})}/></label>
          <label>Monthly stipend<input required type="number" min="0" value={jobForm.stipend} onChange={e=>setJobForm({...jobForm,stipend:e.target.value})}/></label>
          <label>Duration<input required value={jobForm.duration} onChange={e=>setJobForm({...jobForm,duration:e.target.value})}/></label>
          <label>Description<textarea required value={jobForm.description} onChange={e=>setJobForm({...jobForm,description:e.target.value})}/></label>
          <label>Eligibility criteria<textarea required value={jobForm.eligibility} onChange={e=>setJobForm({...jobForm,eligibility:e.target.value})}/></label>
          <label>Required skills (comma-separated)<input value={jobForm.skills} onChange={e=>setJobForm({...jobForm,skills:e.target.value})}/></label>
          <label>Application deadline<input required type="date" min={MIN_DEADLINE_UTC} value={jobForm.deadline} onChange={e=>setJobForm({...jobForm,deadline:e.target.value})}/></label>
          <button className="apply-button" disabled={busy}>Publish internship</button>
        </form>
      </section>}
      {(user?.role === "recruiter" || user?.role === "admin") && <section id="review-applications" className="applications-section"><div className="section-heading"><div><h2>Applications for my internships</h2><p>Review candidate details and update selection status.</p></div><span className="result-count">{applications.length} applications</span></div>
        {applications.length === 0 ? <div className="empty-state"><p>No applications have been received for your internships.</p></div> :
          <div className="application-list">{applications.map(app => <article className="application-card" key={app._id}>
            <div className="application-card-heading"><div><h3>{app.student?.fullName}</h3><p>{app.student?.email} · {app.student?.srn || "No SRN"}</p><b>{app.internship?.title} — {app.internship?.company}</b></div><span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span></div>
            <p><b>Resume:</b> <a href={app.resumeUrl} target="_blank" rel="noreferrer">{app.resumeName} (open)</a></p>{app.coverLetter && <p><b>Cover letter:</b> {app.coverLetter}</p>}
            <label htmlFor={`status-${app._id}`}>Update status</label><select id={`status-${app._id}`} value={app.status} onChange={e => updateStatus(app._id,e.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select>
          </article>)}</div>}
      </section>}
    </main>
    <footer className="footer"><p>Online Internship &amp; Placement Preparation Portal · Team 12</p><p>Internship Listings &amp; Applications Module</p></footer>
  </div>;
}

export default App;
