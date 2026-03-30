import "dotenv/config";
import { z } from "zod";

const requiredEnvVars = [
  "DATABASE_URL",
  "DATABASE_NAME",
  "BETTER_AUTH_SECRET",
  "CORS_ORIGINS",
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
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().url()).min(1)),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().email(),
  GMAIL_USER: z.string().email(),
  GMAIL_PASS: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = serverEnvSchema.parse(process.env);
