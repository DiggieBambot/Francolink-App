"use client";

// One field. That is the whole design.
//
// A buyer who has already paid should not meet a signup form — they should
// meet a lock with their name on it. So: the email is shown but not editable
// (it came from Stripe and it is what the order is keyed to), the button says
// "Unlock my workbook", and the word "register" never appears.
//
// Whether they already have an account is discovered by TRYING, not by asking
// the server first. An "does this email exist?" endpoint is an account
// enumeration oracle, and we would be building it for the one person who
// already has the email in their inbox. If sign-up says the user exists, the
// form quietly becomes a sign-in.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
import { Button, Input } from "@/components/ui";
import { Lock, Eye, EyeOff, Loader2, Headphones, BookOpen } from "lucide-react";

type Mode = "create" | "signin";

export function ClaimWorkbook({
  token,
  email,
  hasAudio,
}: {
  token: string;
  email: string;
  hasAudio: boolean;
}) {
  const [mode, setMode] = useState<Mode>("create");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function claimAndGo() {
    const res = await fetch("/api/workbook/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Couldn't open your workbook.");
      setBusy(false);
      return;
    }
    trackEvent("workbook_claimed");
    window.location.href = json.next || "/library";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "create" && password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    setBusy(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("That password doesn't match. Try again, or reset it below.");
        setBusy(false);
        return;
      }
      await claimAndGo();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "USER" } },
    });

    if (error) {
      if (/already/i.test(error.message)) {
        setMode("signin");
        setPassword("");
        setError("You already have an account with this email — enter your password to sign in.");
        setBusy(false);
        return;
      }
      setError(error.message);
      setBusy(false);
      return;
    }

    // Email confirmation is on: there is no session yet, so the claim has to
    // wait until they come back through the callback. The order is safe — the
    // token stays valid until it is claimed.
    if (data.user && !data.session) {
      setBusy(false);
      setError("");
      setMode("create");
      alert(
        "Check your email to confirm your address, then open this link again to unlock your workbook."
      );
      return;
    }

    trackEvent("signup_completed", { once: "signup_completed" });
    try {
      await fetch("/api/email/welcome", { method: "POST" });
    } catch {}
    await claimAndGo();
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Payment received</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {mode === "signin" ? "Sign in to open it" : "One step to open your workbook"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "signin"
            ? "You already have a FrancoLink account with this email."
            : "Choose a password and Le Français Pas à Pas is yours — the PDF and the online version, where the exercises mark themselves."}
        </p>
      </div>

      <ul className="space-y-2 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
        <li className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
          <span>Workbook — PDF and interactive, A0 to B2</span>
        </li>
        {hasAudio && (
          <li className="flex items-center gap-2">
            <Headphones className="h-4 w-4 shrink-0 text-primary" />
            <span>Audio pack — every dialogue, natural speed and slow</span>
          </li>
        )}
      </ul>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="claim-email">
            Your email
          </label>
          <Input id="claim-email" value={email} readOnly disabled />
          <p className="text-xs text-muted-foreground">
            The address you bought with. Your workbook is tied to it.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="claim-password">
            {mode === "signin" ? "Your password" : "Choose a password"}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="claim-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in and open it" : "Unlock my workbook"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        14-day money-back guarantee. Reply to your receipt and we&apos;ll refund you.
      </p>
    </main>
  );
}
