import { useCallback, useEffect, useState } from "react";
import "./admin.css";
import { API_BASE } from "./apiBase.js";

export default function AdminDashboard({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [internships, setInternships] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [listingForm, setListingForm] = useState({ recruiter: "", title: "", company: "", location: "", stipend: "", duration: "", description: "", eligibility: "", skills: "", deadline: "" });

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}/admin${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }, [token]);

  const load = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const results = await Promise.allSettled([
        request("/overview"),
        request("/internships"),
        request("/recruiters/pending"),
        request("/users"),
        request("/audit-logs?limit=30"),
      ]);
      const [stats, jobs, pending, accountList, audit] = results;
      if (stats.status === "fulfilled") setAnalytics(stats.value);
      if (jobs.status === "fulfilled") setInternships(jobs.value.internships || []);
      if (pending.status === "fulfilled") setRecruiters(pending.value.recruiters || []);
      if (accountList.status === "fulfilled") setUsers(accountList.value.users || []);
      if (audit.status === "fulfilled") setAuditLogs(audit.value.logs || []);
      const failures = results.filter((item) => item.status === "rejected");
      if (failures.length) setError(failures.map((item) => item.reason.message).join(" · "));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  async function decideRecruiter(id, decision) {
    try {
      await request(`/recruiters/${id}/${decision === "approved" ? "approve" : "reject"}`, {
        method: "PATCH", body: JSON.stringify({}),
      });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function setListingActive(id, isActive) {
    try {
      await request(`/internships/${id}/active`, {
        method: "PATCH", body: JSON.stringify({ isActive }),
      });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function createListing(event) {
    event.preventDefault();
    try {
      const payload = { ...listingForm, stipend: Number(listingForm.stipend), skills: listingForm.skills.split(",").map(item => item.trim()).filter(Boolean) };
      await request("/internships", { method: "POST", body: JSON.stringify(payload) });
      setListingForm({ recruiter: "", title: "", company: "", location: "", stipend: "", duration: "", description: "", eligibility: "", skills: "", deadline: "" });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function editListing(job) {
    const title = window.prompt("Update internship title", job.title);
    if (title === null || !title.trim()) return;
    try {
      await request(`/internships/${job._id}`, { method: "PATCH", body: JSON.stringify({ title: title.trim() }) });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function setUserActive(id, isActive) {
    try {
      await request(`/users/${id}/active`, {
        method: "PATCH", body: JSON.stringify({ isActive }),
      });
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><p className="admin-eyebrow">TEAM 12 · CONTROL CENTRE</p><h1>Admin dashboard</h1>
          <p>Review platform activity, recruiter requests and account status.</p></div>
        <button type="button" onClick={load} disabled={busy}>{busy ? "Refreshing…" : "Refresh data"}</button>
      </header>

      {error && <div className="admin-alert" role="alert">{error}</div>}

      <section aria-labelledby="analytics-title">
        <h2 id="analytics-title">Placement analytics</h2>
        {!analytics ? <p>Analytics are loading or the API is not yet integrated.</p> : (
          <div className="admin-stat-grid">
            <Stat label="Students" value={analytics.students ?? "—"} />
            <Stat label="Recruiters" value={analytics.recruiters ?? "—"} />
            <Stat label="Pending recruiter reviews" value={analytics.pendingRecruiters ?? "—"} />
            <Stat label="Active internships" value={analytics.activeInternships ?? "—"} />
            <Stat label="Applications" value={analytics.applications ?? "—"} />
            <Stat label="Placements" value={analytics.placements?.reduce((sum, item) => sum + item.placements, 0) ?? "—"} />
          </div>
        )}
        {analytics?.placements?.length > 0 && (
          <div className="admin-panel"><h3>Top hiring companies</h3><ol>
            {analytics.placements.map((company) => <li key={company._id}>
              {company._id} <strong>{company.placements} placements</strong>
            </li>)}
          </ol></div>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="recruiter-title">
        <h2 id="recruiter-title">Recruiter approval requests</h2>
        {recruiters.length === 0 ? <p>No pending recruiters, or the User model is not integrated.</p> : recruiters.map((person) => (
          <div className="admin-row" key={person._id}>
              <span><strong>{person.fullName || person.email || person._id}</strong><small>{person.email} · {person.companyName || "Organization not provided"}</small>
                {(person.companyWebsite || person.companyEmail) && <small>{person.companyEmail || ""}{person.companyEmail && person.companyWebsite ? " · " : ""}{person.companyWebsite && <a href={person.companyWebsite} target="_blank" rel="noreferrer">Organization website</a>}</small>}
                <small>Email status: {person.isEmailVerified ? "Verified" : "Not verified"}</small>
              </span>
            <span className="admin-actions">
              <button type="button" onClick={() => decideRecruiter(person._id, "approved")}>Approve</button>
              <button type="button" className="secondary" onClick={() => decideRecruiter(person._id, "rejected")}>Reject</button>
            </span>
          </div>
        ))}
      </section>

      <section className="admin-panel" aria-labelledby="internship-title">
        <h2 id="internship-title">Internship listings</h2>
        <details><summary>Add internship for an approved recruiter</summary>
          <form className="admin-listing-form" onSubmit={createListing}>
            {[["recruiter", "Recruiter user ID"], ["title", "Title"], ["company", "Company"], ["location", "Location"], ["stipend", "Monthly stipend"], ["duration", "Duration"], ["description", "Description"], ["eligibility", "Eligibility"], ["skills", "Skills (comma separated)"], ["deadline", "Deadline"]].map(([key, label]) => <label key={key}>{label}<input required type={key === "deadline" ? "date" : key === "stipend" ? "number" : "text"} min={key === "stipend" ? "0" : undefined} value={listingForm[key]} onChange={event => setListingForm({ ...listingForm, [key]: event.target.value })} /></label>)}
            <button type="submit">Create internship</button>
          </form>
        </details>
        {internships.map((job) => (
          <div className="admin-row" key={job._id}>
            <span><strong>{job.title}</strong><small>{job.company} · {job.location}</small></span>
            <span className="admin-actions">
              <span className={job.isActive === false ? "admin-status off" : "admin-status"}>{job.isActive === false ? "Inactive" : "Active"}</span>
              <button type="button" className="secondary" onClick={() => editListing(job)}>Edit title</button>
              <button type="button" className="secondary" onClick={() => setListingActive(job._id, job.isActive === false)}> {job.isActive === false ? "Activate" : "Deactivate"} </button>
            </span>
          </div>
        ))}
      </section>

      <section className="admin-panel" aria-labelledby="users-title">
        <h2 id="users-title">User accounts</h2>
        {users.length === 0 ? <p>No user records loaded, or the User model is not integrated.</p> : users.map((person) => (
          <div className="admin-row" key={person._id}>
            <span><strong>{person.fullName || person.email || person._id}</strong><small>{person.email} · {person.role}</small></span>
            <span className="admin-actions">
              <span className={person.isActive === false ? "admin-status off" : "admin-status"}>{person.isActive === false ? "Inactive" : "Active"}</span>
              <button type="button" className="secondary" onClick={() => setUserActive(person._id, person.isActive === false)}> {person.isActive === false ? "Activate" : "Deactivate"} </button>
            </span>
          </div>
        ))}
      </section>

      <section className="admin-panel" aria-labelledby="audit-title">
        <h2 id="audit-title">Recent security and admin activity</h2>
        {auditLogs.length === 0 ? <p>No audit events are available.</p> : <div className="admin-audit-list">{auditLogs.map((entry) => <article className="admin-audit-row" key={entry._id}>
          <div><strong>{entry.event}</strong><small>{entry.actor?.fullName || entry.actor?.email || "System"}{entry.subject ? ` · ${entry.subject.fullName || entry.subject.email || entry.subject.role || "Account"}` : ""}</small></div>
          <span className="admin-status">{entry.outcome || "recorded"}</span>
          <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString()}</time>
        </article>)}</div>}
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return <article className="admin-stat"><span>{label}</span><strong>{value}</strong></article>;
}
