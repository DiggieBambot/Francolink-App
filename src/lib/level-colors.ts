export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelTheme {
  level: CEFRLevel; label: string;
  color: string; colorLight: string; colorDark: string;
  bg: string; bgLight: string; border: string;
  text: string; textDark: string; badge: string; badgeText: string;
  progress: string; glow: string; gradient: string;
}

const themes: Record<CEFRLevel, LevelTheme> = {
  A1: { level:"A1", label:"Beginner", color:"#3B82F6", colorLight:"#EFF6FF", colorDark:"#1D4ED8", bg:"rgba(59,130,246,0.15)", bgLight:"rgba(59,130,246,0.08)", border:"rgba(59,130,246,0.35)", text:"#93C5FD", textDark:"#1D4ED8", badge:"#1D4ED8", badgeText:"#FFFFFF", progress:"#3B82F6", glow:"0 0 20px rgba(59,130,246,0.25)", gradient:"linear-gradient(135deg,#1e3a6e 0%,#1a3060 100%)" },
  A2: { level:"A2", label:"Elementary", color:"#06B6D4", colorLight:"#ECFEFF", colorDark:"#0E7490", bg:"rgba(6,182,212,0.15)", bgLight:"rgba(6,182,212,0.08)", border:"rgba(6,182,212,0.35)", text:"#67E8F9", textDark:"#0E7490", badge:"#0E7490", badgeText:"#FFFFFF", progress:"#06B6D4", glow:"0 0 20px rgba(6,182,212,0.25)", gradient:"linear-gradient(135deg,#0e3a45 0%,#0a2d38 100%)" },
  B1: { level:"B1", label:"Intermediate", color:"#F59E0B", colorLight:"#FFFBEB", colorDark:"#B45309", bg:"rgba(245,158,11,0.15)", bgLight:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.35)", text:"#FCD34D", textDark:"#B45309", badge:"#B45309", badgeText:"#FFFFFF", progress:"#F59E0B", glow:"0 0 20px rgba(245,158,11,0.25)", gradient:"linear-gradient(135deg,#3d2e00 0%,#2e2200 100%)" },
  B2: { level:"B2", label:"Upper Int.", color:"#F97316", colorLight:"#FFF7ED", colorDark:"#C2410C", bg:"rgba(249,115,22,0.15)", bgLight:"rgba(249,115,22,0.08)", border:"rgba(249,115,22,0.35)", text:"#FDBA74", textDark:"#C2410C", badge:"#C2410C", badgeText:"#FFFFFF", progress:"#F97316", glow:"0 0 20px rgba(249,115,22,0.25)", gradient:"linear-gradient(135deg,#3d1a00 0%,#2e1300 100%)" },
  C1: { level:"C1", label:"Advanced", color:"#EF4444", colorLight:"#FEF2F2", colorDark:"#B91C1C", bg:"rgba(239,68,68,0.15)", bgLight:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.35)", text:"#FCA5A5", textDark:"#B91C1C", badge:"#B91C1C", badgeText:"#FFFFFF", progress:"#EF4444", glow:"0 0 20px rgba(239,68,68,0.25)", gradient:"linear-gradient(135deg,#3d0000 0%,#2e0000 100%)" },
  C2: { level:"C2", label:"Mastery", color:"#A855F7", colorLight:"#FAF5FF", colorDark:"#7E22CE", bg:"rgba(168,85,247,0.15)", bgLight:"rgba(168,85,247,0.08)", border:"rgba(168,85,247,0.35)", text:"#D8B4FE", textDark:"#7E22CE", badge:"#7E22CE", badgeText:"#FFFFFF", progress:"#A855F7", glow:"0 0 20px rgba(168,85,247,0.25)", gradient:"linear-gradient(135deg,#2d0a4e 0%,#200739 100%)" },
};

export function getLevelTheme(level: string): LevelTheme {
  const normalized = level?.toUpperCase() as CEFRLevel;
  return themes[normalized] || themes["A1"];
}

export function getLevelFromCourse(courseLevel: string): CEFRLevel {
  const match = courseLevel?.toUpperCase().match(/[ABC][12]/);
  return (match?.[0] as CEFRLevel) || "A1";
}

export { themes as levelThemes };
