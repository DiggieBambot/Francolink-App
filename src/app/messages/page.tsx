// src/app/messages/page.tsx
//
// 1:1 messages between a tutor and their connected students. Shared by both
// roles, so it sits outside the (student)/(tutor) layouts with its own slim
// header. `?with=<userId>` opens that person's thread directly.

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MessagesApp } from "@/components/messages/messages-app";

export const metadata = { title: "Messages | Francolink" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const isTutor = profile?.role === "TUTOR" || profile?.role === "ADMIN";
  const backHref = isTutor ? "/tutor/students" : "/dashboard";
  const { with: withId } = await searchParams;

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4 shrink-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          {isTutor ? "My students" : "Dashboard"}
        </Link>
        <div className="flex-1" />
        <Link href={isTutor ? "/tutor" : "/dashboard"} className="flex items-center">
          <Image src="/logo-new.webp" alt="Francolink" width={132} height={24} priority />
        </Link>
      </header>
      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto md:p-4">
        <MessagesApp meId={user.id} initialWith={withId || null} />
      </main>
    </div>
  );
}
