import { env } from "@vi-notes/env/web";
import { emailOTPClient, magicLinkClient, multiSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [emailOTPClient(), magicLinkClient(), multiSessionClient()],
});
