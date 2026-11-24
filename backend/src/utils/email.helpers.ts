
import type { SendMailOptions } from "nodemailer";

import transporter from "../config/email";

// ==========================================
// EMAIL SENDING HELPER
// ==========================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<string> => {
  try {
    const mailOptions: SendMailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[EMAIL] Email sent successfully to ${to}`
    );

    return info.messageId;
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);

    throw new Error("Failed to send email.");
  }
};
