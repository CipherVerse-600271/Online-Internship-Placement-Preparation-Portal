import { useCallback, useEffect, useState } from "react";
import "./admin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminDashboard({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [internships, setInternships] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}/api/admin${path}`, {
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
        request("/analytics"),
        request("/internships"),
        request("/recruiters/pending"),
        request("/users"),
      ]);
      const [stats, jobs, pending, accountList] = results;
      if (stats.status === "fulfilled") setAnalytics(stats.value);
      if (jobs.status === "fulfilled") setInternships(jobs.value);
      if (pending.status === "fulfilled") setRecruiters(pending.value);
      if (accountList.status === "fulfilled") setUsers(accountList.value);
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
      await request(`/recruiters/${id}/decision`, {
        method: "PATCH", body: JSON.stringify({ decision }),
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
            <Stat label="Total internships" value={analytics.internships?.total ?? "—"} />
            <Stat label="Active internships" value={analytics.internships?.active ?? "—"} />
            <Stat label="Applications" value={analytics.applications ?? "Pending model"} />
            <Stat label="Offers" value={analytics.offers ?? "Pending model"} />
            <Stat label="Pending recruiters" value={analytics.pendingRecruiters ?? "Pending model"} />
          </div>
        )}
        {analytics?.topHiringCompanies?.length > 0 && (
          <div className="admin-panel"><h3>Top hiring companies</h3><ol>
            {analytics.topHiringCompanies.map((company) => <li key={company.company}>
              {company.company} <strong>{company.applicationCount} applications</strong>
            </li>)}
          </ol></div>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="recruiter-title">
        <h2 id="recruiter-title">Recruiter approval requests</h2>
        {recruiters.length === 0 ? <p>No pending recruiters, or the User model is not integrated.</p> : recruiters.map((person) => (
          <div className="admin-row" key={person._id}>
            <span><strong>{person.name || person.email || person._id}</strong><small>{person.email}</small></span>
            <span className="admin-actions">
              <button type="button" onClick={() => decideRecruiter(person._id, "approved")}>Approve</button>
              <button type="button" className="secondary" onClick={() => decideRecruiter(person._id, "rejected")}>Reject</button>
            </span>
          </div>
        ))}
      </section>

      <section className="admin-panel" aria-labelledby="internship-title">
        <h2 id="internship-title">Internship listings</h2>
        {internships.map((job) => (
          <div className="admin-row" key={job._id}>
            <span><strong>{job.title}</strong><small>{job.company} · {job.location}</small></span>
            <span className="admin-actions">
              <span className={job.isActive === false ? "admin-status off" : "admin-status"}>{job.isActive === false ? "Inactive" : "Active"}</span>
              <button type="button" className="secondary" onClick={() => setListingActive(job._id, job.isActive === false)}> {job.isActive === false ? "Activate" : "Deactivate"} </button>
            </span>
          </div>
        ))}
      </section>

      <section className="admin-panel" aria-labelledby="users-title">
        <h2 id="users-title">User accounts</h2>
        {users.length === 0 ? <p>No user records loaded, or the User model is not integrated.</p> : users.map((person) => (
          <div className="admin-row" key={person._id}>
            <span><strong>{person.name || person.email || person._id}</strong><small>{person.email} · {person.role}</small></span>
            <span className="admin-actions">
              <span className={person.isActive === false ? "admin-status off" : "admin-status"}>{person.isActive === false ? "Inactive" : "Active"}</span>
              <button type="button" className="secondary" onClick={() => setUserActive(person._id, person.isActive === false)}> {person.isActive === false ? "Activate" : "Deactivate"} </button>
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return <article className="admin-stat"><span>{label}</span><strong>{value}</strong></article>;
}
