
import { getBrevoEmailConfig } from "../config/email";

// ==========================================
// EMAIL SENDING HELPER
// ==========================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface BrevoSendResponse {
  messageId?: unknown;
  code?: unknown;
  message?: unknown;
}

const BREVO_SEND_EMAIL_URL =
  "https://api.brevo.com/v3/smtp/email";

const REQUEST_TIMEOUT_MS = 20_000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getApiErrorMessage = (payload: unknown): string => {
  if (typeof payload !== "object" || payload === null) {
    return "Unknown Brevo API error";
  }

  const body = payload as BrevoSendResponse;

  const code =
    typeof body.code === "string" ? body.code : undefined;

  const message =
    typeof body.message === "string" ? body.message : undefined;

  return (
    [code, message].filter(Boolean).join(": ") ||
    "Unknown Brevo API error"
  );
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<string> => {
  try {
    const recipient = to.trim();

    if (!EMAIL_REGEX.test(recipient)) {
      throw new Error("Invalid recipient email address");
    }

    if (!subject.trim()) {
      throw new Error("Email subject cannot be empty");
    }

    if (!html.trim()) {
      throw new Error("Email HTML content cannot be empty");
    }

    const { apiKey, sender } = getBrevoEmailConfig();

    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: "POST",

      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },

      body: JSON.stringify({
        sender,
        to: [{ email: recipient }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
      }),

      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const responseText = await response.text();

    let responseBody: BrevoSendResponse = {};

    if (responseText) {
      try {
        responseBody = JSON.parse(
          responseText
        ) as BrevoSendResponse;
      } catch {
        responseBody = {};
      }
    }

    if (!response.ok) {
      const apiError = getApiErrorMessage(responseBody);

      console.error(
        `[EMAIL] Brevo API failed (HTTP ${response.status}): ${apiError}`
      );

      throw new Error(
        `Brevo API request failed with HTTP ${response.status}: ${apiError}`
      );
    }

    if (
      typeof responseBody.messageId !== "string" ||
      !responseBody.messageId.trim()
    ) {
      throw new Error(
        "Brevo API did not return a valid message ID"
      );
    }

    console.log(
      `[EMAIL] Email accepted by Brevo for ${recipient}`
    );

    return responseBody.messageId;
  } catch (error) {
    console.error(
      "[EMAIL] Failed to send email through Brevo:",
      error
    );

    throw error;
  }
};
