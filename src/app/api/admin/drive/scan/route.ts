import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractFolderId, listFolderDocs } from "@/lib/drive/folder";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN") return { error: "Forbidden", status: 403 } as const;
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing GOOGLE_API_KEY in env. Create one at console.cloud.google.com (enable Drive API v3) and add to .env.local.",
      },
      { status: 500 }
    );
  }

  const { folder } = (await req.json().catch(() => ({}))) as { folder?: string };
  const folderId = extractFolderId(folder || "");
  if (!folderId) {
    return NextResponse.json({ error: "Could not extract folder ID from input" }, { status: 400 });
  }

  try {
    const docs = await listFolderDocs(folderId, apiKey);
    return NextResponse.json({ folderId, count: docs.length, docs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
