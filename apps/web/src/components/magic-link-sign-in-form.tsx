import { useState } from "react";

import { Button } from "@vi-notes/ui/components/button";
import { Input } from "@vi-notes/ui/components/input";
import { Label } from "@vi-notes/ui/components/label";
import { Link } from "react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function MagicLinkSignInForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendMagicLink() {
    if (!email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    await authClient.signIn.magicLink(
      { email, callbackURL: "/dashboard" },
      {
        onSuccess: () => {
          toast.success("Magic link sent. Check your inbox.");
        },
        onError: (error) => {
          const message = error.error.message || error.error.statusText || "Failed to send magic link.";
          setErrorMessage(message);
          toast.error(message);
        },
      },
    );

    setIsSending(false);
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg border bg-card p-6">
      <h1 className="mb-2 text-center text-3xl font-bold">Magic Link Sign In</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">Get a secure sign-in link sent to your email.</p>

      {errorMessage && <p className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-2 text-sm">{errorMessage}</p>}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magic-link-email">Email</Label>
          <Input
            id="magic-link-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <Button type="button" className="w-full" disabled={isSending} onClick={handleSendMagicLink}>
          {isSending ? "Sending..." : "Send Magic Link"}
        </Button>
      </div>

      <div className="mt-6 grid gap-2 text-center">
        <Link to="/login" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to password sign in
        </Link>
        <Link to="/login/otp" className="text-sm text-primary underline-offset-4 hover:underline">
          Use OTP instead
        </Link>
      </div>
    </div>
  );
}
