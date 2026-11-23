"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Leon, the AI tutor: a cartoon chameleon perched on a branch, drawn as
 * layered SVG.
 *
 * Three independent layers keep the asset count additive rather than
 * multiplicative (languages + moods, not languages × moods):
 *   1. skin   — one body, recoloured from the language palette via CSS vars
 *   2. outfit — one small accessory per language (never a flag or costume)
 *   3. face   — eyes, mouth and tail, driven by the tutor's live state
 */

export type LeonMood =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "correcting"
  | "celebrating";

interface Palette {
  body: string;
  dark: string;
  light: string;
  bg: string;
  outfit: string;
  accent: string;
}

const PALETTES: Record<string, Palette> = {
  // Country colours. France and the UK share red/white/blue, so each language
  // leads with a different one to stay distinguishable.
  // French: French blue skin, red-and-white striped scarf
  fr: { body: "#2F6FD6", dark: "#1C3F8A", light: "#DCE7FB", bg: "#EAF1FD", outfit: "#E1353A", accent: "#FFFFFF" },
  // Spanish: Spanish gold skin, red neckerchief with gold dots
  es: { body: "#F5BE1E", dark: "#A9780A", light: "#FFF1C2", bg: "#FFF8E1", outfit: "#C8102E", accent: "#FFD54A" },
  // English: British red skin, navy bow tie
  en: { body: "#D7263D", dark: "#8E1424", light: "#FBD7DC", bg: "#FDECEE", outfit: "#012169", accent: "#FFFFFF" },
};

const DEFAULT_PALETTE = PALETTES.fr;

export function leonPalette(language: string): Palette {
  return PALETTES[language] ?? DEFAULT_PALETTE;
}

const GREETINGS: Record<string, string> = { fr: "bonjour", es: "hola", en: "hello" };

export function leonGreeting(language: string): string {
  return GREETINGS[language] ?? "hello";
}

/** Where each pupil looks, per mood, in viewBox units. */
const GAZE: Record<LeonMood, [[number, number], [number, number]]> = {
  idle: [[0, 0], [0, 0]],
  listening: [[3, 1], [-3, 1]],
  thinking: [[-3, -4], [3, -4]],
  speaking: [[1, 1], [-1, 1]],
  correcting: [[3, 4], [3, 4]],
  celebrating: [[0, 0], [0, 0]],
};

const EYES = [
  { cx: 36, cy: 43 },
  { cx: 76, cy: 43 },
];
const EYE_R = 10;

const TAIL = "M76 90 C90 98 108 92 108 78 C108 64 90 62 88 74 C87 82 97 85 99 77";

// Body movement is driven per frame by the motion engine below, which writes
// CSS variables (degrees / viewBox px). Defaults are the resting pose, so a
// still avatar (no engine) simply stands at rest.
const STYLES = `
.leon{--hr:0;--hx:0;--hy:0;--br:0;--bs:0;--hop:0;--tr:0;--al:-18;--ar:18;--brow:0;--sx:0;--sy:0}
.leon-skin{transition:fill .6s ease,stroke .6s ease}
.leon-char{transform-origin:56px 104px;transform:translateY(calc(var(--hop) * 1px)) rotate(calc(var(--br) * 1deg)) scale(1,calc(1 + var(--bs)))}
.leon-head{transform-origin:56px 74px;transform:translate(calc(var(--hx) * 1px),calc(var(--hy) * 1px)) rotate(calc(var(--hr) * 1deg))}
.leon-tail{transform-origin:78px 90px;transform:rotate(calc(var(--tr) * 1deg))}
.leon-arm-l{transform-origin:0 0;transform:translate(39px,79px) rotate(calc(var(--al) * 1deg))}
.leon-arm-r{transform-origin:0 0;transform:translate(77px,79px) rotate(calc(var(--ar) * 1deg))}
.leon-specs{transform:translateY(calc(var(--brow) * 1px))}
.leon-look{transform:translate(calc(var(--sx) * 1px),calc(var(--sy) * 1px))}
.leon-gaze{transition:transform .3s ease}
.leon-pupil{transform-box:fill-box;transform-origin:center;transform:scale(calc(1 + var(--leon-ear,0) * .3))}
.leon-finger{opacity:0;transition:opacity .2s}
.leon[data-mood=correcting] .leon-finger,.leon[data-mood=speaking] .leon-finger{opacity:1}
.leon-lid{transform-box:fill-box;transform-origin:top;transform:scaleY(0);animation:leon-blink 4.6s infinite}
.leon-lid-1{animation-delay:.07s}
.leon-talk{transform-box:fill-box;transform-origin:center;animation:leon-talk .2s ease-in-out infinite alternate}
.leon-tongue{transform-origin:68px 61px;animation:leon-flick .9s ease-out 1 both}
.leon-dot{animation:leon-dot 1.2s ease-in-out infinite}
.leon-spark{transform-box:fill-box;transform-origin:center;animation:leon-spark .8s ease-in-out infinite alternate}
@keyframes leon-blink{0%,92%,100%{transform:scaleY(0)}95%{transform:scaleY(1)}}
@keyframes leon-talk{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
@keyframes leon-flick{0%{transform:scaleX(0)}35%,55%{transform:scaleX(1)}100%{transform:scaleX(0)}}
@keyframes leon-dot{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes leon-spark{from{transform:scale(.5);opacity:.4}to{transform:scale(1.1);opacity:1}}
/* Mouth shapes cross-fade instead of swapping. */
.leon-mouth{opacity:0;transition:opacity .14s ease}
.leon[data-mood=idle] .leon-mouth-idle,.leon[data-mood=correcting] .leon-mouth-idle,
.leon[data-mood=listening] .leon-mouth-listening,.leon[data-mood=thinking] .leon-mouth-thinking,
.leon[data-mood=celebrating] .leon-mouth-celebrating{opacity:1}
/* Lip sync: four shapes picked every frame from his voice. */
.leon-viseme{opacity:0;transition:opacity .04s linear}
.leon[data-mood=speaking][data-live=true][data-mouth="0"] .leon-v0,
.leon[data-mood=speaking][data-live=true][data-mouth="1"] .leon-v1,
.leon[data-mood=speaking][data-live=true][data-mouth="2"] .leon-v2,
.leon[data-mood=speaking][data-live=true][data-mouth="3"] .leon-v3{opacity:1}
.leon[data-mood=speaking]:not([data-live=true]) .leon-mouth-talk{opacity:1}
.leon[data-still=true] *{animation:none!important}
@media (prefers-reduced-motion:reduce){.leon *{animation:none!important}}
`;

export function Leon({
  language = "fr",
  mood = "idle",
  size = 40,
  still = false,
  background = true,
  className,
  voiceLevel,
  micLevel,
}: {
  language?: string;
  mood?: LeonMood;
  size?: number;
  /** Freeze all animation — for older message avatars in the thread. */
  still?: boolean;
  /** Draw the tinted circle behind Leon (and clip him to it). */
  background?: boolean;
  className?: string;
  /** Live loudness of Leon's own voice (0–1), for lip sync while speaking. */
  voiceLevel?: React.MutableRefObject<number>;
  /** Live loudness of the student's mic (0–1), so he reacts while listening. */
  micLevel?: React.MutableRefObject<number>;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);

  // One animation loop drives the whole puppet: no React render per frame.
  const moodRef = useRef(mood);
  const voiceRef = useRef(voiceLevel);
  const micRef = useRef(micLevel);
  useEffect(() => {
    moodRef.current = mood;
    voiceRef.current = voiceLevel;
    micRef.current = micLevel;
  });
  useEffect(() => {
    const el = svgRef.current;
    if (!el || still) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return runPuppet(el, { mood: moodRef, voice: voiceRef, mic: micRef }, reduce);
  }, [still]);
  const p = leonPalette(language);
  const outfit = PALETTES[language] ? language : "fr";
  const happyEyes = mood === "celebrating";

  const vars = {
    "--leon-body": p.body,
    "--leon-dark": p.dark,
    "--leon-light": p.light,
    "--leon-bg": p.bg,
    "--leon-outfit": p.outfit,
    "--leon-accent": p.accent,
  } as React.CSSProperties;

  const skin = { fill: "var(--leon-body)", stroke: "var(--leon-dark)", strokeWidth: 2.5, strokeLinejoin: "round" as const };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`leon ${className ?? ""}`}
      data-mood={mood}
      data-still={still}
      style={vars}
      role="img"
      aria-label={`Leon the AI tutor, ${mood}`}
    >
      <style>{STYLES}</style>
      <defs>
        {EYES.map((e, i) => (
          <clipPath key={i} id={`${uid}-eye${i}`}>
            <circle cx={e.cx} cy={e.cy} r={EYE_R} />
          </clipPath>
        ))}
        <linearGradient id={`${uid}-fr`} x1="0" y1="0" x2="1" y2="0">
          <stop offset=".333" stopColor="#1F4FB4" />
          <stop offset=".333" stopColor="#FFFFFF" />
          <stop offset=".667" stopColor="#FFFFFF" />
          <stop offset=".667" stopColor="#E1353A" />
        </linearGradient>
        <linearGradient id={`${uid}-es`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".3" stopColor="#C8102E" />
          <stop offset=".3" stopColor="#FFC400" />
          <stop offset=".72" stopColor="#FFC400" />
          <stop offset=".72" stopColor="#C8102E" />
        </linearGradient>
        <clipPath id={`${uid}-bow`}>
          <path d="M43 73 L56 79.5 L43 86 Z M69 73 L56 79.5 L69 86 Z" />
        </clipPath>
        <clipPath id={`${uid}-badge`}>
          <circle cx="60" cy="60" r="60" />
        </clipPath>
      </defs>

      {background && <circle className="leon-skin" cx="60" cy="60" r="60" fill="var(--leon-bg)" />}

      <g clipPath={background ? `url(#${uid}-badge)` : undefined}>
        {/* branch */}
        <path fill="#A47148" stroke="#7A5233" strokeWidth="2" d="M-2 101 Q60 96 122 99 L122 109 Q60 106 -2 111 Z" />
        <path fill="none" stroke="#7A5233" strokeWidth="1.5" strokeLinecap="round" opacity=".6" d="M28 104 h8 M86 102 h6" />
        <path fill="#7FB069" stroke="#5B8A47" strokeWidth="1.5" d="M14 100 C8 92 12 86 20 86 C22 93 19 98 14 100 Z" />

        <g className="leon-char">
          {/* ── Layer 1: skin ── */}
          {/* curled tail — drawn as an outlined tube */}
          <g className="leon-tail">
            <path d={TAIL} fill="none" stroke="var(--leon-dark)" strokeWidth="10" strokeLinecap="round" className="leon-skin" />
            <path d={TAIL} fill="none" stroke="var(--leon-body)" strokeWidth="6" strokeLinecap="round" className="leon-skin" />
            <path d="M84 95 l2 -3 M93 95 l1 -3 M101 90 l-2 -2" fill="none" stroke="var(--leon-dark)" strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
          </g>

          {/* body */}
          <path className="leon-skin" {...skin} d="M37 68 C28 82 32 97 44 101 L74 101 C86 97 88 82 78 68 Z" />
          <path className="leon-skin" fill="var(--leon-light)" d="M47 76 C43 86 45 95 51 100 L65 100 C71 95 73 86 69 76 Z" />
          <path className="leon-skin" fill="none" stroke="var(--leon-light)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4" d="M34 86 Q36 94 42 97 M82 86 Q80 94 74 97" />

          {/* mitten feet gripping the branch */}
          <g className="leon-skin" {...skin} strokeWidth="2">
            <path d="M38 92 C36 97 38 101 42 102" fill="none" />
            <ellipse cx="40" cy="101" rx="5" ry="3.6" />
            <ellipse cx="47" cy="101" rx="4.6" ry="3.4" />
            <ellipse cx="69" cy="101" rx="4.6" ry="3.4" />
            <ellipse cx="76" cy="101" rx="5" ry="3.6" />
          </g>

          <g className="leon-head">
            {/* casque (head crest) sits behind the head */}
            <path className="leon-skin" {...skin} d="M28 36 C30 18 44 6 58 3 C66 11 73 22 80 33 Z" />
            <path className="leon-skin" fill="none" stroke="var(--leon-dark)" strokeWidth="2" strokeLinecap="round" opacity=".45" d="M45 20 Q53 14 61 11 M38 29 Q51 22 68 20" />

            <ellipse className="leon-skin" {...skin} cx="56" cy="50" rx="36" ry="26" />
            <path className="leon-skin" fill="var(--leon-light)" d="M24 56 C32 72 80 72 88 56 C78 66 34 66 24 56 Z" />
            <g className="leon-skin" fill="var(--leon-dark)" opacity=".3">
              <circle cx="56" cy="32" r="2.6" />
              <circle cx="49" cy="27" r="1.8" />
              <circle cx="64" cy="27" r="2" />
            </g>

            {/* ── Layer 2: outfit ── */}
            {/* Each accessory carries its country's flag. */}
            {outfit === "fr" && (
              // tricolour scarf: bleu, blanc, rouge
              <g stroke="#1F2937" strokeWidth="1.2" strokeLinejoin="round">
                <path fill={`url(#${uid}-fr)`} d="M31 70 C44 78 68 78 81 70 L82 78 C68 87 44 87 30 78 Z" />
                <path fill={`url(#${uid}-fr)`} d="M58 80 L72 96 L58 96 L55 82 Z" />
              </g>
            )}
            {outfit === "es" && (
              // neckerchief in the Spanish flag's red, gold, red bands
              <path fill={`url(#${uid}-es)`} stroke="#1F2937" strokeWidth="1.2" strokeLinejoin="round" d="M31 70 C44 78 68 78 81 70 L56 94 Z" />
            )}
            {outfit === "en" && (
              // Union Jack bow tie
              <g>
                <g clipPath={`url(#${uid}-bow)`}>
                  <rect x="42" y="72" width="28" height="15" fill="#012169" />
                  <path stroke="#FFFFFF" strokeWidth="3" d="M43 73 L56 86 M43 86 L56 73 M69 73 L56 86 M69 86 L56 73" />
                  <path stroke="#C8102E" strokeWidth="1.1" d="M43 73 L56 86 M43 86 L56 73 M69 73 L56 86 M69 86 L56 73" />
                  <path stroke="#FFFFFF" strokeWidth="3.6" d="M42 79.5 H70 M49.5 72 V87 M62.5 72 V87" />
                  <path stroke="#C8102E" strokeWidth="1.8" d="M42 79.5 H70 M49.5 72 V87 M62.5 72 V87" />
                </g>
                <path fill="none" stroke="#1F2937" strokeWidth="1.2" strokeLinejoin="round" d="M43 73 L56 79.5 L43 86 Z M69 73 L56 79.5 L69 86 Z" />
                <circle fill="#012169" stroke="#1F2937" strokeWidth="1.2" cx="56" cy="79.5" r="3.4" />
              </g>
            )}

            {/* ── Layer 3: face ── */}
            <g fill="#FF8FA3" opacity={mood === "celebrating" ? 0.75 : 0.35}>
              <circle cx="24" cy="60" r="4.2" />
              <circle cx="88" cy="60" r="4.2" />
            </g>

            {EYES.map((e, i) => {
              const [gx, gy] = GAZE[mood][i];
              return (
                <g key={i}>
                  {/* turret eye cone with ring lines */}
                  <circle className="leon-skin" {...skin} cx={e.cx} cy={e.cy} r="16" />
                  <circle className="leon-skin" fill="none" stroke="var(--leon-dark)" strokeWidth="1.3" opacity=".35" cx={e.cx} cy={e.cy} r="14.6" />
                  <circle cx={e.cx} cy={e.cy} r={EYE_R} fill="#FFFFFF" stroke="var(--leon-dark)" strokeWidth="1" className="leon-skin" />
                  {happyEyes ? (
                    <path
                      d={`M${e.cx - 5.5} ${e.cy + 2} Q${e.cx} ${e.cy - 5} ${e.cx + 5.5} ${e.cy + 2}`}
                      fill="none"
                      stroke="#1F2937"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                  ) : (
                    <g clipPath={`url(#${uid}-eye${i})`}>
                      <g className="leon-gaze" style={{ transform: `translate(${gx}px, ${gy}px)` }}>
                        <g className="leon-look">
                          <circle className="leon-pupil" cx={e.cx} cy={e.cy} r={mood === "listening" ? 5.8 : 4.9} fill="#1F2937" />
                          <circle cx={e.cx - 1.6} cy={e.cy - 1.6} r="1.6" fill="#FFFFFF" />
                        </g>
                      </g>
                      <rect
                        className={`leon-skin leon-lid leon-lid-${i}`}
                        fill="var(--leon-body)"
                        x={e.cx - EYE_R}
                        y={e.cy - EYE_R}
                        width={EYE_R * 2}
                        height={EYE_R * 2}
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* old-professor rectangular browline glasses — part of Leon in every language */}
            <g className="leon-specs" fill="none" stroke="#3B2414" strokeLinecap="round" strokeLinejoin="round">
              {EYES.map((e, i) => (
                <rect
                  key={i}
                  x={e.cx - 13.5}
                  y={e.cy - 10.5}
                  width="27"
                  height="21.5"
                  rx="4"
                  fill="#FFFFFF"
                  fillOpacity=".06"
                  strokeWidth="2.6"
                />
              ))}
              {/* heavy brow bar across the top of each lens */}
              {EYES.map((e, i) => (
                <path key={i} strokeWidth="5" d={`M${e.cx - 13} ${e.cy - 9.2} L${e.cx + 13} ${e.cy - 9.2}`} />
              ))}
              <path strokeWidth="3" d="M49.5 36.5 Q56 33.5 62.5 36.5" />
              <path strokeWidth="2.6" d="M22.5 35.5 L16 32.5 M89.5 35.5 L96 32.5" />
              {EYES.map((e, i) => (
                <path key={i} stroke="#FFFFFF" strokeWidth="1.6" opacity=".85" d={`M${e.cx + 6} ${e.cy - 4.5} L${e.cx + 10} ${e.cy - 0.5} M${e.cx + 8.5} ${e.cy - 5.5} L${e.cx + 10.5} ${e.cy - 3.5}`} />
              ))}
            </g>

            {mood === "correcting" && (
              // a quick tongue flick toward the correction, then back
              <g className="leon-tongue">
                <path d="M68 61 Q86 57 100 53" fill="none" stroke="#F06A8A" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="101" cy="53" r="4.2" fill="#F06A8A" />
              </g>
            )}

            <Mouth mood={mood} />
          </g>

          {/* arms: pivot at the shoulder, posed by the motion engine */}
          <Arm side="l" skin={skin} />
          <Arm side="r" skin={skin} />
        </g>
      </g>

      {mood === "thinking" && (
        <g fill="var(--leon-dark)" className="leon-skin">
          <circle className="leon-dot" cx="86" cy="22" r="2.3" />
          <circle className="leon-dot" cx="93" cy="16" r="2.8" style={{ animationDelay: ".2s" }} />
          <circle className="leon-dot" cx="100" cy="11" r="3.3" style={{ animationDelay: ".4s" }} />
        </g>
      )}

      {mood === "celebrating" && (
        <g fill="#F5B83D">
          {[
            [16, 30],
            [100, 34],
            [14, 74],
          ].map(([x, y], i) => (
            <path
              key={i}
              className="leon-spark"
              style={{ animationDelay: `${i * 0.15}s` }}
              d={`M${x} ${y - 6} Q${x} ${y} ${x + 6} ${y} Q${x} ${y} ${x} ${y + 6} Q${x} ${y} ${x - 6} ${y} Q${x} ${y} ${x} ${y - 6}Z`}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

function Mouth({ mood }: { mood: LeonMood }) {
  const line = { fill: "none", stroke: "#1F2937", strokeWidth: 2.8, strokeLinecap: "round" as const };
  const inside = "#5B1F2B";
  const tongue = "#F06A8A";
  return (
    <g>
      {/* Resting expressions, cross-faded by mood. */}
      <path className="leon-mouth leon-mouth-idle" {...line} d="M43 60 Q56 69 69 60" />
      <path className="leon-mouth leon-mouth-listening" {...line} d="M49 62 Q56 67 63 62" />
      <path className="leon-mouth leon-mouth-thinking" {...line} d="M46 64 Q51 60 57 63 T68 61" />
      <g className="leon-mouth leon-mouth-celebrating">
        <path d="M42 59 Q56 79 70 59 Z" fill={inside} stroke="#1F2937" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M49 67 Q56 63 63 67 Q56 74 49 67 Z" fill={tongue} />
      </g>

      {/* Talking without a live level (fallback): a gentle flap. */}
      <g className="leon-mouth leon-mouth-talk">
        <g className={mood === "speaking" ? "leon-talk" : undefined}>
          <ellipse cx="56" cy="63" rx="7" ry="5.5" fill={inside} />
          <ellipse cx="56" cy="66" rx="4.4" ry="2.2" fill={tongue} />
        </g>
      </g>

      {/* Live lip sync: closed, small, open, wide. */}
      <path className="leon-viseme leon-v0" {...line} d="M47 62 Q56 66 65 62" />
      <g className="leon-viseme leon-v1">
        <ellipse cx="56" cy="62.8" rx="6.5" ry="3" fill={inside} stroke="#1F2937" strokeWidth="1.6" />
      </g>
      <g className="leon-viseme leon-v2">
        <ellipse cx="56" cy="63.4" rx="7.6" ry="5.4" fill={inside} stroke="#1F2937" strokeWidth="1.8" />
        <ellipse cx="56" cy="66.6" rx="4.4" ry="2" fill={tongue} />
      </g>
      <g className="leon-viseme leon-v3">
        <ellipse cx="56" cy="64" rx="9" ry="7.8" fill={inside} stroke="#1F2937" strokeWidth="2" />
        <ellipse cx="56" cy="68.4" rx="5.4" ry="2.8" fill={tongue} />
      </g>
    </g>
  );
}

function Arm({ side, skin }: { side: "l" | "r"; skin: { fill: string; stroke: string; strokeLinejoin: "round" } }) {
  // Drawn hanging straight down from the shoulder at (0,0).
  return (
    <g className={`leon-arm-${side}`}>
      <path d="M0 0 L0 15" fill="none" stroke="var(--leon-dark)" strokeWidth="8" strokeLinecap="round" className="leon-skin" />
      <path d="M0 0 L0 15" fill="none" stroke="var(--leon-body)" strokeWidth="4.6" strokeLinecap="round" className="leon-skin" />
      {side === "r" && (
        // pointing finger, shown while explaining or correcting
        <path className="leon-finger leon-skin" d="M0 18 L0 24" fill="none" stroke="var(--leon-dark)" strokeWidth="3.4" strokeLinecap="round" />
      )}
      <ellipse {...skin} strokeWidth={2} className="leon-skin" cx="0" cy="17.5" rx="4.6" ry="4.2" />
    </g>
  );
}

// ── Motion engine ─────────────────────────────────────────────────────────────

type PuppetRefs = {
  mood: React.MutableRefObject<LeonMood>;
  voice: React.MutableRefObject<React.MutableRefObject<number> | undefined>;
  mic: React.MutableRefObject<React.MutableRefObject<number> | undefined>;
};

const KEYS = ["hr", "hx", "hy", "br", "bs", "hop", "tr", "al", "ar", "brow", "sx", "sy"] as const;
type Pose = Record<(typeof KEYS)[number], number>;
const REST: Pose = { hr: 0, hx: 0, hy: 0, br: 0, bs: 0, hop: 0, tr: 0, al: -18, ar: 18, brow: 0, sx: 0, sy: 0 };

/**
 * Animate Leon like a puppet: every frame, work out a target pose from his
 * mood, the time and the live voice level, then ease each joint toward it.
 * Moods blend into one another instead of snapping. Returns a stop function.
 */
function runPuppet(el: SVGSVGElement, refs: PuppetRefs, reduce: boolean): () => void {
  const pose: Pose = { ...REST };
  const amp = reduce ? 0.25 : 1;
  let raf = 0;
  let last = performance.now();
  let voice = 0; // smoothed, 0..1, relative to the recent loudest
  let peak = 0.05;
  let silentFor = 0; // seconds of speaking-mood with no measurable audio
  let meterWorks = false; // once real audio is seen, trust the meter (pauses included)
  let speakingFor = 0;
  let lastShape = -1;
  let wasLive = false;
  let beatAt = -10; // last stressed syllable
  let nod = 0; // decaying impulses
  let brow = 0;
  let gesture = 0; // which explaining pose the arm is in
  let nextGesture = 0;
  let look = { x: 0, y: 0 };
  let nextLook = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    const mood = refs.mood.current;
    const speaking = mood === "speaking";
    const listening = mood === "listening";

    // ── loudness: Leon's own voice, or the student's mic while listening ──
    const src = speaking ? refs.voice.current : listening ? refs.mic.current : undefined;
    let raw = src?.current ?? 0;
    if (speaking) {
      speakingFor += dt;
      if (raw > 0.02) meterWorks = true;
      silentFor = raw > 0.006 ? 0 : silentFor + dt;
      // No usable meter (iPhone, blocked analyser, or a dead reading): fake a
      // natural speech rhythm (syllables with short pauses) so he still talks.
      if (!meterWorks && (silentFor > 0.35 || !src)) {
        const syl = Math.abs(Math.sin(t * Math.PI * 4.6));
        const phrase = 0.55 + 0.45 * Math.sin(t * 1.9) * Math.sin(t * 0.73 + 1);
        raw = Math.sin(t * 0.9) > -0.85 ? syl * phrase * 0.6 : 0;
      }
    } else {
      speakingFor = 0;
      silentFor = 0;
    }
    peak = Math.max(raw, peak * Math.pow(0.6, dt), 0.02);
    const target = raw < 0.006 ? 0 : Math.min(1, raw / peak);
    voice += (target - voice) * (target > voice ? 0.6 : 0.3);

    // a stressed syllable: a jump in loudness, at most ~4 a second
    if (voice > 0.62 && t - beatAt > 0.26 && (speaking || listening)) {
      beatAt = t;
      nod = listening ? 2.6 : 1.6;
      if (speaking) brow = -1.8;
    }
    nod *= Math.pow(0.02, dt);
    brow *= Math.pow(0.04, dt);

    // look around the room now and then; look at the student while talking
    if (t > nextLook) {
      const roam = mood === "idle" ? 3 : mood === "thinking" ? 1.5 : 1;
      look = { x: (Math.random() * 2 - 1) * roam, y: (Math.random() * 2 - 1) * roam * 0.6 };
      if (mood === "thinking") look.y -= 2.5;
      nextLook = t + 0.8 + Math.random() * (mood === "idle" ? 2.5 : 1.6);
    }

    // ── target pose per mood ──
    const g: Pose = { ...REST };
    g.bs = 0.012 * Math.sin(t * 1.6); // breathing
    g.tr = 5 * Math.sin(t * 0.8);
    g.sx = look.x;
    g.sy = look.y;
    switch (mood) {
      case "idle":
        g.hr = 3 * Math.sin(t * 0.55) + 1.5 * Math.sin(t * 1.3);
        g.hy = 1.2 * Math.sin(t * 1.1);
        g.br = 1.2 * Math.sin(t * 0.45);
        g.al = -16 + 4 * Math.sin(t * 0.9);
        g.ar = 16 - 4 * Math.sin(t * 0.8);
        break;
      case "listening":
        // leans in toward the student, nods along to their voice
        g.hr = -8 + 1.5 * Math.sin(t * 0.7);
        g.hx = -1.5;
        g.hy = 1 + nod;
        g.br = -2;
        g.brow = -0.8 * voice;
        g.al = -24;
        g.ar = 26 + 4 * Math.sin(t * 0.9);
        g.sx = look.x * 0.4;
        break;
      case "thinking":
        // head tipped, eyes up, hand on chin, tapping
        g.hr = 7 + 1.5 * Math.sin(t * 0.9);
        g.hy = -0.5;
        g.brow = -1.4;
        g.ar = 128 + 6 * Math.abs(Math.sin(t * 3.2));
        g.al = -10;
        g.tr = -10 + 6 * Math.sin(t * 1.4);
        break;
      case "speaking": {
        // talking with his hands: a new explaining pose every second or two
        if (t > nextGesture) {
          gesture = (gesture + 1 + Math.floor(Math.random() * 2)) % 3;
          nextGesture = t + 1.1 + Math.random() * 1.3;
        }
        const armPose = [-70, -105, -40][gesture];
        g.ar = armPose + 10 * voice * Math.sin(t * 7) - 6 * (nod / 1.6);
        g.al = 30 + 12 * Math.sin(t * 1.2) + (gesture === 1 ? 20 : 0);
        g.hr = 3.5 * Math.sin(t * 0.9) + 2 * Math.sin(t * 2.1) + (gesture - 1) * 2;
        g.hy = -1.8 * voice + nod;
        g.br = 1.6 * Math.sin(t * 0.7);
        g.brow = brow - 0.6 * voice;
        g.bs += 0.01 * voice;
        g.sx *= 0.3;
        g.sy = 0.5;
        break;
      }
      case "correcting":
        // finger up and wagging, glasses slid down the nose
        g.ar = -168 + 9 * Math.sin(t * 9);
        g.al = -14;
        g.hr = -5 + 2 * Math.sin(t * 4.5);
        g.brow = 2.6;
        g.sy = 2;
        break;
      case "celebrating":
        g.al = 140 + 12 * Math.sin(t * 11);
        g.ar = -140 - 12 * Math.sin(t * 11);
        g.hop = -5 * Math.abs(Math.sin(t * 7));
        g.hr = 5 * Math.sin(t * 7);
        g.tr = 10 * Math.sin(t * 7);
        g.brow = -1.5;
        break;
    }

    // ease every joint toward its target (critically-damped-ish follow)
    const k = 1 - Math.pow(0.0008, dt);
    for (const key of KEYS) {
      const goal = key === "al" || key === "ar" ? REST[key] + (g[key] - REST[key]) * amp : g[key] * amp;
      pose[key] += (goal - pose[key]) * k;
      el.style.setProperty(`--${key}`, pose[key].toFixed(2));
    }

    // ── mouth ──
    const live = speaking && speakingFor > 0;
    if (live !== wasLive) {
      if (live) el.setAttribute("data-live", "true");
      else el.removeAttribute("data-live");
      wasLive = live;
    }
    if (live) {
      const shape = voice < 0.12 ? 0 : voice < 0.38 ? 1 : voice < 0.7 ? 2 : 3;
      if (shape !== lastShape) {
        el.setAttribute("data-mouth", String(shape));
        lastShape = shape;
      }
    } else lastShape = -1;
    el.style.setProperty("--leon-ear", listening ? voice.toFixed(3) : "0");

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    el.removeAttribute("data-live");
  };
}
