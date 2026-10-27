import "server-only";

// Centralised, validated access to environment configuration.
// Secrets are read on the server only and never forwarded to client components.

const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  return value;
}

export const env = {
  isProduction,
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  demoMode: process.env.DEMO_MODE === "true",
  privateStorageDir: process.env.PRIVATE_STORAGE_DIR ?? "./storage/private",
  aiModel: process.env.AI_MODEL || "claude-opus-5-5",

  get downloadSigningSecret() {
    const secret = required("DOWNLOAD_SIGNING_SECRET");
    if (isProduction && (secret.length < 32 || secret.startsWith("change-me"))) {
      throw new Error("DOWNLOAD_SIGNING_SECRET must be a strong random value in production.");
    }
    return secret;
  },
  get paymentWebhookSecret() {
    return process.env.PAYMENT_WEBHOOK_SECRET ?? "";
  },
  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY ?? "";
  },
};

export type PaymentProviderName = "mock";

/**
 * Only the mock provider is implemented in this MVP. It is refused in
 * production unless explicitly allowed for a staging demo, so an accidental
 * production deploy can never "complete" an unpaid order.
 */
export function paymentConfig(): { provider: PaymentProviderName; mockAllowed: boolean; reason?: string } {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock") as PaymentProviderName;
  if (provider !== "mock") {
    return { provider: "mock", mockAllowed: false, reason: `Payment provider "${provider}" is not implemented yet.` };
  }
  const mockAllowed = !isProduction || process.env.ALLOW_MOCK_PAYMENTS_IN_PRODUCTION === "true";
  return {
    provider,
    mockAllowed,
    reason: mockAllowed ? undefined : "Mock payments are disabled in production. Configure a real payment provider.",
  };
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
