"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
import { Button, Card, Input } from "@/components/ui";
import { Mail, Lock, User, Eye, EyeOff, Loader2, BookOpen, ArrowLeft } from "lucide-react";
import { GoogleButton } from "./google-button";

export function StudentSignupForm({ next }: { next?: string }) {
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name, role: "USER" },
          // Carry `next` through email confirmation so the callback lands the
          // student on their destination (e.g. a shared /room link).
          emailRedirectTo: `${window.location.origin}/auth/callback${
            next ? `?next=${encodeURIComponent(next)}` : ""
          }`,
        },
      });
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      if (data.user && !data.session) {
        alert("Please check your email to confirm your account!");
        window.location.href = `/login/student${nextQ}`;
      } else if (data.session) {
        // No email-confirmation step: send the welcome email, then go to the
        // destination if given. (When confirmation IS on, the callback sends it.)
        trackEvent("signup_completed", { once: "signup_completed" });
        try { await fetch("/api/email/welcome", { method: "POST" }); } catch {}
        window.location.href = next || "/onboarding";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">Create your student account</h1>
        <p className="mt-1 text-gray-600">Browse lessons free and learn live with a tutor</p>
      </div>

      <GoogleButton label="Sign up with Google" next={next} />

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {error && <div className="rounded-lg bg-error-light p-3 text-sm text-error">{error}</div>}

        <div className="relative">
          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" required />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
            minLength={6}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating account...</>) : "Create Account"}
        </Button>

        <p className="text-center text-xs text-gray-500">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-secondary hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>
        </p>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Already have an account?{" "}
        <Link href={`/login/student${nextQ}`} className="font-semibold text-secondary hover:underline">Log in</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/signup" className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-3 w-3" /> Want to teach instead? Sign up as a Tutor
        </Link>
      </p>
    </Card>
  );
}
