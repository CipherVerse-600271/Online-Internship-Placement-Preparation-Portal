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

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
