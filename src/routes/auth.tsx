import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/am-premium-logo.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Prijava · AM Premium" },
      { name: "description", content: "Interni pristup evidenciji stanova AM Premium Residence." },
      { property: "og:title", content: "Prijava · AM Premium" },
      { property: "og:description", content: "Interni pristup evidenciji stanova AM Premium Residence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/pregled" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    const { data, error: err } = await fn;
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) navigate({ to: "/pregled" });
    else setError("Nalog je kreiran. Prijavite se.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="animate-rise w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo.url} alt="AM Premium Residence" className="h-24 w-24 rounded-xl object-cover" />
          <div className="gold-rule mt-6 w-24" />
        </div>
        <form onSubmit={submit} className="surface space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
          <Button type="submit" disabled={busy} className="w-full">
            {mode === "in" ? "Prijava" : "Kreiraj nalog"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "in" ? "Kreiraj nalog" : "Nazad na prijavu"}
          </button>
        </form>
      </div>
    </main>
  );
}
