
import { useEffect, useState } from "react";
import AptitudeProgress from "./AptitudeProgress";
import "./App.css";

const API_URL = "http://localhost:5000/api/internships";

function App() {
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [minStipend, setMinStipend] = useState("All");
  const [duration, setDuration] = useState("All");

  const [applications, setApplications] = useState([]);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState("");

  // Load internships from the backend
  useEffect(() => {
    async function fetchInternships() {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to fetch internships.");
        }

        const data = await response.json();

        const formattedInternships = data.map((job) => ({
          ...job,
          id: job._id,
          skills: Array.isArray(job.skills) ? job.skills : [],
          eligibility:
            job.eligibility ||
            "Please check the required skills and internship description.",
        }));

        setInternships(formattedInternships);
        setSelectedInternship(formattedInternships[0] || null);
      } catch (error) {
        console.error("Error loading internships:", error);
        setApiError(
          "Could not load internships. Please make sure your backend and MongoDB are running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInternships();
  }, []);

  // Filter internships using search and filter selections
  const filteredInternships = internships.filter((job) => {
    const searchText = search.toLowerCase().trim();

    const searchableText = [
      job.title,
      job.company,
      job.location,
      job.duration,
      ...job.skills,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchText);

    const matchesLocation =
      location === "All" || job.location === location;

    const matchesStipend =
      minStipend === "All" ||
      Number(job.stipend) >= Number(minStipend);

    const matchesDuration =
      duration === "All" || job.duration === duration;

    return (
      matchesSearch &&
      matchesLocation &&
      matchesStipend &&
      matchesDuration
    );
  });

  // Submit a demo application
  function handleApply(event) {
    event.preventDefault();

    if (!selectedInternship) {
      setMessage("Please select an internship first.");
      return;
    }

    const alreadyApplied = applications.some(
      (application) =>
        application.internshipId === selectedInternship.id
    );

    if (alreadyApplied) {
      setMessage("You have already applied for this internship.");
      return;
    }

    if (!resume) {
      setMessage("Please select your resume before applying.");
      return;
    }

    const newApplication = {
      applicationId: `${selectedInternship.id}-${Date.now()}`,
      internshipId: selectedInternship.id,
      title: selectedInternship.title,
      company: selectedInternship.company,
      appliedAt: new Date().toLocaleDateString(),
      status: "Pending",
      resumeName: resume.name,
      coverLetter: coverLetter.trim(),
    };

    setApplications((previous) => [...previous, newApplication]);

    setMessage(
      `Your application for ${selectedInternship.title} was submitted in this demo.`
    );

    setResume(null);
    setCoverLetter("");
    event.target.reset();
  }

  // Update demo application status
  function updateApplicationStatus(applicationId, newStatus) {
    setApplications((previous) =>
      previous.map((application) =>
        application.applicationId === applicationId
          ? { ...application, status: newStatus }
          : application
      )
    );
  }

  function resetFilters() {
    setSearch("");
    setLocation("All");
    setMinStipend("All");
    setDuration("All");
  }

  const pendingCount = applications.filter(
    (application) => application.status === "Pending"
  ).length;

  const shortlistedCount = applications.filter(
    (application) => application.status === "Shortlisted"
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === "Rejected"
  ).length;

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">YOUR CAREER STARTS HERE</p>
          <h1>Online Internship Portal</h1>
          <p>
            Discover internships, explore opportunities, and take
            the next step in your career.
          </p>
        </div>
      </header>

      <main className="container">
        <section className="section-heading">
          <div>
            <h2>Explore Internships</h2>
            <p>Find opportunities that match your skills and interests.</p>
          </div>

          <span className="result-count">
            {loading ? "Loading..." : `${filteredInternships.length} opportunities`}
          </span>
        </section>

        <section className="filters">
          <input
            type="search"
            placeholder="Search role, company, or skill..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search internships"
          />

          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            aria-label="Filter by location"
          >
            <option value="All">All locations</option>
            <option value="Remote">Remote</option>
            <option value="Chennai">Chennai</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>

          <select
            value={minStipend}
            onChange={(event) => setMinStipend(event.target.value)}
            aria-label="Filter by minimum monthly stipend"
          >
            <option value="All">Any stipend</option>
            <option value="5000">₹5,000+/month</option>
            <option value="10000">₹10,000+/month</option>
            <option value="12000">₹12,000+/month</option>
          </select>

          <select
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            aria-label="Filter by duration"
          >
            <option value="All">Any duration</option>
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
          </select>

          <button
            type="button"
            className="reset-button"
            onClick={resetFilters}
          >
            Reset
          </button>
        </section>

        {loading && (
          <p role="status">Loading internships from the database...</p>
        )}

        {apiError && (
          <div className="empty-state" role="alert">
            <h3>Unable to load internships</h3>
            <p>{apiError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !apiError && (
          <section className="internship-list">
            {filteredInternships.length === 0 ? (
              <div className="empty-state">
                <h3>
                  {internships.length === 0
                    ? "No internships available yet"
                    : "No internships found"}
                </h3>
                <p>
                  {internships.length === 0
                    ? "Internships added to the database will appear here."
                    : "Try changing your search or filters."}
                </p>

                {internships.length > 0 && (
                  <button type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredInternships.map((job) => {
                const hasApplied = applications.some(
                  (application) => application.internshipId === job.id
                );

                return (
                  <article
                    className={`internship-card ${
                      selectedInternship?.id === job.id
                        ? "selected-card"
                        : ""
                    }`}
                    key={job.id}
                  >
                    <div className="card-top">
                      <div className="company-icon">
                        {job.company?.charAt(0) || "I"}
                      </div>
                      <span className="location-tag">{job.location}</span>
                    </div>

                    <h3>{job.title}</h3>
                    <p className="company-name">{job.company}</p>

                    <div className="job-meta">
                      <span>
                        ₹{Number(job.stipend || 0).toLocaleString("en-IN")}
                        /month
                      </span>
                      <span>{job.duration}</span>
                    </div>

                    <div className="skill-list">
                      {job.skills.map((skill) => (
                        <span className="skill-tag" key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        className="details-button"
                        onClick={() => {
                          setSelectedInternship(job);
                          setMessage("");
                          setResume(null);
                          setCoverLetter("");
                        }}
                      >
                        View details
                      </button>

                      <span
                        className={
                          hasApplied ? "applied-label" : "available-label"
                        }
                      >
                        {hasApplied ? "Applied" : "Open"}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {selectedInternship && (
          <section className="details-panel">
            <p className="eyebrow">INTERNSHIP DETAILS</p>
            <h2>{selectedInternship.title}</h2>
            <p className="company-name">{selectedInternship.company}</p>

            <div className="detail-facts">
              <p>
                <strong>Location:</strong> {selectedInternship.location}
              </p>
              <p>
                <strong>Monthly stipend:</strong> ₹
                {Number(selectedInternship.stipend || 0).toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Duration:</strong> {selectedInternship.duration}
              </p>
              {selectedInternship.deadline && (
                <p>
                  <strong>Application deadline:</strong>{" "}
                  {new Date(selectedInternship.deadline).toLocaleDateString()}
                </p>
              )}
            </div>

            <h3>About this internship</h3>
            <p>{selectedInternship.description}</p>

            <h3>Eligibility</h3>
            <p>{selectedInternship.eligibility}</p>

            <h3>Required skills</h3>
            <div className="skill-list">
              {selectedInternship.skills.map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>

            {selectedInternship.applyLink && (
              <p>
                <strong>Application link:</strong>{" "}
                <a
                  href={selectedInternship.applyLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apply on company website
                </a>
              </p>
            )}

            <hr />

            <h3>Apply for this internship</h3>
            <p className="form-note">
              Select a resume and optionally write a cover letter.
            </p>

            <form onSubmit={handleApply}>
              <label htmlFor="resume">Resume (PDF, DOC, or DOCX)</label>
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  setResume(event.target.files?.[0] || null)
                }
                required
              />

              {resume && (
                <p className="file-name">Selected: {resume.name}</p>
              )}

              <label htmlFor="coverLetter">Cover letter (optional)</label>
              <textarea
                id="coverLetter"
                rows="4"
                placeholder="Tell the recruiter why you're a good fit..."
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
              />

              <button
                className="apply-button"
                type="submit"
                disabled={applications.some(
                  (application) =>
                    application.internshipId === selectedInternship.id
                )}
              >
                {applications.some(
                  (application) =>
                    application.internshipId === selectedInternship.id
                )
                  ? "Already Applied"
                  : "Submit Application"}
              </button>
            </form>

            {message && (
              <p className="feedback-message" role="status">
                {message}
              </p>
            )}

            <p className="demo-note">
              Demo only: applications are held temporarily in page state.
              The resume is selected locally and is not uploaded to the server.
            </p>
          </section>
        )}

        <section className="applications-section">
          <div className="section-heading">
            <div>
              <h2>My Applications</h2>
              <p>Track the status of your submitted applications.</p>
            </div>
            <span className="result-count">
              {applications.length} submitted
            </span>
          </div>

          <div className="status-summary">
            <div className="status-summary-card">
              <span>Total</span>
              <strong>{applications.length}</strong>
            </div>
            <div className="status-summary-card">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>
            <div className="status-summary-card">
              <span>Shortlisted</span>
              <strong>{shortlistedCount}</strong>
            </div>
            <div className="status-summary-card">
              <span>Rejected</span>
              <strong>{rejectedCount}</strong>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications yet</h3>
              <p>
                Choose an internship above and submit your first application.
              </p>
            </div>
          ) : (
            <div className="application-list">
              {applications.map((application) => (
                <article
                  className="application-card"
                  key={application.applicationId}
                >
                  <div className="application-card-heading">
                    <div>
                      <h3>{application.title}</h3>
                      <p className="company-name">{application.company}</p>
                    </div>
                    <span
                      className={`status-badge status-${application.status.toLowerCase()}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <p>
                    <strong>Applied on:</strong> {application.appliedAt}
                  </p>
                  <p className="file-name">
                    <strong>Resume:</strong> {application.resumeName}
                  </p>

                  {application.coverLetter && (
                    <p>
                      <strong>Cover letter:</strong> {application.coverLetter}
                    </p>
                  )}

                  <label htmlFor={`status-${application.applicationId}`}>
                    Demo: Change application status
                  </label>
                  <select
                    id={`status-${application.applicationId}`}
                    value={application.status}
                    onChange={(event) =>
                      updateApplicationStatus(
                        application.applicationId,
                        event.target.value
                      )
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </article>
              ))}
            </div>
          )}

          <p className="demo-note">
            Status changes are for demonstration only. In the complete system,
            recruiters would update statuses through the backend.
          </p>
        </section>
        <AptitudeProgress />
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
