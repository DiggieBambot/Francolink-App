// src/components/layout/script-injector.tsx

import { getScripts } from "@/lib/integrations/scripts";

interface ScriptInjectorProps {
  position: "head" | "body_start" | "body_end";
}

export async function ScriptInjector({ position }: ScriptInjectorProps) {
  const scripts = await getScripts(position);

  if (scripts.length === 0) return null;

  return (
    <>
      {scripts.map((script) => (
        <div
          key={script.id}
          dangerouslySetInnerHTML={{ __html: script.script_content }}
        />
      ))}
    </>
  );
}