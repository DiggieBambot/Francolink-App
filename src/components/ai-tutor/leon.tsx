"use client";

import { useId } from "react";

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

const STYLES = `
.leon-skin{transition:fill .6s ease,stroke .6s ease}
.leon-char,.leon-head,.leon-tail{transition:transform .4s ease}
.leon-head{transform-origin:56px 72px}
.leon-tail{transform-origin:78px 90px}
.leon[data-mood=idle] .leon-head{animation:leon-bob 3.2s ease-in-out infinite}
.leon[data-mood=idle] .leon-tail{animation:leon-sway 4.5s ease-in-out infinite}
.leon[data-mood=listening] .leon-head{transform:rotate(-7deg)}
.leon[data-mood=thinking] .leon-tail{transform:rotate(-8deg)}
.leon[data-mood=celebrating] .leon-char{animation:leon-hop .45s ease-in-out infinite alternate}
.leon[data-mood=celebrating] .leon-tail{animation:leon-sway .45s ease-in-out infinite alternate}
.leon-lid{transform-box:fill-box;transform-origin:top;transform:scaleY(0);animation:leon-blink 4.6s infinite}
.leon-lid-1{animation-delay:.07s}
.leon-gaze,.leon-specs{transition:transform .35s ease}
.leon[data-mood=correcting] .leon-specs{transform:translateY(2.5px)}
.leon-wander-0{animation:leon-wander-a 7s ease-in-out infinite}
.leon-wander-1{animation:leon-wander-b 5.5s ease-in-out infinite}
.leon-talk{transform-box:fill-box;transform-origin:center;animation:leon-talk .2s ease-in-out infinite alternate}
.leon-tongue{transform-origin:68px 61px;animation:leon-flick .9s ease-out 1 both}
.leon-dot{animation:leon-dot 1.2s ease-in-out infinite}
.leon-spark{transform-box:fill-box;transform-origin:center;animation:leon-spark .8s ease-in-out infinite alternate}
@keyframes leon-bob{50%{transform:translateY(-1.5px)}}
@keyframes leon-sway{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}
@keyframes leon-hop{to{transform:translateY(-5px)}}
@keyframes leon-blink{0%,92%,100%{transform:scaleY(0)}95%{transform:scaleY(1)}}
@keyframes leon-wander-a{0%,30%{transform:translate(0,0)}40%,60%{transform:translate(-3px,1px)}70%,100%{transform:translate(2px,-2px)}}
@keyframes leon-wander-b{0%,20%{transform:translate(0,0)}35%,55%{transform:translate(3px,2px)}65%,100%{transform:translate(-2px,-1px)}}
@keyframes leon-talk{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
@keyframes leon-flick{0%{transform:scaleX(0)}35%,55%{transform:scaleX(1)}100%{transform:scaleX(0)}}
@keyframes leon-dot{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes leon-spark{from{transform:scale(.5);opacity:.4}to{transform:scale(1.1);opacity:1}}
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
}: {
  language?: string;
  mood?: LeonMood;
  size?: number;
  /** Freeze all animation — for older message avatars in the thread. */
  still?: boolean;
  /** Draw the tinted circle behind Leon (and clip him to it). */
  background?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
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
            {outfit === "fr" && (
              <g>
                <path className="leon-skin" fill="var(--leon-outfit)" d="M31 70 C44 78 68 78 81 70 L82 78 C68 87 44 87 30 78 Z" />
                <path className="leon-skin" fill="var(--leon-outfit)" d="M62 80 L71 96 L59 96 L57 82 Z" />
                <path className="leon-skin" fill="none" stroke="var(--leon-accent)" strokeWidth="2" d="M38 75 L37 82 M48 77 L48 84 M64 77 L64 84 M74 75 L75 82 M62 88 L67 88 M63 92 L69 92" />
              </g>
            )}
            {outfit === "es" && (
              <g>
                <path className="leon-skin" fill="var(--leon-outfit)" d="M31 70 C44 78 68 78 81 70 L56 94 Z" />
                <g className="leon-skin" fill="var(--leon-accent)">
                  <circle cx="42" cy="77" r="1.7" />
                  <circle cx="56" cy="79" r="1.7" />
                  <circle cx="70" cy="77" r="1.7" />
                  <circle cx="50" cy="85" r="1.7" />
                  <circle cx="62" cy="85" r="1.7" />
                  <circle cx="56" cy="90" r="1.5" />
                </g>
              </g>
            )}
            {outfit === "en" && (
              <g>
                <path className="leon-skin" fill="var(--leon-outfit)" stroke="var(--leon-dark)" strokeWidth="1" strokeLinejoin="round" d="M43 73 L56 79 L43 86 Z M69 73 L56 79 L69 86 Z" />
                <circle className="leon-skin" fill="var(--leon-outfit)" stroke="var(--leon-dark)" strokeWidth="1" cx="56" cy="79" r="3.6" />
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
                        <g className={mood === "idle" ? `leon-wander-${i}` : undefined}>
                          <circle cx={e.cx} cy={e.cy} r={mood === "listening" ? 5.8 : 4.9} fill="#1F2937" />
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
  switch (mood) {
    case "listening":
      return <path {...line} d="M49 62 Q56 67 63 62" />;
    case "thinking":
      return <path {...line} d="M46 64 Q51 60 57 63 T68 61" />;
    case "speaking":
      return (
        <g className="leon-talk">
          <ellipse cx="56" cy="63" rx="7" ry="5.5" fill="#5B1F2B" />
          <ellipse cx="56" cy="66" rx="4.4" ry="2.2" fill="#F06A8A" />
        </g>
      );
    case "celebrating":
      return (
        <g>
          <path d="M42 59 Q56 79 70 59 Z" fill="#5B1F2B" stroke="#1F2937" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M49 67 Q56 63 63 67 Q56 74 49 67 Z" fill="#F06A8A" />
        </g>
      );
    case "correcting":
    case "idle":
    default:
      return <path {...line} d="M43 60 Q56 69 69 60" />;
  }
}
