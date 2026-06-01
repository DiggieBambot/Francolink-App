import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const DEFAULTS = {
  pwa_name: "FrancoLink - Language Learning",
  pwa_short_name: "FrancoLink",
  pwa_description: "Learn French, Spanish, English, and German",
  pwa_start_url: "/",
  pwa_display: "standalone" as const,
  pwa_orientation: "portrait-primary" as const,
  pwa_theme_color: "#1e3a5f",
  pwa_bg_color: "#ffffff",
  pwa_icon_192: "/icons/icon-192.png",
  pwa_icon_512: "/icons/icon-512.png",
  pwa_screenshot_narrow_1: "",
  pwa_screenshot_narrow_2: "",
  pwa_screenshot_wide_1: "",
};

type PwaKey = keyof typeof DEFAULTS;

async function loadPwaSettings(): Promise<typeof DEFAULTS> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("category", "pwa");
    if (!data) return DEFAULTS;
    const out = { ...DEFAULTS };
    for (const row of data) {
      const k = row.key as PwaKey;
      if (k in out && row.value) (out as Record<string, string>)[k] = row.value;
    }
    return out;
  } catch {
    return DEFAULTS;
  }
}

type Screenshot = NonNullable<MetadataRoute.Manifest["screenshots"]>[number];

function buildScreenshots(s: typeof DEFAULTS): Screenshot[] {
  const out: Screenshot[] = [];
  if (s.pwa_screenshot_narrow_1) {
    out.push({ src: s.pwa_screenshot_narrow_1, sizes: "1080x1920", type: "image/png", form_factor: "narrow" });
  }
  if (s.pwa_screenshot_narrow_2) {
    out.push({ src: s.pwa_screenshot_narrow_2, sizes: "1080x1920", type: "image/png", form_factor: "narrow" });
  }
  if (s.pwa_screenshot_wide_1) {
    out.push({ src: s.pwa_screenshot_wide_1, sizes: "1920x1080", type: "image/png", form_factor: "wide" });
  }
  return out;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await loadPwaSettings();
  const screenshots = buildScreenshots(s);

  return {
    name: s.pwa_name,
    short_name: s.pwa_short_name,
    description: s.pwa_description,
    start_url: s.pwa_start_url,
    scope: "/",
    display: s.pwa_display as MetadataRoute.Manifest["display"],
    orientation: s.pwa_orientation as MetadataRoute.Manifest["orientation"],
    background_color: s.pwa_bg_color,
    theme_color: s.pwa_theme_color,
    lang: "en",
    dir: "ltr",
    categories: ["education", "language"],
    icons: [
      { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
      { src: s.pwa_icon_192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: s.pwa_icon_512, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    ...(screenshots.length > 0 && { screenshots }),
  };
}
