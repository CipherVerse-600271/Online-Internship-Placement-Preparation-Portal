
const nodemailer = require("nodemailer");
const { randomUUID } = require("crypto");

const mockMailbox = [];

const mockTransporter = {
  async sendMail(mailOptions) {
    const captured = {
      ...mailOptions,
      messageId: `mock-${randomUUID()}`,
      capturedAt: new Date().toISOString()
    };
    mockMailbox.push(captured);
    console.log("Mock email captured locally.");

    return {
      messageId: captured.messageId,
      accepted: [mailOptions.to],
      rejected: [],
      response: "250 Mock email captured locally"
    };
  }
};

const getCapturedEmails = () => JSON.parse(JSON.stringify(mockMailbox));
const clearCapturedEmails = () => mockMailbox.splice(0, mockMailbox.length);

const getEmailMode = () => {
  const mode = String(process.env.EMAIL_MODE || "gmail").trim().toLowerCase();
  if (!["gmail", "mock"].includes(mode)) {
    throw new Error("EMAIL_MODE must be either 'gmail' or 'mock'.");
  }
  if (mode === "mock" && process.env.NODE_ENV === "production") {
    throw new Error("Mock email mode is unavailable when NODE_ENV is production.");
  }
  return mode;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

const secondaryTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER_2,
    pass: process.env.EMAIL_APP_PASSWORD_2
  }
});

const sendWithFallback = async mailOptions => {
  if (getEmailMode() === "mock") {
    return mockTransporter.sendMail(mailOptions);
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent using primary Gmail:", info.messageId);
    return info;
  } catch (primaryError) {
    console.error("Primary Gmail failed:", primaryError.message);
    const secondaryOptions = {
      ...mailOptions,
      from: `"Internship Placement Portal" <${process.env.EMAIL_USER_2}>`
    };
    const info = await secondaryTransporter.sendMail(secondaryOptions);
    console.log("Email sent using secondary Gmail:", info.messageId);
    return info;
  }
};

// Send student email verification link
const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `http://localhost:5000/api/auth/verify-email/${token}`;

  // Development-only verification link for local testing
  if (process.env.NODE_ENV === "development") {
    console.log("\n========== EMAIL VERIFICATION ==========");
    console.log("========================================\n");
  }

  const mailOptions = {
    from: `"Internship Placement Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Internship Portal Account",
    html: `
      <h2>Welcome to Internship Placement Portal!</h2>
      <p>Thank you for registering.</p>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify My Email</a>
      <p>This verification link expires in 10 minutes.</p>
      <p>If you did not create this account, please ignore this email.</p>
    `
  };

  console.log("Attempting to send verification email.");

  return sendWithFallback(mailOptions);
};

// Send an email when a recruiter changes a student's application status.
const sendApplicationStatusEmail = async (email, studentName, internshipTitle, status) => {
  if (!email) throw new Error("Student email address is missing.");

  const safe = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  const mailOptions = {
    from: `"Internship Placement Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Application update: ${status}`,
    text: `Hello ${studentName || "Student"}, your application for ${internshipTitle} has been updated to: ${status}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #243247;">
        <h2>Application Status Update</h2>
        <p>Hello ${safe(studentName || "Student")},</p>
        <p>Your application for <strong>${safe(internshipTitle)}</strong> has been updated.</p>
        <p>New status: <strong>${safe(status)}</strong></p>
        <p>Sign in to the Online Internship &amp; Placement Preparation Portal to view your application.</p>
        <p>Regards,<br/>Internship Placement Portal Team</p>
      </div>
    `
  };

  const info = await sendWithFallback(mailOptions);
  console.log("Application status email sent:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected
  });
  return info;
};

module.exports = {
  sendVerificationEmail,
  sendApplicationStatusEmail,
  getCapturedEmails,
  clearCapturedEmails
};
