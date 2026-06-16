"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function TutorLessonsPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    <div className="-m-4 sm:-m-6 lg:-m-8 flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      <iframe
        ref={iframeRef}
        src="/library?embed=1"
        title="Lesson library"
        className="flex-1 w-full border-0"
        style={{ minHeight: 0 }}
      />
    </div>
  );
}
