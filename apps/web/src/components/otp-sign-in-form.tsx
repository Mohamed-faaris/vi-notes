import { useState } from "react";

import { Button } from "@vi-notes/ui/components/button";
import { Input } from "@vi-notes/ui/components/input";
import { Label } from "@vi-notes/ui/components/label";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function OtpSignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    await authClient.emailOtp.sendVerificationOtp(
      { email, type: "sign-in" },
      {
        onSuccess: () => {
          toast.success("OTP sent to your email");
        },
        onError: (error) => {
          const message = error.error.message || error.error.statusText || "Failed to send OTP.";
          setErrorMessage(message);
          toast.error(message);
        },
      },
    );

    setIsSending(false);
  }

  async function handleVerifyOtp() {
    if (!email.trim() || !otp.trim()) {
      setErrorMessage("Email and OTP are required.");
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);

    await authClient.signIn.emailOtp(
      { email, otp },
      {
        onSuccess: () => {
          toast.success("Signed in with OTP");
          navigate("/dashboard");
        },
        onError: (error) => {
          const message = error.error.message || error.error.statusText || "Invalid OTP.";
          setErrorMessage(message);
          toast.error(message);
        },
      },
    );

    setIsVerifying(false);
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg border bg-card p-6">
      <h1 className="mb-2 text-center text-3xl font-bold">OTP Sign In</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">Receive a one-time code and verify it.</p>

      {errorMessage && <p className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-2 text-sm">{errorMessage}</p>}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-signin-email">Email</Label>
          <Input
            id="otp-signin-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <Button type="button" variant="outline" className="w-full" disabled={isSending} onClick={handleSendOtp}>
          {isSending ? "Sending..." : "Send OTP"}
        </Button>

        <div className="space-y-2">
          <Label htmlFor="otp-code">OTP Code</Label>
          <Input id="otp-code" placeholder="Enter 6-digit code" value={otp} onChange={(event) => setOtp(event.target.value)} />
        </div>

        <Button type="button" className="w-full" disabled={isVerifying} onClick={handleVerifyOtp}>
          {isVerifying ? "Verifying..." : "Verify and Sign In"}
        </Button>
      </div>

      <div className="mt-6 grid gap-2 text-center">
        <Link to="/login" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to password sign in
        </Link>
        <Link to="/login/magic-link" className="text-sm text-primary underline-offset-4 hover:underline">
          Use magic link instead
        </Link>
      </div>
    </div>
  );
}
