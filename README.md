# Online-Internship-Placement-Preparation-Portal
SE-Miniproject team-12
The portal enables students to discover and apply for internships, prepare through aptitude tests, and track their application progress. Recruiters can post internship openings and manage applicants, while admins verify recruiters, manage listings, and monitor placement analytics, system covers internship listings, aptitude tests, progress tracking

# Online Internship & Placement Preparation Portal

A web-based platform designed to help students discover internship opportunities, prepare for placement assessments, track applications, and monitor their placement readiness. The portal also enables recruiters to manage internship listings and applications, while administrators oversee platform activities.

## Project Overview

The Online Internship & Placement Preparation Portal aims to bring internship discovery, application management, aptitude preparation, and placement analytics into one centralized platform.

The system is designed for three primary user roles:

- **Students:** Register, explore internships, apply for opportunities, take aptitude tests, and track progress.
- **Recruiters:** Register their organizations, create internship listings after verification, review applications, and update application statuses.
- **Administrators:** Verify recruiters, manage listings and accounts, and monitor placement analytics.

## Key Features

### Authentication and Security
- Student registration with college email verification.
- Recruiter registration with administrator verification.
- Secure login using JSON Web Tokens (JWT).
- Password reset using time-limited, single-use OTPs.
- Account lockout after repeated failed login attempts.
- Password hashing using bcrypt.
- Role-based access control for students, recruiters, and administrators.
- Audit logging for authentication and administrative actions.

### Internship Management
- Create and manage internship listings.
- Search and filter internships by skills, location, stipend, and duration.
- View internship descriptions, eligibility requirements, and application deadlines.
- Receive notifications about relevant internship opportunities.

### Application Management
- Submit internship applications with resumes and optional cover letters.
- Track application statuses: Applied, Shortlisted, Rejected, and Selected.
- Allow recruiters to review applications and update statuses.
- Notify students when application statuses change.

### Aptitude Preparation
- Timed quantitative, logical reasoning, and verbal aptitude tests.
- Automatic submission when the test timer expires.
- Automatic grading of objective questions.
- Score and attempt history.

### Dashboards and Analytics
- Student dashboard with applications, test scores, and skill-gap indicators.
- Internship recommendations based on student profiles, skills, and aptitude.
- Administrator analytics for applications, offers, and top hiring companies.

## Technology Stack

The planned technology stack includes:

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcrypt |
| Email Notifications | Node.js email integration |
| Analytics and Scoring | Python |
| Version Control | Git and GitHub |
| CI/CD | GitHub Actions |

*Note: The technologies listed describe the planned system architecture. Features and integrations will be implemented and verified as development progresses.*

## System Architecture

The application follows a client-server architecture.

1. The **React frontend** provides interfaces for students, recruiters, and administrators.
2. The **Express.js backend** handles API requests, authentication, authorization, and business logic.
3. **MongoDB Atlas** stores user accounts, internship listings, applications, test results, and related information.
4. The **email service** supports verification, password resets, and application notifications.
5. The **Python analytics component** supports scoring, placement analytics, and recommendation-related processing.

## Getting Started

### Prerequisites

Install the following tools before running the project:

- Node.js and npm
- Git
- MongoDB Atlas account or an appropriately configured MongoDB instance
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/CipherVerse-600271/Online-Internship-Placement-Preparation-Portal.git
cd Online-Internship-Placement-Preparation-Portal
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install the dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory using the provided `.env.example` file as a template.

Configure the required environment variables, including:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=1d
```

Use the variable names and configuration expected by the current backend implementation. Configure any additional required variables for email integration as that feature is implemented.

**Security note:** Never commit your actual `.env` file, database credentials, email passwords, or JWT secrets to GitHub.

### 3. Start the Backend

Run the development server:

```bash
npm run dev
```

The backend should start on the configured port, which defaults to `5000`.

### 4. Verify the Backend

Open the following URL in your browser:

```text
http://localhost:5000/api/health
```

A healthy backend should return a response similar to:

```json
{
  "status": "OK",
  "message": "Backend server is healthy"
}
```

The frontend, database connection, and other services must be configured separately as their implementation becomes available.

## Security Requirements

The project is designed to follow these security requirements:

- Hash passwords using bcrypt and never store plaintext passwords.
- Use JWT-based authentication and enforce role-based authorization.
- Require recruiter verification before allowing internship listings to be published.
- Implement time-limited, single-use password-reset OTPs.
- Lock accounts after five consecutive failed login attempts for 15 minutes.
- Use HTTPS with TLS 1.2 or higher in deployed environments.
- Protect sensitive configuration using environment variables.
- Log relevant authentication and administrative actions.
- Validate incoming requests and apply appropriate rate limits.

## Development Workflow

The project uses GitHub for version control, issue tracking, code review, and sprint planning.

1. Review the relevant GitHub Issue before starting a task.
2. Create a feature branch for the assigned work.
3. Implement and test the changes.
4. Commit and push the changes to GitHub.
5. Open a Pull Request against the `main` branch.
6. Request review from the repository owner or designated reviewer.
7. Address review feedback and merge only after approval.
8. Update the corresponding issue and project status.

### Branch Naming Convention

Examples:

```text
feature/student-registration
feature/internship-search
feature/aptitude-tests
fix/authentication-validation
```

### Pull Request Guidelines

Every Pull Request should include:

- A clear summary of the changes.
- The related issue number.
- Testing performed and its results.
- Screenshots or a short demonstration when relevant.
- Any known limitations or deviations from the requirements.

## Testing and Quality Assurance

Testing should cover:

- Authentication and authorization.
- Internship listing creation and search.
- Application submission and status updates.
- Aptitude test timing and grading.
- Email notifications.
- Performance, availability, scalability, and accessibility.
- API input validation and security controls.

Automated checks should be configured through GitHub Actions as the project develops. Tests and quality checks must pass before changes are approved for merging.

## Project Planning

The team is organizing work into two development sprints:

- **Sprint 1:** October 19–23, 2026.
- **Sprint 2:** October 26–30, 2026.

Development tasks are tracked through GitHub Issues. The team will use story-point estimates, assignees, sprint assignments, Pull Requests, and demonstrations to monitor progress.

## Repository Structure

The backend foundation currently includes the following structure:

```text
Online-Internship-Placement-Preparation-Portal/
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

Additional frontend, testing, documentation, and deployment directories may be added as implementation progresses.

## Team Contributions

The team collaborates through GitHub Issues, feature branches, Pull Requests, code reviews, and sprint planning. Individual responsibilities and progress are maintained through the project's issue tracker and project board.

## Future Enhancements

Potential future enhancements include:

- Personalized internship recommendations.
- Improved placement-readiness analytics.
- Expanded aptitude question banks.
- Accessibility improvements across all interfaces.
- Enhanced reporting for recruiters and administrators.
- Automated testing and deployment pipelines.

## License

No license has been specified yet. Usage and redistribution terms should be added once the project team selects an appropriate license.

---

**Online Internship & Placement Preparation Portal**  
*Connecting students, recruiters, and placement preparation in one platform.*
