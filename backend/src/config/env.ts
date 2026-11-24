
const validateEnv = (): void => {
  const errors: string[] = [];

  // ==========================================
  // REQUIRED ENVIRONMENT VARIABLES
  // ==========================================

  const requiredVariables = [
    "MONGODB_URI",
    "JWT_SECRET",
    "BREVO_API_KEY",
    "EMAIL_FROM",
  ] as const;

  for (const variable of requiredVariables) {
    if (!process.env[variable]?.trim()) {
      errors.push(`${variable} is required`);
    }
  }

  // ==========================================
  // JWT SECRET VALIDATION
  // ==========================================

  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (
    process.env.NODE_ENV === "production" &&
    jwtSecret &&
    jwtSecret.length < 32
  ) {
    errors.push(
      "JWT_SECRET must be at least 32 characters in production"
    );
  }

  // ==========================================
  // BREVO EMAIL CONFIGURATION
  // ==========================================

  const brevoApiKey = process.env.BREVO_API_KEY?.trim();

  if (brevoApiKey && brevoApiKey.length < 20) {
    errors.push("BREVO_API_KEY does not appear to be valid");
  }

  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (emailFrom) {
    const displayNameMatch =
      /^(.*?)\s*<\s*([^<>]+)\s*>$/.exec(emailFrom);

    const senderEmail = (
      displayNameMatch?.[2] ?? emailFrom
    ).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      errors.push(
        "EMAIL_FROM must be a valid email address or a name followed by <email@domain.com>"
      );
    }
  }

  // ==========================================
  // MONGODB URI VALIDATION
  // ==========================================

  const mongoURI = process.env.MONGODB_URI?.trim();

  if (mongoURI) {
    try {
      const parsedURI = new URL(mongoURI);

      if (
        parsedURI.protocol !== "mongodb:" &&
        parsedURI.protocol !== "mongodb+srv:"
      ) {
        errors.push(
          "MONGODB_URI must use mongodb:// or mongodb+srv://"
        );
      }

      if (!parsedURI.hostname) {
        errors.push("MONGODB_URI must contain a valid hostname");
      }
    } catch {
      errors.push("MONGODB_URI is not a valid URL");
    }
  }

  // ==========================================
  // FRONTEND URL VALIDATION
  // Supports multiple comma-separated URLs
  // ==========================================

  const frontendURL = process.env.FRONTEND_URL?.trim();

  if (frontendURL) {
    const frontendURLs = frontendURL
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    if (frontendURLs.length === 0) {
      errors.push(
        "FRONTEND_URL must contain at least one valid URL"
      );
    }

    for (const url of frontendURLs) {
      try {
        const parsedURL = new URL(url);

        if (
          parsedURL.protocol !== "http:" &&
          parsedURL.protocol !== "https:"
        ) {
          errors.push(`Invalid frontend URL protocol: ${url}`);
          continue;
        }

        if (
          parsedURL.username ||
          parsedURL.password ||
          parsedURL.pathname !== "/" ||
          parsedURL.search ||
          parsedURL.hash
        ) {
          errors.push(
            `FRONTEND_URL must contain only an origin: ${url}`
          );
        }

        if (
          process.env.NODE_ENV === "production" &&
          parsedURL.protocol !== "https:"
        ) {
          errors.push(
            `Production frontend URLs must use HTTPS: ${url}`
          );
        }
      } catch {
        errors.push(`Invalid FRONTEND_URL: ${url}`);
      }
    }
  }

  // ==========================================
  // PORT VALIDATION
  // ==========================================

  const port = process.env.PORT?.trim();

  if (port) {
    const parsedPort = Number(port);

    if (
      !Number.isInteger(parsedPort) ||
      parsedPort < 1 ||
      parsedPort > 65535
    ) {
      errors.push(
        "PORT must be a valid number between 1 and 65535"
      );
    }
  }

  // ==========================================
  // NODE_ENV VALIDATION
  // ==========================================

  const nodeEnv = process.env.NODE_ENV?.trim();

  const allowedEnvironments = [
    "development",
    "production",
    "test",
  ];

  if (nodeEnv && !allowedEnvironments.includes(nodeEnv)) {
    errors.push(
      "NODE_ENV must be development, production, or test"
    );
  }

  // ==========================================
  // PRODUCTION VALIDATION
  // ==========================================

  if (nodeEnv === "production" && !frontendURL) {
    errors.push("FRONTEND_URL is required in production");
  }

  // ==========================================
  // FINAL VALIDATION RESULT
  // ==========================================

  if (errors.length > 0) {
    console.error("\n========================================");
    console.error("Environment validation failed:");
    console.error("========================================");

    errors.forEach((error) => {
      console.error(`- ${error}`);
    });

    console.error("========================================\n");

    throw new Error("Invalid environment configuration");
  }

  console.log("[ENV] Environment validation successful");
};

export default validateEnv;
