import * as cheerio from "cheerio";
import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lesson, Section, VocabItem } from "@/lib/lessons/types";
import { CATEGORY_PLACEHOLDERS, getDailyNewsConfig, GOOGLE_NEWS_LOCALE, GOOGLE_NEWS_TOPICS } from "./config";
import type {
  BannerImage,
  BuiltLesson,
  CandidateScore,
  DailyNewsCategory,
  DailyNewsConfig,
  DailyNewsLanguage,
  DailyNewsRunResult,
  GeneratedDailyNewsLesson,
  NewsCandidate,
} from "./types";
import {
  compactText,
  fetchWithTimeout,
  parseJsonObject,
  sha256,
  slugify,
  stripHtml,
  withRetries,
} from "./utils";

const MAX_SOURCE_TEXT_CHARS = 9000;
const MIN_EXTRACTED_TEXT_CHARS = 700;

// Longer, more complex articles at higher CEFR levels — roughly double the
// original spec so there's real room for a narrative arc and direct quotes,
// not just a headline restated in a few sentences.
const ARTICLE_LENGTH_BY_LEVEL: Record<string, { words: string; paragraphs: number }> = {
  A2: { words: "360-480", paragraphs: 5 },
  B1: { words: "520-680", paragraphs: 6 },
  B2: { words: "640-840", paragraphs: 7 },
  C1: { words: "760-960", paragraphs: 8 },
};

// Comprehension-question difficulty scales with level: lower levels stay
// literal (answer is one sentence away), higher levels demand inference,
// synthesis across paragraphs, or reading between the lines — genuinely
// harder than what the CEFR level alone would suggest, not just longer.
const QUESTION_DIFFICULTY_BY_LEVEL: Record<string, string> = {
  A2: "mostly direct/literal (the answer is stated plainly in one sentence), but push 1-2 of the 5 to require combining two sentences.",
  B1: "mixed: some direct, but at least half should require connecting information across two different paragraphs or inferring a reason/cause that isn't stated outright.",
  B2: "mostly inferential: most questions should require synthesizing across multiple paragraphs, inferring motive/implication, or explaining WHY something happened rather than just WHAT happened. Avoid questions answerable by copying one sentence.",
  C1: "genuinely challenging: almost every question should require inference, evaluating an implied opinion or tone, comparing two viewpoints in the article, or reasoning about consequences/nuance the article implies but never states directly. No question should be answerable by lifting a single sentence verbatim.",
};

type DbClient = SupabaseClient;

interface RunOptions {
  dryRun?: boolean;
  config?: Partial<DailyNewsConfig>;
}

interface InsertedRun {
  id: string;
}

interface InsertedLesson {
  id: string;
  slug: string;
  title: string;
}

function googleNewsUrl(category: DailyNewsCategory, locale: { hl: string; gl: string; ceid: string }): string {
  const topic = GOOGLE_NEWS_TOPICS[category];
  const { hl, gl, ceid } = locale;
  return `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function authHeaders(): HeadersInit {
  return {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
}

// Google News RSS `link` values (format /rss/articles/CBMi...) do NOT
// server-redirect to the publisher — the article's actual URL is embedded in
// a signed payload on the interstitial page and must be decoded through
// Google's internal batchexecute RPC. This is the same technique used by the
// public `google-news-url-decoder` tools; it's unofficial and could break if
// Google changes the format (verified live against a real feed item, PRD §6).
// Any failure at any step falls back to the original Google link, per PRD §6:
// "If resolution fails, keep the Google link but flag it."
async function decodeGoogleNewsArticleUrl(googleUrl: string): Promise<string | null> {
  const idMatch = googleUrl.match(/\/articles\/([^?]+)/);
  if (!idMatch) return null;
  const articleId = idMatch[1];

  // Step 1: fetch the interstitial page, following its self-redirect by hand
  // (fetch() doesn't persist cookies across calls like a browser does, and
  // Google's consent-cookie hop is required before it serves the real page).
  let cookie = "";
  let html = "";
  let url = googleUrl;
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetchWithTimeout(
      url,
      { redirect: "manual", headers: { ...authHeaders(), ...(cookie ? { cookie } : {}) } },
      10000
    );
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      url = loc.startsWith("http") ? loc : new URL(loc, url).toString();
      continue;
    }
    html = await res.text();
    break;
  }
  if (!html) return null;

  const sgMatch = html.match(/data-n-a-sg="([^"]+)"/);
  const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);
  if (!sgMatch || !tsMatch) return null;

  // Step 2: exchange (articleId, timestamp, signature) for the real URL via
  // Google's batchexecute RPC (endpoint "Fbv4je" = "garturlreq").
  const inner = JSON.stringify([
    "garturlreq",
    [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
      "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
    articleId,
    tsMatch[1],
    sgMatch[1],
  ]);
  const body = `f.req=${encodeURIComponent(JSON.stringify([[["Fbv4je", inner, null, "generic"]]]))}`;

  const decodeRes = await fetchWithTimeout(
    "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
    { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" }, body },
    10000
  );
  const text = await decodeRes.text();
  const jsonLine = text.split("\n").find((line) => line.trim().startsWith("[["));
  if (!jsonLine) return null;

  const outer = JSON.parse(jsonLine) as unknown[];
  const payload = (outer[0] as unknown[])?.[2];
  if (typeof payload !== "string") return null;
  const decoded = JSON.parse(payload) as unknown[];
  const decodedUrl = decoded[1];
  return typeof decodedUrl === "string" ? decodedUrl : null;
}

async function resolveNewsUrl(url: string): Promise<string> {
  try {
    const decoded = await decodeGoogleNewsArticleUrl(url);
    if (decoded) return decoded;
  } catch (error) {
    console.warn(`[daily-news] Google News URL decode failed, keeping Google link:`, error);
  }
  return url;
}

export async function fetchGoogleNewsCandidates(config: DailyNewsConfig): Promise<NewsCandidate[]> {
  const candidates: NewsCandidate[] = [];
  const cutoffMs = Date.now() - 72 * 60 * 60 * 1000;
  const seenUrls = new Set<string>();

  const locales = GOOGLE_NEWS_LOCALE[config.language];
  // Split the per-category cap across editions so one language doesn't fetch
  // 4x as many candidates as another (e.g. French: France + Belgium +
  // Switzerland + Canada editions, ~1/4 of the cap each).
  const perEditionLimit = Math.max(2, Math.ceil(config.maxCandidatesPerCategory / locales.length));

  for (const category of config.categories) {
    let feedRank = 0;
    for (const locale of locales) {
      try {
        const res = await withRetries(() => fetchWithTimeout(googleNewsUrl(category, locale), {}, 12000), 2);
        if (!res.ok) throw new Error(`Google News ${category} (${locale.ceid}) returned ${res.status}`);
        const xml = await res.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const items = $("item").slice(0, perEditionLimit).toArray();

        for (const item of items) {
          const title = stripHtml($(item).find("title").first().text());
          const googleUrl = $(item).find("link").first().text().trim();
          const pubDate = $(item).find("pubDate").first().text().trim();
          const publishedAt = pubDate ? new Date(pubDate) : new Date();
          if (Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoffMs) continue;

          const sourceName = stripHtml($(item).find("source").first().text()) || null;
          const snippet = stripHtml($(item).find("description").first().text());
          const sourceUrl = await resolveNewsUrl(googleUrl);
          if (seenUrls.has(sourceUrl)) continue; // same story picked up by multiple editions
          seenUrls.add(sourceUrl);

          feedRank++;
          candidates.push({
            category,
            title,
            snippet,
            sourceName,
            sourceUrl,
            googleUrl,
            publishedAt: publishedAt.toISOString(),
            feedRank,
            contentHash: sha256(sourceUrl),
          });
        }
      } catch (error) {
        console.error(`[daily-news] fetch failed for ${category} (${locale.ceid}):`, error);
      }
    }
  }

  return candidates;
}

export async function filterExistingCandidates(
  supabase: DbClient,
  candidates: NewsCandidate[]
): Promise<NewsCandidate[]> {
  if (!candidates.length) return candidates;
  const hashes = candidates.map((c) => c.contentHash);
  const { data, error } = await supabase
    .from("daily_news_lessons")
    .select("content_hash")
    .in("content_hash", hashes);

  if (error) {
    throw new Error(`Could not check daily news dedupe table: ${error.message}`);
  }

  const existing = new Set((data || []).map((row: { content_hash: string }) => row.content_hash));
  return candidates.filter((candidate) => !existing.has(candidate.contentHash));
}

export async function scoreCandidates(
  openai: OpenAI,
  candidates: NewsCandidate[],
  config: DailyNewsConfig
): Promise<Array<NewsCandidate & { score: CandidateScore }>> {
  if (!candidates.length) return [];

  const payload = candidates.map((candidate, index) => ({
    index,
    category: candidate.category,
    title: candidate.title,
    snippet: compactText(candidate.snippet, 500),
    source_name: candidate.sourceName,
    feed_rank: candidate.feedRank,
  }));

  const completion = await withRetries(
    () =>
      openai.chat.completions.create({
        model: config.openaiModel,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You are curating short news stories to turn into ${config.language === "fr" ? "French" : "English"} lessons for learners worldwide. You will receive JSON candidate stories. For EACH candidate, score it 0-3 on: significance, discussability, global_intelligibility, self_contained. Return JSON with a single key scores containing an array of objects: { index, significance, discussability, global_intelligibility, self_contained, appropriate }. appropriate must be false if the story centers on graphic violence, tragedy with no learning value, explicit/adult content, or heavily partisan political conflict. No prose.`,
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    2
  );

  const raw = completion.choices[0]?.message.content || "{}";
  const parsed = parseJsonObject<{ scores?: Omit<CandidateScore, "total">[] } | Omit<CandidateScore, "total">[]>(raw);
  const scores = Array.isArray(parsed) ? parsed : parsed.scores || [];
  const byIndex = new Map<number, CandidateScore>();

  for (const score of scores) {
    const total =
      Number(score.significance || 0) +
      Number(score.discussability || 0) +
      Number(score.global_intelligibility || 0) +
      Number(score.self_contained || 0);
    byIndex.set(score.index, { ...score, total });
  }

  return candidates
    .map((candidate, index) => {
      const score = byIndex.get(index);
      return score ? { ...candidate, score } : null;
    })
    .filter((item): item is NewsCandidate & { score: CandidateScore } => !!item);
}

export function selectCandidates(
  scored: Array<NewsCandidate & { score: CandidateScore }>,
  config: DailyNewsConfig
): Array<NewsCandidate & { score: CandidateScore }> {
  const selected: Array<NewsCandidate & { score: CandidateScore }> = [];
  for (const category of config.categories) {
    const best = scored
      .filter((item) => item.category === category)
      .filter((item) => item.score.appropriate && item.score.total >= config.minScoreThreshold)
      .sort((a, b) => b.score.total - a.score.total || a.feedRank - b.feedRank)[0];
    if (best) selected.push(best);
  }
  return selected
    .sort((a, b) => b.score.total - a.score.total || a.feedRank - b.feedRank)
    .slice(0, config.lessonsPerDay);
}

export async function extractArticleText(
  candidate: NewsCandidate
): Promise<{ text: string; usedFallback: boolean; sourceImageUrl: string | null }> {
  try {
    const res = await fetchWithTimeout(candidate.sourceUrl, { headers: authHeaders() }, 12000);
    if (!res.ok) throw new Error(`article returned ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // The publisher's own lead image for THIS exact story (og:image/
    // twitter:image) is the most precise, on-topic photo we can get — it's
    // literally what the source chose to illustrate this article, unlike a
    // generic stock-photo search. Read it before stripping tags.
    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:secure_url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;
    const sourceImageUrl = ogImage ? new URL(ogImage, candidate.sourceUrl).toString() : null;

    $("script, style, nav, header, footer, aside, form, noscript, iframe").remove();
    const candidates = [
      $("article").text(),
      $("main").text(),
      $("[role='main']").text(),
      $("body").text(),
    ]
      .map((text) => text.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const text = candidates.sort((a, b) => b.length - a.length)[0] || "";
    if (text.length >= MIN_EXTRACTED_TEXT_CHARS) {
      return { text: compactText(text, MAX_SOURCE_TEXT_CHARS), usedFallback: false, sourceImageUrl };
    }
    return {
      text: compactText(`${candidate.title}\n\n${candidate.snippet}`, 1400),
      usedFallback: true,
      sourceImageUrl,
    };
  } catch (error) {
    console.warn(`[daily-news] article extraction failed for ${candidate.sourceUrl}:`, error);
  }

  return {
    text: compactText(`${candidate.title}\n\n${candidate.snippet}`, 1400),
    usedFallback: true,
    sourceImageUrl: null,
  };
}

function validateGeneratedLesson(value: GeneratedDailyNewsLesson): void {
  if (!value.title || !value.article_body) throw new Error("Generated lesson is missing title/article_body");
  if (!Array.isArray(value.vocabulary) || value.vocabulary.length < 6) throw new Error("Generated lesson needs 6 vocabulary items");
  if (!Array.isArray(value.comprehension_questions) || value.comprehension_questions.length < 5) {
    throw new Error("Generated lesson needs 5 comprehension questions");
  }
  if (!Array.isArray(value.discussion_questions) || value.discussion_questions.length < 5) {
    throw new Error("Generated lesson needs 5 discussion questions");
  }
  if (!Array.isArray(value.further_discussion_questions) || value.further_discussion_questions.length < 3) {
    throw new Error("Generated lesson needs 3 further discussion questions");
  }
}

export async function generateLessonJson(
  openai: OpenAI,
  candidate: NewsCandidate,
  sourceText: string,
  usedFallback: boolean,
  config: DailyNewsConfig
): Promise<GeneratedDailyNewsLesson> {
  const lengthSpec = ARTICLE_LENGTH_BY_LEVEL[config.targetLevel] || ARTICLE_LENGTH_BY_LEVEL.B1;
  const questionDifficulty = QUESTION_DIFFICULTY_BY_LEVEL[config.targetLevel] || QUESTION_DIFFICULTY_BY_LEVEL.B1;
  const completion = await withRetries(
    () =>
      openai.chat.completions.create({
        model: config.openaiModel,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You create ${config.language === "fr" ? "French" : "English"}-learning lessons from news stories, in the style of Engoo Daily News. Write the title, article_body, vocabulary, and all questions in YOUR OWN words, IN ${config.language === "fr" ? "FRENCH" : "ENGLISH"} (the language being learned), at CEFR level ${config.targetLevel}. Produce a JSON object with fields ONLY: title, article_body, vocabulary, comprehension_questions, discussion_questions, further_discussion_questions, image_query, image_subject.\n` +
              `- title: a clear, learner-friendly headline in ${config.language === "fr" ? "French" : "English"} (max ~12 words).\n` +
              `- article_body: ${lengthSpec.words} words in ${config.language === "fr" ? "French" : "English"}, EXACTLY ${lengthSpec.paragraphs} paragraphs (separate paragraphs with a blank line), neutral tone, no invented facts. Use longer, more complex sentences for higher levels and shorter, simpler ones for lower levels. If the source material contains a direct quote or reported direct speech from a named person, include at least one real quote (translated/adapted into ${config.language === "fr" ? "French" : "English"} if needed, attributed to who said it, using quotation marks) — it makes the story feel alive instead of a flat summary. Never invent a quote that isn't grounded in the source.\n` +
              `- vocabulary: EXACTLY 6 items {word, ipa, part_of_speech, definition, example} — word/definition/example in ${config.language === "fr" ? "French" : "English"}; part_of_speech stays in English (e.g. "noun", "verb"); choose useful words that appear in your article; the example must use the word in a natural sentence.\n` +
              `- comprehension_questions: EXACTLY 5 items, each an object {question, answer} (both in ${config.language === "fr" ? "French" : "English"}), at THIS difficulty for CEFR ${config.targetLevel}: ${questionDifficulty} Push the difficulty a notch harder than a typical ${config.targetLevel} textbook would — these should make a learner genuinely re-read the article, not just recall it. The "answer" is the tutor's model answer to THAT specific question: a concise, correct 1-2 sentence response grounded ONLY in the article (each answer must be DIFFERENT and actually answer its own question — never repeat the same answer). Do not invent facts not in the article.\n` +
              `- discussion_questions: EXACTLY 5 opinion/experience questions (in ${config.language === "fr" ? "French" : "English"}) related to the topic.\n` +
              `- further_discussion_questions: EXACTLY 3 deeper/abstract questions (in ${config.language === "fr" ? "French" : "English"}).\n` +
              `- image_subject: the SINGLE specific real named person, organization, place, or event this story is centrally about (e.g. "Andy Burnham", "NASA Psyche spacecraft", "Wimbledon") — ALWAYS in English regardless of lesson language, used to find an ACTUAL accurate solo photo of that exact subject. Only fill this in if you are confident a real, clearly-labelled photo of THIS exact subject (not a similarly-named or same-role different person, and not a group/crowd photo) is likely to exist. Leave empty ("") if the story has no single clear named subject, or if the subject is a role/title rather than one specific named entity (e.g. "the health secretary" without naming who).\n` +
              `- image_query: a concrete 2-4 word generic stock-photo search phrase describing the scene — ALWAYS in English, used ONLY if no real photo of image_subject can be found (e.g. "coffee cup desk", "video game controller").\n` +
              `If the provided text is only a short snippet, stay conservative: do not invent names, numbers, or quotes. Return only JSON.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              source_title: candidate.title,
              source_name: candidate.sourceName,
              source_url: candidate.sourceUrl,
              category: candidate.category,
              fallback_snippet_only: usedFallback,
              source_text: sourceText,
            }),
          },
        ],
      }),
    2
  );
  const raw = completion.choices[0]?.message.content || "{}";
  const lesson = parseJsonObject<GeneratedDailyNewsLesson>(raw);
  validateGeneratedLesson(lesson);
  return lesson;
}

// ── Wikimedia Commons (real photos of named people/places/events, free +
//    properly licensed with author attribution) ─────────────────────────────

interface WikimediaCandidate {
  url: string;
  width: number;
  height: number;
  artist: string | null;
  license: string | null;
  pageTitle: string;
}

async function searchWikimediaCommons(query: string): Promise<WikimediaCandidate[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6", // File: namespace
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size|mime",
    iiurlwidth: "1200",
    format: "json",
    origin: "*",
  });
  const res = await fetchWithTimeout(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {}, 10000);
  if (!res.ok) throw new Error(`Wikimedia Commons returned ${res.status}`);
  const body = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            url?: string;
            thumburl?: string;
            width?: number;
            height?: number;
            mime?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };

  const pages = Object.values(body.query?.pages || {});
  const candidates: WikimediaCandidate[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (info.mime && !info.mime.startsWith("image/")) continue;
    if (info.mime === "image/svg+xml") continue; // icons/diagrams, not photos
    const width = info.width || 0;
    const height = info.height || 0;
    if (width < 600 || height < 350) continue; // too small for a banner
    const artistRaw = info.extmetadata?.Artist?.value;
    candidates.push({
      url: info.thumburl || info.url || "",
      width,
      height,
      artist: artistRaw ? stripHtml(artistRaw) : null,
      license: info.extmetadata?.LicenseShortName?.value || null,
      pageTitle: page.title || "",
    });
  }
  return candidates.filter((c) => !!c.url);
}

function pickBestWikimediaCandidate(candidates: WikimediaCandidate[]): WikimediaCandidate | null {
  if (!candidates.length) return null;
  // `candidates` is already relevance-ordered by Commons' own search (the
  // strongest signal that it's actually the right subject). Only use
  // landscape/size as a tie-breaker among the top few relevance results,
  // rather than re-sorting the whole list by aspect ratio (which previously
  // could promote a less-relevant but more-landscape image to the top).
  const top = candidates.slice(0, 3);
  const landscapeInTop = top.find((c) => c.width / Math.max(1, c.height) >= 1.1);
  return landscapeInTop || candidates[0];
}

// Wikipedia's own infobox photo for a subject's article is curated by
// editors specifically to depict THAT subject (almost always a solo
// portrait for a person) — far more precise than a free-text Commons
// search, which can surface any file merely tagged/captioned with the name,
// including group or event photos where the subject is one of several
// people pictured. This is tried first; a subject with no Wikipedia article
// (or no image on it) falls through to the Commons search below.
async function fetchWikipediaPortrait(subject: string): Promise<BannerImage | null> {
  const trimmed = subject.trim();
  if (!trimmed) return null;
  try {
    const search = async (query: string) => {
      const params = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrlimit: "1",
        gsrnamespace: "0",
        prop: "pageimages|info",
        piprop: "original",
        inprop: "url",
        format: "json",
        origin: "*",
      });
      const res = await fetchWithTimeout(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {}, 10000);
      if (!res.ok) return null;
      const body = (await res.json()) as {
        query?: { pages?: Record<string, { title?: string; original?: { source?: string } }> };
      };
      const page = Object.values(body.query?.pages || {})[0];
      if (!page?.original?.source) return null;
      return page;
    };

    const page = (await search(`intitle:"${trimmed}"`)) || (await search(trimmed));
    if (!page?.original?.source) return null;

    // The infobox image is hosted on Commons; look it up there by filename to
    // get proper artist/license attribution for the credit line.
    const filename = decodeURIComponent(page.original.source.split("/").pop() || "");
    if (!filename) return null;
    const params = new URLSearchParams({
      action: "query",
      titles: `File:${filename}`,
      prop: "imageinfo",
      iiprop: "extmetadata|url",
      iiurlwidth: "1200",
      format: "json",
      origin: "*",
    });
    const res = await fetchWithTimeout(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {}, 10000);
    const body = res.ok
      ? ((await res.json()) as {
          query?: {
            pages?: Record<
              string,
              { imageinfo?: Array<{ thumburl?: string; url?: string; extmetadata?: Record<string, { value?: string }> }> }
            >;
          };
        })
      : undefined;
    const info = Object.values(body?.query?.pages || {})[0]?.imageinfo?.[0];
    const artistRaw = info?.extmetadata?.Artist?.value;

    return {
      url: info?.thumburl || info?.url || page.original.source,
      credit_name: (artistRaw && stripHtml(artistRaw)) || "Wikipedia contributor",
      credit_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title || trimmed)}`,
      query_used: subject,
      source: "wikimedia",
      license: info?.extmetadata?.LicenseShortName?.value || undefined,
    };
  } catch (error) {
    console.warn(`[daily-news] Wikipedia portrait lookup failed for "${subject}":`, error);
    return null;
  }
}

async function fetchWikimediaImage(query: string): Promise<BannerImage | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const portrait = await fetchWikipediaPortrait(trimmed);
  if (portrait) return portrait;

  try {
    // Exact-phrase title search first: requires the full name/phrase to
    // literally appear in the file title, which avoids loose keyword
    // collisions (e.g. singer "Ella Langley" matching a street named
    // "Ella Bank Road, Langley", or a person's name loosely matching an
    // unrelated document that happens to share a word). Only fall back to a
    // looser full-text search if the exact phrase has no hits at all.
    //
    // NOTE: this Commons full-text fallback only runs when the subject has
    // no Wikipedia article/image at all, so it's inherently a lower-
    // precision path — a plain-text file caption match, not a curated
    // infobox photo. Still exact-phrase-first to limit false positives.
    const exact = await searchWikimediaCommons(`intitle:"${trimmed}"`);
    const candidates = exact.length ? exact : await searchWikimediaCommons(trimmed);
    const best = pickBestWikimediaCandidate(candidates);
    if (!best) return null;
    return {
      url: best.url,
      credit_name: best.artist || "Wikimedia Commons contributor",
      credit_url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.pageTitle)}`,
      query_used: query,
      source: "wikimedia",
      license: best.license || undefined,
    };
  } catch (error) {
    console.warn(`[daily-news] Wikimedia Commons search failed for "${query}":`, error);
    return null;
  }
}

// ── Pexels (generic stock fallback, for topics with no clear named subject) ─

async function fetchPexelsImage(query: string): Promise<BannerImage | null> {
  if (!process.env.PEXELS_API_KEY || !query) return null;
  try {
    const params = new URLSearchParams({ query, orientation: "landscape", size: "large", per_page: "1" });
    const res = await fetchWithTimeout(`https://api.pexels.com/v1/search?${params.toString()}`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    if (!res.ok) throw new Error(`Pexels returned ${res.status}`);
    const body = (await res.json()) as {
      photos?: Array<{
        url?: string;
        photographer?: string;
        photographer_url?: string;
        src?: { landscape?: string; large2x?: string; large?: string };
      }>;
    };
    const photo = body.photos?.[0];
    const photoUrl = photo?.src?.landscape || photo?.src?.large2x || photo?.src?.large;
    if (!photo || !photoUrl) return null;
    return {
      url: photoUrl,
      credit_name: photo.photographer || "Pexels",
      credit_url: photo.photographer_url || photo.url || null,
      query_used: query,
      source: "pexels",
    };
  } catch (error) {
    console.warn(`[daily-news] Pexels failed for "${query}":`, error);
    return null;
  }
}

// ── Source article's own lead image (og:image) — the most precise option:
//    it's literally the photo the publisher chose to illustrate THIS exact
//    story (a spacecraft, an event, a product — not just a named person),
//    so it can't be topically wrong the way a keyword-searched stock photo
//    can. Credited back to the publisher, not rehosted as our own.

const IMAGE_EXT_BLOCKLIST = /\.(svg|ico)(\?|$)/i;

function fetchSourceArticleImage(sourceImageUrl: string | null, candidate: NewsCandidate): BannerImage | null {
  if (!sourceImageUrl) return null;
  if (IMAGE_EXT_BLOCKLIST.test(sourceImageUrl)) return null; // logo/favicon, not a photo
  let hostname = "";
  try {
    hostname = new URL(candidate.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    // ignore
  }
  return {
    url: sourceImageUrl,
    credit_name: candidate.sourceName || hostname || "the source",
    credit_url: candidate.sourceUrl,
    query_used: candidate.title,
    source: "source-article",
  };
}

// ── Orchestration: source article's own image (most precise, credited to
//    the publisher) -> Wikimedia (named subject ONLY — its search is tuned
//    for encyclopedic subjects, not generic scenes, so a loose "coffee cup
//    desk" query can match something unrelated) -> Pexels (generic query) ->
//    per-category placeholder. ───────────────────────────────────────────────

// Generic role/title phrases (no specific person's name attached) are unsafe
// to search on Wikimedia by "subject" — e.g. "U.K. Prime Minister" can match a
// photo of a DIFFERENT, unrelated person who once held that role. Only reject
// an exact/near-exact match against this phrase, not any subject that merely
// contains one of these words (so "NASA Psyche spacecraft" is unaffected).
const GENERIC_ROLE_PHRASES = new Set([
  "prime minister", "the prime minister", "new prime minister",
  "president", "the president", "new president",
  "ceo", "the ceo", "chairman", "the chairman",
  "governor", "the governor", "mayor", "the mayor",
  "minister", "the minister", "spokesperson", "official", "government",
  "the government", "administration", "the administration",
]);

function isGenericRolePhrase(subject: string): boolean {
  const normalized = subject.trim().toLowerCase().replace(/^(u\.?k\.?|us|u\.?s\.?a?\.?)\s+/, "");
  return GENERIC_ROLE_PHRASES.has(normalized);
}

export async function fetchBannerImage(
  category: DailyNewsCategory,
  imageQuery: string | undefined,
  imageSubject?: string,
  sourceImageUrl?: string | null,
  candidate?: NewsCandidate
): Promise<BannerImage> {
  const fallback: BannerImage = {
    url: CATEGORY_PLACEHOLDERS[category],
    credit_name: "FrancoLink",
    credit_url: null,
    query_used: imageSubject || imageQuery || category,
    source: "placeholder",
  };

  if (sourceImageUrl && candidate) {
    const fromSource = fetchSourceArticleImage(sourceImageUrl, candidate);
    if (fromSource) return fromSource;
  }
  if (imageSubject && !isGenericRolePhrase(imageSubject)) {
    const bySubject = await fetchWikimediaImage(imageSubject);
    if (bySubject) return bySubject;
  }
  if (imageQuery) {
    const pexels = await fetchPexelsImage(imageQuery);
    if (pexels) return pexels;
  }
  return fallback;
}

function questionsWithAnswers(
  questions: Array<{ question: string; answer: string }> | string[],
  article: string
): Array<{ question: string; answer: string }> {
  // Fallback answer only used when the model didn't supply one (or for legacy
  // string-only generations) — the first sentence of the article.
  const fallback = compactText(article.split(/[.!?]\s+/).find(Boolean) || "See the article for details.", 180);
  return questions.slice(0, 5).map((q) => {
    if (typeof q === "string") return { question: q, answer: fallback };
    return {
      question: q.question,
      answer: compactText(q.answer || fallback, 400),
    };
  });
}

// Static UI chrome (section titles/instructions, objectives, tips) matches
// the lesson's own language, same convention as every other lesson on the
// site (French lessons have French instructions throughout).
const UI_STRINGS: Record<DailyNewsLanguage, {
  vocabTitle: string; vocabStudent: string; vocabTutor: string; vocabNote: string;
  articleTitle: string; articleStudent: string; articleTutor: string;
  discussionTitle: string; discussionStudent: string; discussionTutor: string;
  furtherTitle: string; furtherStudent: string; furtherTutor: string;
  objective1: string; objective1CanDo: (level: string) => string;
  objective2: string; objective2CanDo: string;
  objective3: string; objective3CanDo: string;
  tip1: string; tip2: string; tip3: string;
  teachingTip1: string; teachingTip2: string;
  mistake1: string; mistake2: string;
}> = {
  en: {
    vocabTitle: "Vocabulary", vocabStudent: "Study these key words before reading — you'll meet them in the article.",
    vocabTutor: "Check pronunciation and ask the learner to guess the topic from these words before reading.",
    vocabNote: "Daily News vocabulary",
    articleTitle: "Article", articleStudent: "Read the article, then answer the comprehension questions.",
    articleTutor: "Ask the learner to summarize each paragraph in their own words before answering.",
    discussionTitle: "Discussion", discussionStudent: "Share your opinions and experiences with your tutor.",
    discussionTutor: "Encourage full-sentence answers and follow-up questions.",
    furtherTitle: "Further Discussion", furtherStudent: "Think more deeply about the topic and explain your reasons.",
    furtherTutor: "Let the learner lead, then correct gently after they finish each answer.",
    objective1: "Read and understand a current news story in English.",
    objective1CanDo: (level) => `Can understand the main points of a short ${level} news article.`,
    objective2: "Use six news-related vocabulary words in context.",
    objective2CanDo: "Can explain and reuse key words from a familiar topic.",
    objective3: "Discuss opinions and predictions about a real-world topic.",
    objective3CanDo: "Can give reasons for opinions in a guided conversation.",
    tip1: "Read once for the main idea before checking vocabulary.",
    tip2: "Use the discussion questions to practice giving reasons.",
    tip3: "Open the source link after class if you want more context.",
    teachingTip1: "Start with the headline and ask the learner to predict the story.",
    teachingTip2: "Avoid debating unknown facts; keep the focus on clear English expression.",
    mistake1: "Copying phrases from the article without explaining them.",
    mistake2: "Giving one-word answers to opinion questions.",
  },
  fr: {
    vocabTitle: "Vocabulaire", vocabStudent: "Étudie ces mots clés avant la lecture — tu les retrouveras dans l'article.",
    vocabTutor: "Vérifie la prononciation et demande à l'apprenant de deviner le sujet à partir de ces mots avant de lire.",
    vocabNote: "Vocabulaire Daily News",
    articleTitle: "Article", articleStudent: "Lis l'article, puis réponds aux questions de compréhension.",
    articleTutor: "Demande à l'apprenant de résumer chaque paragraphe avec ses propres mots avant de répondre.",
    discussionTitle: "Discussion", discussionStudent: "Partage tes opinions et expériences avec ton tuteur.",
    discussionTutor: "Encourage des réponses en phrases complètes et pose des questions de relance.",
    furtherTitle: "Pour aller plus loin", furtherStudent: "Réfléchis plus en profondeur au sujet et explique tes raisons.",
    furtherTutor: "Laisse l'apprenant s'exprimer, puis corrige avec douceur après chaque réponse.",
    objective1: "Lire et comprendre une actualité récente en français.",
    objective1CanDo: (level) => `Peut comprendre l'essentiel d'un court article d'actualité de niveau ${level}.`,
    objective2: "Utiliser six mots de vocabulaire liés à l'actualité en contexte.",
    objective2CanDo: "Peut expliquer et réutiliser des mots clés sur un sujet familier.",
    objective3: "Discuter d'opinions et de prédictions sur un sujet réel.",
    objective3CanDo: "Peut donner des raisons pour justifier une opinion dans une conversation guidée.",
    tip1: "Lis une première fois pour l'idée générale avant de vérifier le vocabulaire.",
    tip2: "Utilise les questions de discussion pour t'entraîner à justifier tes opinions.",
    tip3: "Ouvre le lien source après la leçon si tu veux plus de contexte.",
    teachingTip1: "Commence par le titre et demande à l'apprenant de deviner l'histoire.",
    teachingTip2: "Évite de débattre de faits inconnus ; concentre-toi sur une expression claire en français.",
    mistake1: "Recopier des phrases de l'article sans les expliquer.",
    mistake2: "Donner des réponses en un seul mot aux questions d'opinion.",
  },
};

export function buildTutorLesson(
  category: DailyNewsCategory,
  candidate: NewsCandidate,
  generated: GeneratedDailyNewsLesson,
  bannerImage: BannerImage,
  level: string,
  language: DailyNewsLanguage = "en"
): Lesson {
  const t = UI_STRINGS[language];
  const vocabItems: VocabItem[] = generated.vocabulary.slice(0, 6).map((item) => ({
    term: item.word,
    translation: item.definition,
    part_of_speech: item.part_of_speech,
    pronunciation: item.ipa,
    example: item.example,
    note: t.vocabNote,
    image_query: item.word,
  }));

  const sections: Section[] = [
    {
      kind: "vocabulary_with_examples",
      number: 1,
      title: t.vocabTitle,
      student_instruction: t.vocabStudent,
      tutor_instruction: t.vocabTutor,
      items: vocabItems,
    },
    {
      kind: "reading_comprehension",
      number: 2,
      title: t.articleTitle,
      student_instruction: t.articleStudent,
      tutor_instruction: t.articleTutor,
      passage: generated.article_body,
      image_url: bannerImage.url,
      image_hint: bannerImage.credit_name
        ? `Photo: ${bannerImage.credit_name}${
            bannerImage.source === "wikimedia"
              ? ` (${bannerImage.license || "CC"}) via Wikimedia Commons`
              : bannerImage.source === "pexels"
                ? " / Pexels"
                : bannerImage.source === "source-article"
                  ? " (source article)"
                  : ""
          }`
        : bannerImage.query_used,
      questions: questionsWithAnswers(generated.comprehension_questions, generated.article_body),
    },
    {
      kind: "free_response",
      number: 3,
      title: t.discussionTitle,
      student_instruction: t.discussionStudent,
      tutor_instruction: t.discussionTutor,
      questions: generated.discussion_questions.slice(0, 5),
    },
    {
      kind: "free_response",
      number: 4,
      title: t.furtherTitle,
      student_instruction: t.furtherStudent,
      tutor_instruction: t.furtherTutor,
      questions: generated.further_discussion_questions.slice(0, 3),
    },
  ];

  return {
    slug: "",
    title: generated.title,
    language,
    level,
    duration_minutes: 25,
    topic_tags: ["Daily News", category, candidate.sourceName || "News"].filter(Boolean),
    objectives: [
      { student_label: t.objective1, skill: "reading", cefr_can_do: t.objective1CanDo(level) },
      { student_label: t.objective2, skill: "vocabulary", cefr_can_do: t.objective2CanDo },
      { student_label: t.objective3, skill: "speaking", cefr_can_do: t.objective3CanDo },
    ],
    learning_tips: [t.tip1, t.tip2, t.tip3],
    tutor_overview: {
      skills_covered: ["reading", "vocabulary", "speaking"],
      estimated_minutes: 25,
      teaching_tips: [
        t.teachingTip1,
        t.teachingTip2,
        `Source: ${candidate.sourceName || "Google News"} (${candidate.sourceUrl})`,
      ],
      common_mistakes: [t.mistake1, t.mistake2],
    },
    hero_image_hint: generated.image_query || category,
    hero_image_url: bannerImage.url,
    sections,
  };
}

export async function buildDailyNewsLesson(
  openai: OpenAI,
  candidate: NewsCandidate,
  config: DailyNewsConfig
): Promise<BuiltLesson> {
  const { text, usedFallback, sourceImageUrl } = await extractArticleText(candidate);
  const generated = await generateLessonJson(openai, candidate, text, usedFallback, config);
  const bannerImage = await fetchBannerImage(
    candidate.category,
    generated.image_query || generated.title,
    generated.image_subject,
    sourceImageUrl,
    candidate
  );
  const lesson = buildTutorLesson(candidate.category, candidate, generated, bannerImage, config.targetLevel, config.language);
  return { lesson, generated, bannerImage };
}

async function createRunLog(
  supabase: DbClient,
  config: DailyNewsConfig,
  mode: "dry-run" | "live"
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("daily_news_runs")
    .insert({
      mode,
      categories: config.categories,
      target_cefr_level: config.targetLevel,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create daily news run: ${error.message}`);
  return (data as InsertedRun).id;
}

async function updateRunLog(
  supabase: DbClient,
  runId: string | undefined,
  result: DailyNewsRunResult,
  details: Record<string, unknown>
) {
  if (!runId) return;
  await supabase
    .from("daily_news_runs")
    .update({
      fetched_count: result.fetched,
      selected_count: result.selected,
      generated_count: result.generated,
      failed_count: result.failed,
      published_count: result.published,
      details,
    })
    .eq("id", runId);
}

export async function runDailyNewsPipeline(
  supabase: DbClient,
  options: RunOptions = {}
): Promise<DailyNewsRunResult> {
  const config = getDailyNewsConfig(options.config);
  const mode = options.dryRun ? "dry-run" : "live";
  const result: DailyNewsRunResult = {
    ok: true,
    mode,
    fetched: 0,
    selected: 0,
    generated: 0,
    failed: 0,
    published: 0,
    candidates: [],
    selectedCandidates: [],
    lessons: [],
    errors: [],
  };

  let runId: string | undefined;
  try {
    runId = options.dryRun ? undefined : await createRunLog(supabase, config, mode);
    result.runId = runId;

    const fetched = await fetchGoogleNewsCandidates(config);
    result.fetched = fetched.length;
    result.candidates = fetched;

    const candidates = options.dryRun ? fetched : await filterExistingCandidates(supabase, fetched);
    const openai = getOpenAI();
    const scored = await scoreCandidates(openai, candidates, config);
    const selected = selectCandidates(scored, config);
    result.selected = selected.length;
    result.selectedCandidates = selected;

    if (options.dryRun) {
      await updateRunLog(supabase, runId, result, { selected });
      return result;
    }

    for (const candidate of selected) {
      try {
        const built = await buildDailyNewsLesson(openai, candidate, config);
        const datePart = new Date().toISOString().slice(0, 10);
        const slug = `daily-news-${candidate.category}-${datePart}-${slugify(built.lesson.title)}-${candidate.contentHash.slice(0, 8)}`;
        built.lesson.slug = slug;

        const status = config.autoPublish ? "published" : "review";
        const { data: inserted, error: lessonError } = await supabase
          .from("tutor_lessons")
          .insert({
            slug,
            title: built.lesson.title,
            language: config.language,
            level: config.targetLevel,
            duration_minutes: built.lesson.duration_minutes,
            topic_tags: built.lesson.topic_tags,
            source_url: candidate.sourceUrl,
            status,
            content: built.lesson,
            conversion_notes: null,
            published_at: config.autoPublish ? new Date().toISOString() : null,
          })
          .select("id, slug, title")
          .single();

        if (lessonError) throw new Error(lessonError.message);
        const lessonRow = inserted as InsertedLesson;

        const { error: metaError } = await supabase.from("daily_news_lessons").insert({
          lesson_id: lessonRow.id,
          run_id: runId,
          category: candidate.category,
          cefr_level: config.targetLevel,
          source_name: candidate.sourceName,
          source_url: candidate.sourceUrl,
          published_at: candidate.publishedAt,
          content_hash: candidate.contentHash,
          feed_rank: candidate.feedRank,
          score: candidate.score,
          banner_image: built.bannerImage,
        });
        if (metaError) throw new Error(metaError.message);

        result.generated++;
        if (config.autoPublish) result.published++;
        result.lessons.push({
          id: lessonRow.id,
          slug: lessonRow.slug,
          title: lessonRow.title,
          category: candidate.category,
        });
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`${candidate.title}: ${message}`);
        console.error(`[daily-news] generation failed for ${candidate.title}:`, error);
      }
    }
  } catch (error) {
    result.ok = false;
    result.failed++;
    result.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    await updateRunLog(supabase, runId, result, {
      errors: result.errors,
      lessons: result.lessons,
      selected: result.selectedCandidates.map((item) => ({
        title: item.title,
        category: item.category,
        source_url: item.sourceUrl,
        score: item.score,
      })),
    });
  }

  return result;
}
