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
  if (!["gmail", "mock"].includes(mode)) throw new Error("EMAIL_MODE must be either 'gmail' or 'mock'.");
  if (mode === "mock" && process.env.NODE_ENV === "production") {
    throw new Error("Mock email mode is unavailable when NODE_ENV is production.");
  }
  return mode;
};

const createTransporter = (user, pass) => {
  if (!user || !pass) throw new Error("Email service is not configured");
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass }
    });
  }
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
};

const fromAddress = primaryUser => process.env.EMAIL_FROM || primaryUser;

const sendWithFallback = async mailOptions => {
  if (getEmailMode() === "mock") return mockTransporter.sendMail(mailOptions);

  try {
    return await createTransporter(process.env.EMAIL_USER, process.env.EMAIL_APP_PASSWORD).sendMail(mailOptions);
  } catch (primaryError) {
    if (!process.env.EMAIL_USER_2 || !process.env.EMAIL_APP_PASSWORD_2) throw primaryError;
    const secondaryOptions = {
      ...mailOptions,
      from: `"Internship Placement Portal" <${fromAddress(process.env.EMAIL_USER_2)}>`
    };
    return createTransporter(process.env.EMAIL_USER_2, process.env.EMAIL_APP_PASSWORD_2).sendMail(secondaryOptions);
  }
};

const sendVerificationEmail = async (email, token) => {
  const baseUrl = (process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
  const verificationLink = `${baseUrl}/api/auth/verify-email/${encodeURIComponent(token)}`;
  return sendWithFallback({
    from: `"Internship Placement Portal" <${fromAddress(process.env.EMAIL_USER)}>`,
    to: email,
    subject: "Verify Your Internship Portal Account",
    html: `
      <h2>Welcome to Internship Placement Portal!</h2>
      <p>Thank you for registering.</p>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify My Email</a>
      <p>This verification link expires in 10 minutes.</p>
      <p>If you did not create this account, please ignore this message.</p>
    `
  });
};

const sendPasswordResetEmail = async (email, otp) => {
  return sendWithFallback({
    from: `"Internship Placement Portal" <${fromAddress(process.env.EMAIL_USER)}>`,
    to: email,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this message.`,
    html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, ignore this message.</p>`
  });
};

const sendApplicationStatusEmail = async (email, studentName, internshipTitle, status) => {
  if (!email) throw new Error("Student email address is missing.");
  const safe = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  return sendWithFallback({
    from: `"Internship Placement Portal" <${fromAddress(process.env.EMAIL_USER)}>`,
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
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  getCapturedEmails,
  clearCapturedEmails
};
