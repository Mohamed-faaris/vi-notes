import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { existsSync } from "fs";
import { resolve } from "path";

if (process.env.NODE_ENV !== "production") {
  const projectRoot = resolve(__dirname, "../../..");
  const envPath = resolve(projectRoot, ".env");

  if (!existsSync(envPath)) {
    throw new Error(`.env file not found at ${envPath}. Please create one based on .env.example or .env.template.`);
  }
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_NAME: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.email(),
    GMAIL_USER: z.email(),
    GMAIL_PASS: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
