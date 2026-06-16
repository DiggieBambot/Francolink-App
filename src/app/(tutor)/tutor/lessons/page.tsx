"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TutorLessonsPage() {
  const router = useRouter();

  useEffect(() => {
    function handle(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; slug?: string };
      if (d?.type === "francolink:pick-lesson" && d.slug) {
        router.push(`/tutor/lessons/${d.slug}`);
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [router]);

  return (
    <>
      {/*
        Fixed overlay that covers the area to the right of the sidebar and
        below the mobile header. On lg screens the sidebar is 16rem wide and
        there is no top header. On smaller screens a h-14 (3.5rem) sticky
        header sits at top-0. Using fixed avoids any conflict with the
        normal-flow padded <main> element from the layout.
      */}
      <div className="fixed inset-0 top-14 lg:top-0 lg:left-64 z-10">
        <iframe
          src="/library"
          title="Lesson library"
          className="w-full h-full border-0"
        />
      </div>
      {/* Push the padded main to have some height so the page doesn't collapse */}
      <div className="h-4" />
    </>
  );
}
