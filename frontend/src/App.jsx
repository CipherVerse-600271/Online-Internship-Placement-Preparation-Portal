
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";
const STATUSES = ["Pending", "Shortlisted", "Rejected", "Accepted"];

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("portalUser") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("portalToken") || ""
  );
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("student");
  const [auth, setAuth] = useState({
    fullName: "",
    email: "",
    srn: "",
    password: ""
  });
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [internshipForm, setInternshipForm] = useState({
    title: "",
    company: "",
    location: "",
    stipend: "",
    duration: "",
    description: "",
    skills: "",
    applyLink: "",
    deadline: ""
  });

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
      const message =
        data.message ||
        data.errors?.[0]?.msg ||
        "Request failed. Please try again.";

      throw new Error(message);
    }

    return data;
  }, [token]);

  const loadInternships = useCallback(async () => {
    try {
      const data = await request("/internships");
      setInternships(data);
      setSelected(current => current || data[0] || null);
    } catch (error) {
      setNotice(error.message);
    }
  }, [request]);

  const loadDashboard = useCallback(async () => {
    if (!token || !user) return;

    try {
      if (user.role === "student") {
        const [mine, alerts] = await Promise.all([
          request("/applications/mine"),
          request("/notifications")
        ]);

        setApplications(mine);
        setNotifications(alerts);
      } else if (
        user.role === "recruiter" ||
        user.role === "admin"
      ) {
        setApplications(await request("/applications/recruiter"));
      }
    } catch (error) {
      setNotice(error.message);
    }
  }, [request, token, user]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const endpoint =
        authMode === "login"
          ? "/auth/login"
          : authRole === "student"
            ? "/auth/register/student"
            : "/auth/register/recruiter";

      const payload =
        authMode === "login"
          ? {
              email: auth.email.trim(),
              password: auth.password
            }
          : {
              ...auth,
              email: auth.email.trim()
            };

      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (authMode === "register") {
        setNotice(
          data.message +
          (authRole === "recruiter"
            ? " An administrator must approve the account before login."
            : "")
        );

        if (authRole === "student") {
          setAuthMode("login");
          setAuth({
            fullName: "",
            email: auth.email,
            srn: "",
            password: ""
          });
        }
      } else {
        localStorage.setItem("portalToken", data.token);
        localStorage.setItem("portalUser", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);
        setNotice("Welcome, " + data.user.fullName + "!");
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("portalToken");
    localStorage.removeItem("portalUser");

    setToken("");
    setUser(null);
    setApplications([]);
    setNotifications([]);
    setNotice("You have been logged out.");
  }

  function updateInternshipField(field, value) {
    setInternshipForm(current => ({ ...current, [field]: value }));
  }

  async function createInternship(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      await request("/internships", {
        method: "POST",
        body: JSON.stringify({
          ...internshipForm,
          stipend: Number(internshipForm.stipend),
          skills: internshipForm.skills
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean)
        })
      });

      setNotice("Internship posted successfully.");
      setInternshipForm({
        title: "",
        company: "",
        location: "",
        stipend: "",
        duration: "",
        description: "",
        skills: "",
        applyLink: "",
        deadline: ""
      });
      await loadInternships();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function apply(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      await request("/applications", {
        method: "POST",
        body: JSON.stringify({
          internshipId: selected._id,
          resumeUrl,
          resumeName,
          coverLetter
        })
      });

      setNotice("Application submitted successfully.");
      setResumeUrl("");
      setResumeName("");
      setCoverLetter("");

      await loadDashboard();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setNotice(
        "Application status updated. The student has been notified."
      );

      await loadDashboard();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function markRead(id) {
    try {
      await request(`/notifications/${id}/read`, {
        method: "PATCH",
        body: "{}"
      });

      await loadDashboard();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const filtered = internships.filter(job =>
    [
      job.title,
      job.company,
      job.location,
      ...(job.skills || [])
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">YOUR CAREER STARTS HERE</p>
          <h1>Online Internship Portal</h1>
          <p>
            Discover opportunities, apply, and track every application.
          </p>

          <div className="portal-account">
            {user ? (
              <>
                <span>
                  Signed in as <b>{user.fullName}</b> ({user.role})
                </span>
                <button onClick={logout}>Log out</button>
              </>
            ) : (
              <span>Sign in to apply and manage applications</span>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        {notice && (
          <p className="feedback-message" role="status">
            {notice}
          </p>
        )}

        {!user && (
          <section className="details-panel auth-panel">
            <h2>
              {authMode === "login" ? "Sign in" : "Create an account"}
            </h2>

            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <>
                  <label>Account type</label>
                  <select
                    value={authRole}
                    onChange={e => setAuthRole(e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="recruiter">Recruiter</option>
                  </select>

                  <label>Full name</label>
                  <input
                    required
                    value={auth.fullName}
                    onChange={e =>
                      setAuth({ ...auth, fullName: e.target.value })
                    }
                  />
                </>
              )}

              <label>Email</label>
              <input
                type="email"
                required
                value={auth.email}
                onChange={e =>
                  setAuth({ ...auth, email: e.target.value })
                }
              />

              {authMode === "register" && authRole === "student" && (
                <>
                  <label>SRN</label>
                  <input
                    required
                    value={auth.srn}
                    onChange={e =>
                      setAuth({ ...auth, srn: e.target.value })
                    }
                  />
                </>
              )}

              <label>Password</label>
              <input
                type="password"
                minLength="8"
                required
                value={auth.password}
                onChange={e =>
                  setAuth({ ...auth, password: e.target.value })
                }
              />

              <button className="apply-button" disabled={busy}>
                {busy
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign in"
                    : "Register"}
              </button>
            </form>

            <button
              className="details-button"
              onClick={() =>
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                )
              }
            >
              {authMode === "login"
                ? "New here? Register"
                : "Already registered? Sign in"}
            </button>

            <p className="form-note">
              Students can register using any valid email address.
              Email verification is not required.
              Recruiter accounts require admin approval.
            </p>
          </section>
        )}

        <section className="section-heading">
          <div>
            <h2>Explore Internships</h2>
            <p>
              Search available roles and select one to view details.
            </p>
          </div>
          <span className="result-count">
            {filtered.length} opportunities
          </span>
        </section>

        <section className="filters">
          <input
            type="search"
            placeholder="Search role, company, location or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </section>

        <section className="internship-list">
          {filtered.map(job => (
            <article
              className={
                selected?._id === job._id
                  ? "internship-card selected-card"
                  : "internship-card"
              }
              key={job._id}
            >
              <div className="card-top">
                <div className="company-icon">
                  {job.company?.[0] || "I"}
                </div>
                <span className="location-tag">{job.location}</span>
              </div>

              <h3>{job.title}</h3>
              <p className="company-name">{job.company}</p>

              <div className="job-meta">
                <span>
                  ₹{Number(job.stipend || 0).toLocaleString("en-IN")}/month
                </span>
                <span>{job.duration}</span>
              </div>

              <div className="skill-list">
                {(job.skills || []).map(skill => (
                  <span className="skill-tag" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>

              <button
                className="details-button"
                onClick={() => setSelected(job)}
              >
                View details / Apply
              </button>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state">
              No internships match your search.
            </div>
          )}
        </section>

        {(user?.role === "recruiter" || user?.role === "admin") && (
          <section className="details-panel">
            <p className="eyebrow">RECRUITER DASHBOARD</p>
            <h2>Post a New Internship</h2>
            <form onSubmit={createInternship}>
              <label>Internship title</label>
              <input required value={internshipForm.title} onChange={e => updateInternshipField("title", e.target.value)} placeholder="e.g. Python Developer Intern" />

              <label>Company</label>
              <input required value={internshipForm.company} onChange={e => updateInternshipField("company", e.target.value)} placeholder="Company name" />

              <label>Location</label>
              <input required value={internshipForm.location} onChange={e => updateInternshipField("location", e.target.value)} placeholder="e.g. Bengaluru / Remote" />

              <label>Monthly stipend (₹)</label>
              <input required type="number" min="0" value={internshipForm.stipend} onChange={e => updateInternshipField("stipend", e.target.value)} />

              <label>Duration</label>
              <input required value={internshipForm.duration} onChange={e => updateInternshipField("duration", e.target.value)} placeholder="e.g. 3 months" />

              <label>Description</label>
              <textarea required rows="4" value={internshipForm.description} onChange={e => updateInternshipField("description", e.target.value)} placeholder="Describe the internship responsibilities..." />

              <label>Skills (comma-separated)</label>
              <input value={internshipForm.skills} onChange={e => updateInternshipField("skills", e.target.value)} placeholder="Python, SQL, React" />

              <label>Application link (optional)</label>
              <input type="url" value={internshipForm.applyLink} onChange={e => updateInternshipField("applyLink", e.target.value)} placeholder="https://..." />

              <label>Application deadline (optional)</label>
              <input type="date" value={internshipForm.deadline} onChange={e => updateInternshipField("deadline", e.target.value)} />

              <button className="apply-button" disabled={busy}>
                {busy ? "Posting..." : "Post Internship"}
              </button>
            </form>
          </section>
        )}

        {selected && (
          <section className="details-panel">
            <p className="eyebrow">INTERNSHIP DETAILS</p>
            <h2>{selected.title}</h2>
            <p className="company-name">{selected.company}</p>

            <p>
              <b>Location:</b> {selected.location} ·
              <b> Stipend:</b> ₹{selected.stipend}/month ·
              <b> Duration:</b> {selected.duration}
            </p>

            <p>{selected.description}</p>

            <p>
              <b>Skills:</b>{" "}
              {(selected.skills || []).join(", ") || "Not specified"}
            </p>

            {user?.role === "student" && (
              <>
                <hr />
                <h3>Submit your application</h3>

                <form onSubmit={apply}>
                  <label>Resume link (Google Drive / portfolio URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                  />

                  <label>Resume file name</label>
                  <input
                    required
                    placeholder="MyResume.pdf"
                    value={resumeName}
                    onChange={e => setResumeName(e.target.value)}
                  />

                  <label>Cover letter (optional)</label>
                  <textarea
                    rows="4"
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                  />

                  <button className="apply-button" disabled={busy}>
                    Submit application
                  </button>
                </form>
              </>
            )}

            {!user && (
              <p className="form-note">
                Sign in as a student to apply.
              </p>
            )}
          </section>
        )}

        {user?.role === "student" && (
          <section className="applications-section">
            <div className="section-heading">
              <div>
                <h2>My Applications</h2>
                <p>Your latest saved application statuses.</p>
              </div>
              <span className="result-count">
                {applications.length} submitted
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="empty-state">
                <h3>No applications yet</h3>
                <p>
                  Choose an internship and submit an application.
                </p>
              </div>
            ) : (
              <div className="application-list">
                {applications.map(app => (
                  <article className="application-card" key={app._id}>
                    <div className="application-card-heading">
                      <div>
                        <h3>{app.internship?.title}</h3>
                        <p className="company-name">
                          {app.internship?.company}
                        </p>
                      </div>

                      <span
                        className={`status-badge status-${app.status.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p>
                      <b>Applied:</b>{" "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>

                    <p>
                      <b>Resume:</b>{" "}
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {app.resumeName} (open)
                      </a>
                    </p>

                    {app.coverLetter && (
                      <p>
                        <b>Cover letter:</b> {app.coverLetter}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <h2>Notifications</h2>

            {notifications.length === 0 ? (
              <p>No status notifications yet.</p>
            ) : (
              notifications.map(item => (
                <article className="application-card" key={item._id}>
                  <p>{item.message}</p>
                  <small>
                    {new Date(item.createdAt).toLocaleString()}
                  </small>

                  {!item.read && (
                    <button
                      className="details-button"
                      onClick={() => markRead(item._id)}
                    >
                      Mark as read
                    </button>
                  )}
                </article>
              ))
            )}
          </section>
        )}

        {(user?.role === "recruiter" || user?.role === "admin") && (
          <section className="applications-section">
            <div className="section-heading">
              <div>
                <h2>Applications for my internships</h2>
                <p>
                  Review candidate details and update selection status.
                </p>
              </div>

              <span className="result-count">
                {applications.length} applications
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="empty-state">
                <p>
                  No applications have been received for your internships.
                </p>
              </div>
            ) : (
              <div className="application-list">
                {applications.map(app => (
                  <article className="application-card" key={app._id}>
                    <div className="application-card-heading">
                      <div>
                        <h3>{app.student?.fullName}</h3>
                        <p>
                          {app.student?.email} ·{" "}
                          {app.student?.srn || "No SRN"}
                        </p>
                        <b>
                          {app.internship?.title} —{" "}
                          {app.internship?.company}
                        </b>
                      </div>

                      <span
                        className={`status-badge status-${app.status.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p>
                      <b>Resume:</b>{" "}
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {app.resumeName} (open)
                      </a>
                    </p>

                    {app.coverLetter && (
                      <p>
                        <b>Cover letter:</b> {app.coverLetter}
                      </p>
                    )}

                    <label htmlFor={`status-${app._id}`}>
                      Update status
                    </label>

                    <select
                      id={`status-${app._id}`}
                      value={app.status}
                      onChange={e =>
                        updateStatus(app._id, e.target.value)
                      }
                    >
                      {STATUSES.map(status => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Online Internship &amp; Placement Preparation Portal · Team 12
        </p>
        <p>Internship Listings &amp; Applications Module</p>
      </footer>
    </div>
  );
}

export default App;

