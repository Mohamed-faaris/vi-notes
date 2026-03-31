import { useEffect, useState } from "react";

import { Button } from "@vi-notes/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { Input } from "@vi-notes/ui/components/input";
import { Label } from "@vi-notes/ui/components/label";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function LoginRoute() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "otp" | "magic">("sign-in");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && !isPending) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return <div className="flex min-h-svh items-center justify-center p-4">Loading...</div>;
  }

  if (session) {
    return null;
  }

  async function submit() {
    setLoading(true);

    if (mode === "sign-in") {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            toast.success("Signed in");
            navigate("/dashboard");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText || "Sign in failed");
          },
        },
      );
    }

    if (mode === "sign-up") {
      await authClient.signUp.email(
        { email, password, name },
        {
          onSuccess: () => {
            toast.success("Account created. Please verify your email.");
            setMode("sign-in");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText || "Sign up failed");
          },
        },
      );
    }

    if (mode === "otp") {
      await authClient.signIn.emailOtp(
        { email, otp },
        {
          onSuccess: () => {
            toast.success("Signed in with OTP");
            navigate("/dashboard");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText || "OTP verification failed");
          },
        },
      );
    }

    if (mode === "magic") {
      await authClient.signIn.magicLink(
        { email, callbackURL: "/dashboard" },
        {
          onSuccess: () => {
            toast.success("Magic link sent");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText || "Magic link failed");
          },
        },
      );
    }

    setLoading(false);
  }

  async function sendOtp() {
    setLoading(true);
    await authClient.emailOtp.sendVerificationOtp(
      { email, type: "sign-in" },
      {
        onSuccess: () => {
          toast.success("OTP sent");
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText || "OTP send failed");
        },
      },
    );
    setLoading(false);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to continue to Notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "sign-in" ? "default" : "outline"} onClick={() => setMode("sign-in")}>Sign In</Button>
            <Button variant={mode === "sign-up" ? "default" : "outline"} onClick={() => setMode("sign-up")}>Sign Up</Button>
            <Button variant={mode === "otp" ? "default" : "outline"} onClick={() => setMode("otp")}>OTP</Button>
            <Button variant={mode === "magic" ? "default" : "outline"} onClick={() => setMode("magic")}>Magic Link</Button>
          </div>

          {mode === "sign-up" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          {mode === "sign-in" || mode === "sign-up" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          ) : null}

          {mode === "otp" ? (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input id="otp" value={otp} onChange={(event) => setOtp(event.target.value)} />
              <Button variant="outline" disabled={loading} onClick={sendOtp}>
                Send OTP
              </Button>
            </div>
          ) : null}

          <Button className="w-full" disabled={loading} onClick={submit}>
            {loading ? "Please wait..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
