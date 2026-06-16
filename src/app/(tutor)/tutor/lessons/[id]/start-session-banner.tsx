"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Props {
  lessonId: string;
  lessonTitle: string;
  students: Student[];
}

export function StartSessionBanner({ lessonId, lessonTitle, students }: Props) {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tutor/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent, lessonId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/tutor/sessions/${data.sessionId}`);
      } else {
        alert(data.error || "Failed to start session");
      }
    } catch {
      alert("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Video className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="text-sm font-medium text-emerald-900">
          Teach this lesson live
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {students.length > 0 ? (
            <>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="text-sm border border-emerald-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.email}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStart}
                disabled={!selectedStudent || loading}
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                {loading ? "Starting…" : "Start session"}
              </button>
            </>
          ) : (
            <span className="text-sm text-emerald-700">
              No active students yet — share your invite link to add one.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
