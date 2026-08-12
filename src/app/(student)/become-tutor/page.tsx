"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, CheckCircle, Users, BookOpen, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export default function BecomeTutorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/become-tutor", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = "/tutor";
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-secondary" />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-primary mb-3">
          Teach your own students
        </h1>
        <p className="text-gray-500 text-lg">
          Turn on tutor tools and teach students you invite yourself — your
          student account stays intact. This is not the same as becoming a
          FrancoLink tutor, where we send you students and pay you per lesson;
          that goes through an application once you&apos;re set up here.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
        <h2 className="font-heading font-bold text-primary text-lg mb-6">
          What you get as a tutor
        </h2>
        <div className="space-y-4">
          {[
            { icon: Users, text: "Up to 5 students on the free plan" },
            { icon: BookOpen, text: "Create and manage live lesson sessions" },
            { icon: DollarSign, text: "Earn commissions from student referrals" },
            { icon: CheckCircle, text: "Your student profile and progress stay the same" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-gray-700 font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="flex-1 h-12 text-base"
        >
          {loading ? "Upgrading..." : "Upgrade to Tutor"}
          {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
