"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { sendMagicLink } from "./actions";

function LoginForm() {
  const [loading, setLoading] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("error") === "unauthorized";

  async function handleLogin(userKey: string) {
    setLoading(userKey);
    setError(null);

    const result = await sendMagicLink(userKey);

    if (result.error) {
      setError(result.error);
    } else {
      setSentTo(result.displayName ?? userKey);
    }
    setLoading(null);
  }

  if (sentTo) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-4xl">💌</div>
            <h2 className="mb-2 text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to{" "}
              <span className="font-medium text-foreground">{sentTo}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-sm text-muted-foreground">Who are you?</p>
        </CardHeader>
        <CardContent>
          {unauthorized && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              This account is not authorized to use this app.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-28 flex-col gap-2 text-lg"
              disabled={loading !== null}
              onClick={() => handleLogin("daniel")}
            >
              <span className="text-4xl">🤓</span>
              {loading === "daniel" ? "Sending..." : "Daniel"}
            </Button>
            <Button
              variant="outline"
              className="h-28 flex-col gap-2 text-lg"
              disabled={loading !== null}
              onClick={() => handleLogin("johanna")}
            >
              <span className="text-4xl">🌚</span>
              {loading === "johanna" ? "Sending..." : "Johanna"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
