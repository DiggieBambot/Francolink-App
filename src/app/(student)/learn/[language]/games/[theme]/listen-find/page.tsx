import ListenAndFind from "@/components/games/listen-find";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";

export default async function ListenFindPage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <ListenAndFind language={language} theme={theme} />;
}
