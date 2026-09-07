// src/components/pricing/checkout-button.tsx

"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  plan: "premium" | "premium_plus";
  billingPeriod?: "monthly" | "yearly";
  className?: string;
  // The pricing cards paint each plan's brand gradient on its CTA inline. This
  // prop used to be missing, so React dropped the style the page passed and the
  // paid buttons rendered white-on-white — invisible on the card, and unclickable
  // in practice. Every Premium sign-up went through a button nobody could see.
  style?: React.CSSProperties;
  children: React.ReactNode;
  disabled?: boolean;
}

export function CheckoutButton({
  plan,
  billingPeriod = "monthly",
  className = "",
  style,
  children,
  disabled = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingPeriod }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      style={style}
      className={`${className} ${loading ? "opacity-70 cursor-wait" : ""} ${
        disabled ? "cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}