import { env } from "@vi-notes/env/server";
import nodemailer from "nodemailer";

export const emailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.GMAIL_PASS,
  },
  logger: env.NODE_ENV !== "development",
  debug: env.NODE_ENV !== "development",
});

export async function verifyEmailServer() {
  await emailTransport.verify();
}
