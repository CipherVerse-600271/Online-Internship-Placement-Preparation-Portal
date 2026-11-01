
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Send student email verification link
const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `http://localhost:5000/api/auth/verify-email/${token}`;

  // Development-only verification link for local testing
  if (process.env.NODE_ENV === "development") {
    console.log("\n========== EMAIL VERIFICATION ==========");
    console.log("Recipient:", email);
    console.log("Verification link:", verificationLink);
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

  console.log("Attempting to send verification email to:", email);

  const info = await transporter.sendMail(mailOptions);

  console.log("Email sending response:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response
  });

  return info;
};

module.exports = { sendVerificationEmail };
