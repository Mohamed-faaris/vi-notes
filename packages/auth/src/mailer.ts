import { env } from "@vi-notes/env/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
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

export async function sendAuthEmail(subject: string, to: string, html: string) {
  await transporter.sendMail({
    from: env.GMAIL_USER,
    to,
    subject,
    html,
  });
}
