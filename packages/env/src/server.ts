import "dotenv/config";
import { z } from "zod";

const requiredEnvVars = [
  "DATABASE_URL",
  "DATABASE_NAME",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "CORS_ORIGIN",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "GMAIL_USER",
  "GMAIL_PASS",
] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables at build time:\n${missingEnvVars.join("\n")}\n\nPlease ensure all required env vars are set before building.`
  );
}

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().email(),
  GMAIL_USER: z.string().email(),
  GMAIL_PASS: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = serverEnvSchema.parse(process.env);
