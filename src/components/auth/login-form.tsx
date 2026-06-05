"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff, Loader2, GraduationCap, BookOpen, ArrowLeft } from "lucide-react";
import { GoogleButton } from "./google-button";

export function LoginForm({ role }: { role: "student" | "tutor" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isTutor = role === "tutor";
  const signupHref = isTutor ? "/signup/tutor" : "/signup/student";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      // Route by actual role so everyone lands in the right area.
      let dest = "/dashboard";
      const uid = signInData.user?.id;
      if (uid) {
        const { data: profile } = await supabase.from("users").select("role").eq("id", uid).maybeSingle();
        if (profile?.role === "TUTOR") dest = "/tutor";
        else if (profile?.role === "ADMIN") dest = "/admin";
      }
      router.push(dest);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-7 text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${isTutor ? "bg-secondary-100 text-secondary-700" : "bg-primary-100 text-primary"}`}>
          {isTutor ? <GraduationCap className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          {isTutor ? "Welcome back, tutor" : "Welcome back"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isTutor ? "Log in to your teaching dashboard" : "Log in to continue learning"}
        </p>
      </div>

      <GoogleButton />

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && <div className="rounded-lg bg-error-light p-3 text-sm text-error">{error}</div>}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-secondary hover:underline">Forgot password?</Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging in...</>) : "Log In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        {isTutor ? "New tutor?" : "New here?"}{" "}
        <Link href={signupHref} className="font-semibold text-secondary hover:underline">Create an account</Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/login" className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-3 w-3" /> {isTutor ? "I'm a student" : "I'm a tutor"} — switch
        </Link>
      </p>
    </Card>
  );
}
