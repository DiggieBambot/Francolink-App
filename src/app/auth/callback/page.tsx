"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Auth error:", error.message);
            window.location.href = "/login?error=" + encodeURIComponent(error.message);
            return;
          }
        }

        // Success - redirect to dashboard
        window.location.href = "/dashboard";
      } catch (err) {
        console.error("Callback error:", err);
        window.location.href = "/login?error=callback_failed";
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
