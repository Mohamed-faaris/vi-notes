import { client } from "@vi-notes/db";
import { env } from "@vi-notes/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP, magicLink, multiSession } from "better-auth/plugins";

import { sendAuthEmail } from "./mailer";

export const auth = betterAuth({
  database: mongodbAdapter(client),
  trustedOrigins: [env.CORS_ORIGIN],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail(
        "Verify your email",
        user.email,
        `<p>Click the button below to verify your email address.</p><p><a href="${url}">Verify email</a></p>`,
      );
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendAuthEmail(
          "Your verification code",
          email,
          `<p>Your OTP for <strong>${type}</strong> is:</p><h2 style="letter-spacing:2px;">${otp}</h2>`,
        );
      },
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendAuthEmail(
          "Your magic sign-in link",
          email,
          `<p>Use this magic link to sign in:</p><p><a href="${url}">Sign in now</a></p>`,
        );
      },
    }),
    multiSession({
      maximumSessions: 10,
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});
