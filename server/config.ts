import { z } from "zod";

const rawEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1).optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_SSL_MODE: z
      .enum(["auto", "require", "disable"])
      .default("auto"),
    SESSION_SECRET: z.string().optional(),
    SESSION_COOKIE_NAME: z.string().default("abs.sid"),
    SESSION_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
    SESSION_COOKIE_SAME_SITE: z
      .enum(["lax", "strict", "none"])
      .optional(),
    SESSION_COOKIE_DOMAIN: z.string().min(1).optional(),
    SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 30),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    AI_PROVIDER: z.enum(["none", "openai", "claude"]).default("none"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_BASE_URL: z.string().url().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-20250514"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "test" && !value.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required outside test runs.",
      });
    }

    if (
      value.NODE_ENV !== "test" &&
      (!value.SESSION_SECRET || value.SESSION_SECRET.length < 32)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be at least 32 characters outside test runs.",
      });
    }

    if (value.AI_PROVIDER === "openai" && !value.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
      });
    }

    if (value.AI_PROVIDER === "claude" && !value.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ANTHROPIC_API_KEY"],
        message: "ANTHROPIC_API_KEY is required when AI_PROVIDER=claude.",
      });
    }

    if (
      value.SESSION_COOKIE_SAME_SITE === "none" &&
      value.SESSION_COOKIE_SECURE === "false"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_COOKIE_SECURE"],
        message: "SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE=none.",
      });
    }
  });

const parsedEnv = rawEnvSchema.parse(process.env);

const dedupe = <T>(values: T[]) => Array.from(new Set(values));

export const env = {
  ...parsedEnv,
  DATABASE_URL:
    parsedEnv.DATABASE_URL ??
    (parsedEnv.NODE_ENV === "test" ? "" : parsedEnv.DATABASE_URL!),
  CORS_ALLOWED_ORIGINS: dedupe(
    (parsedEnv.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
  SESSION_COOKIE_SECURE:
    parsedEnv.SESSION_COOKIE_SECURE === undefined
      ? parsedEnv.NODE_ENV === "production"
      : parsedEnv.SESSION_COOKIE_SECURE === "true",
  SESSION_COOKIE_SAME_SITE:
    parsedEnv.SESSION_COOKIE_SAME_SITE ??
    (parsedEnv.NODE_ENV === "production" ? "none" : "lax"),
  SESSION_SECRET:
    parsedEnv.SESSION_SECRET ??
    (parsedEnv.NODE_ENV === "test"
      ? "e2e-test-only-secret-do-not-use-in-production"
      : parsedEnv.SESSION_SECRET!),
} as const;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
