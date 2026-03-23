import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Editor } from "@/components/editor/editor";
import { authClient } from "@/lib/auth-client";

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session && !isPending) {
      navigate("/login");
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl py-2">
      <div className="px-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome {session?.user.name}</p>
      </div>
      <Editor userId={session?.user.id ?? "anonymous"} />
    </div>
  );
}
