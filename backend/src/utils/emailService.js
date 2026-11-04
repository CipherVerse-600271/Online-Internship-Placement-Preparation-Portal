const nodemailer = require("nodemailer");

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) throw new Error("Email service is not configured");
  return nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD } });
};

// Send student email verification link
const sendVerificationEmail = async (email, token) => {
  const baseUrl = (process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
  const verificationLink = `${baseUrl}/api/auth/verify-email/${encodeURIComponent(token)}`;

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
  return getTransporter().sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, otp) => {
  return getTransporter().sendMail({
    from: `"Internship Placement Portal" <${process.env.EMAIL_USER}>`, to: email,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this message.`,
    html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, ignore this message.</p>`
  });
};

// Send an email when a recruiter changes a student's application status.
const sendApplicationStatusEmail = async (email, studentName, internshipTitle, status) => {
  if (!email) throw new Error("Student email address is missing.");

  const safe = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
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

  return getTransporter().sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendApplicationStatusEmail };
