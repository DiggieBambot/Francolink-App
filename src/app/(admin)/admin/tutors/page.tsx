// Admin Tutors panel: every tutor account, their listing state, what they're
// actually doing, and the application pipeline that feeds it.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { getTutorPanelData } from "@/lib/admin/tutors";
import { TutorsPanel } from "@/components/admin/tutors-panel";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = { title: "Tutors | FrancoLink Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTutorsPage() {
  const staff = await getDashboardUser();
  if (!isAdmin(staff)) redirect("/admin");

  const data = await getTutorPanelData();

  return <TutorsPanel data={data} siteUrl={SITE_URL} />;
}
