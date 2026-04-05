import { env } from "@vi-notes/env/server";
import nodemailer from "nodemailer";

export const emailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.GMAIL_PASS,
  },
  logger: env.NODE_ENV !== "development",
  debug: env.NODE_ENV !== "development",
});

export async function sendEmail(subject: string, to: string, html: string) {
  await emailTransport.sendMail({
    from: env.GMAIL_USER,
    to,
    subject,
    html,
  });
}

export async function verifyEmailTransport() {
  await emailTransport.verify();
}
