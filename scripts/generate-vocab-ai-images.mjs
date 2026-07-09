#!/usr/bin/env node
// scripts/generate-vocab-ai-images.mjs
//
// Generates AI illustrations for vocabulary items using Cloudflare Workers AI
// (FLUX-1-schnell). Caches each image in Supabase Storage and writes the
// public URL back to lessons.content.vocabulary[].image. Scoped to vocab
// items that belong to a playable game theme by default.
//
// Usage:
//   node --env-file=.env.local scripts/generate-vocab-ai-images.mjs                # dry-run counts
//   node --env-file=.env.local scripts/generate-vocab-ai-images.mjs --apply        # generate + upload
//   node --env-file=.env.local scripts/generate-vocab-ai-images.mjs --apply --limit=5    # smoke test
//   node --env-file=.env.local scripts/generate-vocab-ai-images.mjs --apply --lang=fr
//   node --env-file=.env.local scripts/generate-vocab-ai-images.mjs --apply --force      # regen even if already AI
//
// Resume-safe: by default skips items whose image already lives under the
// AI prefix in Supabase Storage.

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : Infinity;
})();
const LANG = process.argv.find((a) => a.startsWith("--lang="))?.split("=")[1] || "fr";
const ONLY_THEME = process.argv.find((a) => a.startsWith("--theme="))?.split("=")[1] || null;

const BUCKET = "lesson-images";
const PREFIX = "vocab-ai";
const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const THROTTLE_MS = 350;

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (APPLY && (!ACCOUNT_ID || !API_TOKEN)) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN. Add them to .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Inline theme classifier (kept in lockstep with src/lib/games/themes.ts) ──
const THEMES = [
  ["animals",  "animal", ["animal","cat","dog","kitten","puppy","cow","horse","bird","fish","sheep","pig","piglet","rabbit","mouse","rat","lion","tiger","bear","elephant","monkey","gorilla","ape","duck","duckling","chicken","hen","rooster","wolf","fox","spider","ant","bee","wasp","butterfly","snake","lizard","frog","toad","turtle","tortoise","kangaroo","goat","camel","whale","dolphin","shark","squirrel","deer","donkey","crocodile","alligator","penguin","panda","owl","eagle","seagull","parrot","pigeon","hedgehog","ladybug","caterpillar","worm","crab","octopus","lobster","hamster","ferret","giraffe","zebra","hippo","rhino","cheetah","leopard","jaguar","peacock","swan","goose","buffalo","bison","insect","reptile","mammal","creature","beast"]],
  ["food",     "dish or drink", ["food","meal","breakfast","lunch","dinner","supper","snack","dessert","starter","bread","baguette","croissant","cheese","milk","yogurt","yogourt","cream","butter","egg","eggs","water","wine","coffee","tea","juice","beer","cocktail","lemonade","soda","drink","meat","beef","pork","chicken","ham","sausage","bacon","steak","fish","salmon","tuna","shrimp","rice","pasta","noodle","noodles","spaghetti","soup","salad","stew","sauce","gravy","pizza","sandwich","burger","fruit","apple","banana","orange","grape","grapes","strawberry","raspberry","blueberry","cherry","pear","peach","plum","kiwi","mango","pineapple","lemon","lime","watermelon","melon","fig","coconut","vegetable","tomato","potato","carrot","onion","garlic","mushroom","pepper","cucumber","lettuce","cabbage","spinach","broccoli","corn","pea","peas","bean","beans","eggplant","aubergine","zucchini","courgette","pumpkin","sugar","salt","oil","vinegar","honey","jam","chocolate","candy","sweet","cookie","cake","muffin","pie","tart","biscuit","pastry"]],
  ["clothes",  "clothing item", ["clothes","clothing","outfit","shirt","t-shirt","tshirt","blouse","pants","trousers","jeans","shorts","dress","skirt","skort","jacket","coat","raincoat","sweater","jumper","hoodie","cardigan","vest","waistcoat","suit","tie","sock","socks","shoe","shoes","sneaker","sneakers","sandal","sandals","boot","boots","slipper","heel","heels","hat","cap","beanie","scarf","glove","gloves","mitten","mittens","belt","apron","uniform","underwear","pyjama","pajama","robe","bathrobe","watch","jewelry","necklace","bracelet","ring","earring","glasses","sunglasses","backpack","handbag","purse","wallet","umbrella"]],
  ["body",     "body part", ["body","head","hair","face","forehead","eyebrow","eye","eyes","ear","ears","nose","mouth","lip","lips","tongue","tooth","teeth","cheek","chin","jaw","beard","moustache","mustache","neck","shoulder","shoulders","arm","arms","elbow","wrist","hand","hands","finger","fingers","thumb","palm","chest","stomach","belly","back","hip","hips","waist","leg","legs","thigh","knee","knees","ankle","foot","feet","toe","toes","heel","skin","bone","muscle","blood","heart","brain","lung","lungs","liver","kidney","throat","spine","nail","nails"]],
  ["family",   "family member", ["family","mother","father","mom","mum","dad","daddy","mommy","mummy","parent","parents","brother","sister","sibling","son","daughter","child","children","kid","baby","infant","toddler","twin","twins","grandmother","grandfather","grandma","grandpa","granny","granddad","grandparent","grandparents","grandchild","grandson","granddaughter","aunt","uncle","cousin","nephew","niece","husband","wife","spouse","partner","fiancé","fiancée","boyfriend","girlfriend","relative","ancestor"]],
  ["home",     "household item", ["house","home","apartment","flat","studio","cabin","cottage","villa","mansion","tent","castle","room","bedroom","bathroom","kitchen","living room","dining room","hallway","hall","attic","basement","garage","study","office","door","window","wall","floor","ceiling","roof","stairs","balcony","garden","yard","fence","gate","chimney","fireplace","table","chair","bed","sofa","couch","armchair","desk","stool","bench","lamp","light","mirror","shelf","cupboard","cabinet","wardrobe","drawer","carpet","rug","curtain","blinds","pillow","cushion","blanket","sheet","bedding","key","clock","plate","cup","mug","glass","bottle","bowl","spoon","fork","knife","pot","pan","oven","stove","fridge","refrigerator","microwave","dishwasher","sink","toilet","shower","bathtub","tap","faucet","towel","soap","toothbrush","toothpaste"]],
  ["colors",   "color swatch", ["color","colour","red","blue","green","yellow","black","white","orange","purple","violet","pink","brown","grey","gray","silver","gold","beige","turquoise","cyan","magenta","maroon","navy"]],
  ["numbers",  "number", ["number","zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety","hundred","thousand","million","billion","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth","half","quarter","double","triple","count","odd","even","pair","dozen"]],
  ["actions",  "action verb", ["to go","to come","to run","to walk","to jump","to swim","to sit","to stand","to sleep","to wake","to eat","to drink","to read","to write","to speak","to talk","to listen","to watch","to look","to see","to hear","to play","to work","to study","to learn","to teach","to cook","to clean","to wash","to buy","to sell","to give","to take","to make","to do","to know","to think","to feel","to love","to like","to want","to need","to have","to be","to get","to find","to open","to close","to push","to pull","to fly","to drive","to ride","to dance","to sing","to draw","to paint","to build","to help","to try","to start","to finish","to stop","to wait","to ask","to answer","to tell","to say","to call","to meet","to grow","to fall","to catch","to throw","to fight","to laugh","to cry","to smile","to kiss","to hug","to sit down","to stand up"]],
  ["places",   "place", ["place","city","town","village","country","capital","street","road","avenue","alley","square","park","beach","seaside","coast","mountain","hill","valley","river","lake","pond","sea","ocean","bay","forest","wood","desert","island","field","meadow","farm","prairie","school","university","college","library","museum","cafe","restaurant","bar","pub","shop","store","market","supermarket","mall","bank","post office","station","airport","port","harbor","harbour","factory","office","church","temple","mosque","synagogue","cinema","theatre","theater","stadium","gym","pool","hotel","hostel","motel","bridge","tower","palace","embassy","prison","police station","fire station","hospital","clinic","pharmacy","dentist"]],
  ["travel",   "vehicle or travel item", ["car","bus","train","plane","airplane","aircraft","bicycle","bike","motorcycle","motorbike","scooter","taxi","cab","truck","lorry","van","boat","ship","ferry","sailboat","subway","metro","tram","trolley","tube","helicopter","rocket","ambulance","fire truck","police car","ticket","passport","visa","luggage","suitcase","backpack","trip","journey","voyage","travel","vacation","holiday","tour","map","gps","driver","passenger","conductor","pilot","captain","road","highway","motorway","traffic","intersection","crossing","fuel","gas","petrol","wheel","tire","tyre","engine","steering wheel"]],
  ["weather",  "weather scene", ["weather","rain","rainy","snow","snowy","sun","sunny","sunshine","cloud","cloudy","wind","windy","storm","stormy","fog","foggy","mist","misty","ice","cold","hot","warm","cool","chilly","freezing","temperature","umbrella","hail","thunder","lightning","rainbow"]],
  ["time",     "time concept", ["time","hour","minute","second","day","week","month","year","season","decade","century","spring","summer","autumn","fall","winter","monday","tuesday","wednesday","thursday","friday","saturday","sunday","january","february","march","april","may","june","july","august","september","october","november","december","morning","afternoon","evening","night","midnight","noon","midday","today","tomorrow","yesterday","weekend","now","later","soon","early","late","clock","watch","calendar","date","schedule","appointment"]],
  ["nature",   "nature scene", ["tree","flower","plant","grass","leaf","leaves","forest","wood","stone","rock","mountain","hill","valley","sky","star","moon","sun","cloud","earth","ground","soil","sand","seed","branch","root","bush","shrub","pebble","wave","beach","cave","river","lake","jungle","oak","rose","tulip","daisy","sunflower","lily","cactus","palm","pine","maple","mushroom"]],
  ["sports",   "sport", ["sport","football","soccer","basketball","tennis","baseball","volleyball","hockey","golf","running","swimming","skating","skiing","gym","exercise","ball","game","match","team","player","coach","race","jump","yoga","boxing","karate","judo","cycling","rugby","cricket","surfing","skateboard","wrestling","fitness","workout","championship","goal","score","referee","stadium","court","field","pitch"]],
];

function classifyVocab(translation) {
  if (!translation) return null;
  const norm = translation.toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/^(the|a|an|to)\s+/i, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return null;
  const tokens = new Set(norm.split(" "));
  for (const [slug, , kws] of THEMES) {
    for (const kw of kws) {
      if (kw.includes(" ")) {
        if (norm.includes(kw)) return slug;
      } else if (tokens.has(kw)) {
        return slug;
      }
    }
  }
  return null;
}

function themeLabel(slug) {
  const t = THEMES.find((t) => t[0] === slug);
  return t ? t[1] : "concept";
}

// ─── Prompt builder ─────────────────────────────────────────────────────
// Tight, single-subject prompt so the picture depicts exactly the word and
// nothing else (avoids e.g. bread served next to a random cup). "kid-friendly"
// tripped the NSFW filter, so we use neutral cheerful descriptors.
function promptFor(term, translation, themeSlug, retryVariant = 0) {
  const subject = translation || term;
  // variant 0/1: single isolated subject (kills the bread+random-cup problem).
  // variant 2: a deliberately softer rewording used only if Cloudflare's
  // (flaky) NSFW filter false-trips on the stricter wording.
  if (retryVariant >= 2) {
    return `a cute simple cartoon illustration of ${subject}, plain white background, centered, no text, flashcard style`;
  }
  const tones = [
    "cheerful, vibrant colors, clean lines, soft shapes",
    "friendly, bright wholesome colors, simple shapes",
  ];
  return [
    `one ${subject} by itself`,
    `single subject, centered, isolated`,
    `plain white background`,
    `simple flat illustration, ${tones[retryVariant % tones.length]}`,
    `no text, no letters, no labels`,
    `educational flashcard style`,
  ].join(", ");
}

// ─── Cloudflare Workers AI call ─────────────────────────────────────────
async function generateImage(prompt) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, num_steps: 4 }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudflare AI ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const base64 = json?.result?.image;
  if (!base64) throw new Error(`No image: ${JSON.stringify(json).slice(0, 200)}`);
  return Buffer.from(base64, "base64");
}

// ─── Storage helpers ────────────────────────────────────────────────────
function slugifyTerm(term) {
  return term.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function uploadImage(buffer, filename) {
  const path = `${PREFIX}/${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function alreadyAI(image) {
  return typeof image === "string" && image.includes(`/${PREFIX}/`);
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎨 AI vocab images — ${APPLY ? "APPLY" : "DRY RUN"}  (lang=${LANG})\n`);

  const { data: courses } = await supabase
    .from("courses").select("id, language:languages(code)").eq("is_published", true);
  const courseIds = (courses || []).filter((c) => c.language?.code === LANG).map((c) => c.id);
  if (courseIds.length === 0) {
    console.error(`No published courses for lang=${LANG}`);
    process.exit(1);
  }
  const { data: units } = await supabase.from("units").select("id").in("course_id", courseIds);
  const unitIds = (units || []).map((u) => u.id);
  const { data: lessons } = await supabase.from("lessons").select("id, content").in("unit_id", unitIds);

  const work = [];
  for (const l of lessons || []) {
    const vocab = l.content?.vocabulary || [];
    vocab.forEach((v, idx) => {
      if (!v.term || v.term.length > 28) return;
      const theme = classifyVocab(v.translation);
      if (!theme) return;
      if (ONLY_THEME && theme !== ONLY_THEME) return;
      work.push({
        lessonId: l.id,
        vocabIdx: idx,
        term: v.term,
        translation: v.translation || "",
        theme,
        currentImage: v.image_url || v.image,
      });
    });
  }

  console.log(`Game-themed vocab items: ${work.length}`);
  const todo = work.filter((w) => FORCE || !alreadyAI(w.currentImage));
  console.log(`To (re)generate:         ${todo.length}${FORCE ? " (--force)" : ""}`);
  if (!APPLY) {
    const byTheme = {};
    todo.forEach((w) => (byTheme[w.theme] = (byTheme[w.theme] || 0) + 1));
    console.log("\nBy theme:");
    Object.entries(byTheme).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${v}`));
    console.log("\n(dry run — pass --apply to generate.)\n");
    return;
  }

  // Apply path
  let ok = 0, failed = 0;
  const lessonCache = new Map();
  for (const l of lessons || []) lessonCache.set(l.id, JSON.parse(JSON.stringify(l.content)));

  const slice = todo.slice(0, LIMIT);
  for (let i = 0; i < slice.length; i++) {
    const w = slice[i];
    const filename = `${LANG}-${slugifyTerm(w.term)}.png`;
    process.stdout.write(`[${i + 1}/${slice.length}] ${w.term.padEnd(24).slice(0, 24)} (${w.translation.padEnd(20).slice(0, 20)}) `);
    try {
      // Retry with progressively softer wording if Cloudflare's flaky NSFW
      // filter false-trips on an innocuous term (it does, e.g. "bread").
      let png;
      for (let variant = 0; ; variant++) {
        try {
          png = await generateImage(promptFor(w.term, w.translation, w.theme, variant));
          break;
        } catch (e) {
          if (!/NSFW/i.test(e.message) || variant >= 2) throw e;
        }
      }
      const url = await uploadImage(png, filename);
      const content = lessonCache.get(w.lessonId);
      content.vocabulary[w.vocabIdx].image = url;
      content.vocabulary[w.vocabIdx].image_url = url;
      const { error: upErr } = await supabase.from("lessons").update({ content }).eq("id", w.lessonId);
      if (upErr) throw new Error(`DB update: ${upErr.message}`);
      console.log("✓");
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }

  console.log(`\nDone.  ok=${ok}  failed=${failed}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
