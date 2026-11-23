// src/app/api/ai-tutor/recap/route.ts
//
// "End session": summarise the conversation, store the recap, and refresh the
// tutor's memory of the student. Free of the message pool — the recap is what
// turns a chat into a lesson, and charging for it would teach students to skip
// it.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, getAIConfig } from "@/lib/ai/client";
import { getTutorAccess } from "@/lib/ai/tutor-access";
import { recapConversation, MIN_MESSAGES_FOR_RECAP } from "@/lib/ai/tutor-memory";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getTutorAccess(supabase, user.id);
    if (!access?.hasAccess) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { conversationId } = await request.json();
    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const config = await getAIConfig();
    const recap = await recapConversation({
      svc,
      openai: await getOpenAIClient(),
      model: config.openai.tutorModel,
      conversationId,
      userId: user.id,
    });

    if (!recap) {
      return NextResponse.json(
        {
          error: `Have at least ${MIN_MESSAGES_FOR_RECAP / 2} exchanges with your tutor to get a recap.`,
          code: "TOO_SHORT",
        },
        { status: 422 }
      );
    }

    // Internal accounting stays server-side.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { model, costUsd, ...publicRecap } = recap;
    return NextResponse.json({ recap: publicRecap });
  } catch (error) {
    console.error("Tutor recap error:", error);
    return NextResponse.json({ error: "Couldn't build your recap." }, { status: 500 });
  }
}
