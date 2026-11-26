
// ==========================================
// BREVO TRANSACTIONAL EMAIL CONFIGURATION
// ==========================================

export interface BrevoEmailConfig {
  apiKey: string;
  sender: {
    name: string;
    email: string;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reads and validates the Brevo API credentials and sender information.
 *
 * EMAIL_FROM accepts either:
 * Dream Shop <verified-sender@example.com>
 * or:
 * verified-sender@example.com
 */
export const getBrevoEmailConfig = (): BrevoEmailConfig => {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const configuredFrom = process.env.EMAIL_FROM?.trim();

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  if (!configuredFrom) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const displayNameMatch =
    /^(.*?)\s*<\s*([^<>]+)\s*>$/.exec(configuredFrom);

  const senderEmail = (
    displayNameMatch?.[2] ?? configuredFrom
  ).trim();

  const configuredName = displayNameMatch?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, "");

  const senderName =
    configuredName ||
    process.env.EMAIL_FROM_NAME?.trim() ||
    "Dream Shop";

  if (!EMAIL_REGEX.test(senderEmail)) {
    throw new Error(
      "EMAIL_FROM must be a valid email address or a name followed by <email@domain.com>"
    );
  }

  return {
    apiKey,
    sender: {
      name: senderName,
      email: senderEmail,
    },
  };
};
