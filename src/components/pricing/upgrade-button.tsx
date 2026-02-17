// src/components/pricing/upgrade-button.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

interface UpgradeButtonProps {
  className?: string;
}

export function UpgradeButton({ className = "" }: UpgradeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/checkout/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.success) {
        router.push("/checkout/success?upgraded=true");
        router.refresh();
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`flex items-center justify-center gap-2 ${className} ${
        loading ? "opacity-70 cursor-wait" : ""
      }`}
    >
      <Sparkles className="w-5 h-5" />
      {loading ? "Processing..." : "Upgrade to Premium+ Now"}
    </button>
  );
}