"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { sendMagicLink, devLogin } from "./actions";

const isDev = process.env.NODE_ENV === "development";

function LoginForm() {
  const [loading, setLoading] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const unauthorized = searchParams.get("error") === "unauthorized";

  async function handleLogin(userKey: string) {
    setLoading(userKey);
    setError(null);

    if (isDev) {
      const result = await devLogin(userKey);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        return;
      }
    } else {
      const result = await sendMagicLink(userKey);
      if (result.error) {
        setError(result.error);
      } else {
        setSentTo(result.displayName ?? userKey);
      }
    }
    setLoading(null);
  }

  if (sentTo) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-4xl">💌</div>
            <h2 className="mb-2 text-lg font-semibold">Prüf deine E-Mails</h2>
            <p className="text-sm text-muted-foreground">
              Wir haben einen Magic Link gesendet an{" "}
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
          <p className="text-sm text-muted-foreground">Wer bist du?</p>
        </CardHeader>
        <CardContent>
          {unauthorized && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Dieses Konto ist für diese App nicht freigeschaltet.
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
              {loading === "daniel" ? "Sende..." : "Daniel"}
            </Button>
            <Button
              variant="outline"
              className="h-28 flex-col gap-2 text-lg"
              disabled={loading !== null}
              onClick={() => handleLogin("johanna")}
            >
              <span className="text-4xl">🌚</span>
              {loading === "johanna" ? "Sende..." : "Johanna"}
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
