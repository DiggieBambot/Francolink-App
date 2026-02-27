// src/app/api/ai-tutor/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, getAIConfig } from "@/lib/ai/client";
import { PLANS, PlanKey, isPaidPlan } from "@/lib/config/subscription";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function getAIUsage(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("subscription_plan, ai_minutes_used_today, ai_usage_reset_date, role, learning_language")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const today = getToday();
  let minutesUsed = data.ai_minutes_used_today ?? 0;

  if (data.ai_usage_reset_date !== today) {
    await supabase
      .from("users")
      .update({ ai_minutes_used_today: 0, ai_usage_reset_date: today })
      .eq("id", userId);
    minutesUsed = 0;
  }

  return {
    plan: (data.subscription_plan || "FREE") as PlanKey,
    minutesUsed,
    role: data.role?.toUpperCase() || "STUDENT",
    learningLanguage: data.learning_language || "fr",
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getAIUsage(supabase, user.id);
    if (!usage) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    const isPrivileged = usage.role === "ADMIN" || usage.role === "TESTER";
    const plan = usage.plan;
    const planConfig = PLANS[plan];

    if (!isPaidPlan(plan) && !isPrivileged) {
      return NextResponse.json({
        error: "AI Tutor requires a Premium subscription.",
        code: "NO_ACCESS",
      }, { status: 403 });
    }

    if (!isPrivileged) {
      const dailyLimit = planConfig.aiMinutesPerDay;
      if (usage.minutesUsed >= dailyLimit) {
        return NextResponse.json({
          error: "You have used all your AI tutor minutes for today. Come back tomorrow or upgrade for more time.",
          code: "LIMIT_REACHED",
          minutesUsed: usage.minutesUsed,
          dailyLimit,
        }, { status: 429 });
      }
    }

    const body = await request.json();
    const { messages, language } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const langNames: Record<string, string> = {
      fr: "French", french: "French",
      es: "Spanish", spanish: "Spanish",
      en: "English", english: "English",
      de: "German", german: "German",
    };

    const targetLang = langNames[language || usage.learningLanguage] || "French";

    const config = await getAIConfig();
    const openai = await getOpenAIClient();

    const systemPrompt = `You are a friendly, patient, and encouraging ${targetLang} language tutor on FrancoLink. Your role is to help students practice and improve their ${targetLang} skills.

Guidelines:
- Primarily communicate in ${targetLang}, but switch to English when the student is confused or asks for help
- Adjust your language complexity to the student's level
- Gently correct mistakes and explain why something is wrong
- Use encouraging language and celebrate progress
- Suggest vocabulary and grammar tips naturally in conversation
- If the student writes in English, encourage them to try in ${targetLang} and help them
- Keep responses concise (2-4 sentences usually) to maintain a conversational flow
- Use emojis sparingly to keep it friendly
- When correcting, show the correct form and briefly explain

Start by greeting the student warmly in ${targetLang} if this is the beginning of the conversation.`;

    const completion = await openai.chat.completions.create({
      model: config.openai.tutorModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || "";

    if (!isPrivileged) {
      await supabase
        .from("users")
        .update({ ai_minutes_used_today: usage.minutesUsed + 1 })
        .eq("id", user.id);
    }

    const dailyLimit = isPrivileged ? Infinity : planConfig.aiMinutesPerDay;
    const newMinutesUsed = isPrivileged ? 0 : usage.minutesUsed + 1;

    return NextResponse.json({
      reply,
      minutesUsed: newMinutesUsed,
      dailyLimit,
      remainingMinutes: isPrivileged ? Infinity : Math.max(0, dailyLimit - newMinutesUsed),
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}
