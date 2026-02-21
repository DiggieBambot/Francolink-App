// src/app/(admin)/seed/page.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export default function SeedPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);
    setStatus("Checking...");
    try {
      const res = await fetch("/api/seed/french-a1");
      const data = await res.json();
      setResult(data);
      setStatus(data.exists ? "Course exists" : "Course not found");
    } catch (error) {
      setStatus("Error checking status");
    } finally {
      setLoading(false);
    }
  };

  const runSeed = async () => {
    setLoading(true);
    setStatus("Seeding database...");
    setResult(null);
    try {
      const res = await fetch("/api/seed/french-a1", {
        method: "POST",
      });
      const data = await res.json();
      setResult(data);
      setStatus(data.success ? "Seed completed!" : "Seed failed");
    } catch (error) {
      setStatus("Error running seed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8">
          Database Seed Tool
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">French A1 Course</h2>
            <p className="text-gray-600 mb-4">
              This will seed the database with the French A1 course content
              including units, lessons, and exercises.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={checkStatus}
              disabled={loading}
              variant="secondary"
            >
              Check Status
            </Button>
            <Button onClick={runSeed} disabled={loading}>
              {loading ? "Running..." : "Run Seed"}
            </Button>
          </div>

          {status && (
            <div
              className={`p-4 rounded-lg ${
                status.includes("completed") || status.includes("exists")
                  ? "bg-green-50 text-green-800"
                  : status.includes("Error") || status.includes("failed")
                  ? "bg-red-50 text-red-800"
                  : "bg-primary-50 text-primary-800"
              }`}
            >
              <p className="font-medium">{status}</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Warning</h3>
          <p className="text-yellow-700 text-sm">
            Running the seed will delete and recreate the French A1 course.
            Any user progress on this course will be lost. Only use this in
            development or when you need to reset course content.
          </p>
        </div>
      </div>
    </div>
  );
}