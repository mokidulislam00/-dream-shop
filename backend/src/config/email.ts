
import nodemailer from "nodemailer";

// ==========================================
// EMAIL TRANSPORTER CONFIGURATION
// ==========================================

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailPassword) {
  throw new Error(
    "EMAIL_USER and EMAIL_APP_PASSWORD must be configured."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: emailUser,
    pass: emailPassword.replace(/\s/g, ""),
  },
});

// ==========================================
// VERIFY EMAIL CONNECTION
// ==========================================

export const verifyEmailConnection = async (): Promise<void> => {
  try {
    await transporter.verify();

    console.log("[EMAIL] Gmail SMTP connected successfully");
  } catch (error) {
    console.error("[EMAIL] Gmail SMTP connection failed:", error);
    throw error;
  }
};

export default transporter;
