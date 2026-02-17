// src/lib/integrations/scripts.ts

import { createClient } from "@supabase/supabase-js";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ScriptInjection {
  id: string;
  name: string;
  position: "head" | "body_start" | "body_end";
  script_content: string;
  order_index: number;
}

export async function getScripts(
  position: "head" | "body_start" | "body_end"
): Promise<ScriptInjection[]> {
  try {
    const { data, error } = await supabaseAnon
      .from("script_injections")
      .select("id, name, position, script_content, order_index")
      .eq("position", position)
      .eq("is_enabled", true)
      .order("order_index", { ascending: true });

    if (error) {
      // Silently fail if table doesn't exist or any other error
      // Scripts are optional - app should work without them
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getAllScripts(): Promise<{
  head: ScriptInjection[];
  body_start: ScriptInjection[];
  body_end: ScriptInjection[];
}> {
  try {
    const { data, error } = await supabaseAnon
      .from("script_injections")
      .select("id, name, position, script_content, order_index")
      .eq("is_enabled", true)
      .order("order_index", { ascending: true });

    if (error) {
      return { head: [], body_start: [], body_end: [] };
    }

    const scripts = data || [];

    return {
      head: scripts.filter((s) => s.position === "head"),
      body_start: scripts.filter((s) => s.position === "body_start"),
      body_end: scripts.filter((s) => s.position === "body_end"),
    };
  } catch (error) {
    return { head: [], body_start: [], body_end: [] };
  }
}