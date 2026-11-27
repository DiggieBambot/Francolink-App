// Léon's drawing: a cartoon chameleon on a branch, in layered SVG.
//
// Three independent layers keep the art additive (languages + moods, not
// languages × moods):
//   1. skin   — one body, recoloured from the language palette via CSS vars
//   2. outfit — one small accessory per language, carrying its flag
//   3. face   — eyes, glasses and a mouth that is redrawn from numbers
//
// Every moving part carries a `data-j` (joint) or `data-m` (mouth) attribute.
// The engine finds them once and writes their transforms each frame; React
// only renders the starting pose.

import { EYES, EYE_R, FOREARM, UPPER_ARM, rigAttributes, type Pose, type RigPart } from "./rig";
import { mouthGeometry, type MouthParams } from "./mouth";
import { leonPalette, PALETTES } from "./palette";
import type { LeonMood } from "./types";

const TAIL = "M76 90 C90 98 108 92 108 78 C108 64 90 62 88 74 C87 82 97 85 99 77";
const INK = "#1F2937";
const LIP = "#2A1B1F";
const INSIDE = "#5B1F2B";
const TONGUE = "#F06A8A";

const STYLES = `
.leon-skin{transition:fill .6s ease,stroke .6s ease}
.leon-fade{transition:opacity .25s ease}
.leon-tongue{transform-origin:68px 61px;animation:leon-flick .9s ease-out 1 both}
.leon-dot{animation:leon-dot 1.2s ease-in-out infinite}
.leon-spark{transform-box:fill-box;transform-origin:center;animation:leon-spark .8s ease-in-out infinite alternate}
@keyframes leon-flick{0%{transform:scaleX(0)}35%,55%{transform:scaleX(1)}100%{transform:scaleX(0)}}
@keyframes leon-dot{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes leon-spark{from{transform:scale(.5);opacity:.4}to{transform:scale(1.1);opacity:1}}
.leon[data-still=true] *{animation:none!important}
@media (prefers-reduced-motion:reduce){.leon *{animation:none!important;transition:none!important}}
`;

type Skin = { fill: string; stroke: string; strokeWidth: number; strokeLinejoin: "round" };

export function LeonArt({
  uid,
  language,
  mood,
  pose,
  mouth,
  background,
}: {
  uid: string;
  language: string;
  mood: LeonMood;
  /** Starting pose (the engine takes over from here when animated). */
  pose: Pose;
  mouth: MouthParams;
  background: boolean;
}) {
  const p = leonPalette(language);
  const outfit = PALETTES[language] ? language : "fr";
  const a = rigAttributes(pose);
  const j = (part: RigPart) => ({ "data-j": part, [a[part].attr]: a[part].value });
  const geo = mouthGeometry(mouth);
  const happy = mood === "celebrating";

  const skin: Skin = { fill: "var(--leon-body)", stroke: "var(--leon-dark)", strokeWidth: 2.5, strokeLinejoin: "round" };

  return (
    <>
      <style>{STYLES}</style>
      <defs>
        {EYES.map((e, i) => (
          <clipPath key={i} id={`${uid}-eye${i}`}>
            <circle cx={e.cx} cy={e.cy} r={EYE_R} />
          </clipPath>
        ))}
        <clipPath id={`${uid}-mouth`}>
          <path data-m="lips" d={geo.d} />
        </clipPath>
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

      {background && <circle className="leon-skin" cx="60" cy="60" r="60" fill={p.bg} />}

      <g clipPath={background ? `url(#${uid}-badge)` : undefined}>
        {/* branch */}
        <path fill="#A47148" stroke="#7A5233" strokeWidth="2" d="M-2 101 Q60 96 122 99 L122 109 Q60 106 -2 111 Z" />
        <path fill="none" stroke="#7A5233" strokeWidth="1.5" strokeLinecap="round" opacity=".6" d="M28 104 h8 M86 102 h6" />
        <path fill="#7FB069" stroke="#5B8A47" strokeWidth="1.5" d="M14 100 C8 92 12 86 20 86 C22 93 19 98 14 100 Z" />

        <g {...j("char")}>
          {/* ── Layer 1: skin ── */}
          <g {...j("tail")}>
            <path d={TAIL} fill="none" stroke="var(--leon-dark)" strokeWidth="10" strokeLinecap="round" className="leon-skin" />
            <path d={TAIL} fill="none" stroke="var(--leon-body)" strokeWidth="6" strokeLinecap="round" className="leon-skin" />
            <path d="M84 95 l2 -3 M93 95 l1 -3 M101 90 l-2 -2" fill="none" stroke="var(--leon-dark)" strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
          </g>

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

          <g {...j("head")}>
            {/* casque (head crest) behind the head */}
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
              // tricolour scarf: bleu, blanc, rouge
              <g stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
                <path fill={`url(#${uid}-fr)`} d="M31 70 C44 78 68 78 81 70 L82 78 C68 87 44 87 30 78 Z" />
                <path fill={`url(#${uid}-fr)`} d="M58 80 L72 96 L58 96 L55 82 Z" />
              </g>
            )}
            {outfit === "es" && (
              // neckerchief in the Spanish flag's red, gold, red bands
              <path fill={`url(#${uid}-es)`} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" d="M31 70 C44 78 68 78 81 70 L56 94 Z" />
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
                <path fill="none" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" d="M43 73 L56 79.5 L43 86 Z M69 73 L56 79.5 L69 86 Z" />
                <circle fill="#012169" stroke={INK} strokeWidth="1.2" cx="56" cy="79.5" r="3.4" />
              </g>
            )}

            {/* ── Layer 3: face ── */}
            <g {...j("blush")} fill="#FF8FA3">
              <circle cx="24" cy="60" r="4.2" />
              <circle cx="88" cy="60" r="4.2" />
            </g>

            {EYES.map((e, i) => (
              <g key={i}>
                {/* turret eye cone with ring lines */}
                <circle className="leon-skin" {...skin} cx={e.cx} cy={e.cy} r="16" />
                <circle className="leon-skin" fill="none" stroke="var(--leon-dark)" strokeWidth="1.3" opacity=".35" cx={e.cx} cy={e.cy} r="14.6" />
                <circle cx={e.cx} cy={e.cy} r={EYE_R} fill="#FFFFFF" stroke="var(--leon-dark)" strokeWidth="1" className="leon-skin" />
                <g clipPath={`url(#${uid}-eye${i})`}>
                  <g className="leon-fade" opacity={happy ? 0 : 1}>
                    <g {...j(i === 0 ? "gaze0" : "gaze1")}>
                      <g {...j(i === 0 ? "pupil0" : "pupil1")}>
                        <circle cx={e.cx} cy={e.cy} r="5.2" fill={INK} />
                        <circle cx={e.cx - 1.6} cy={e.cy - 1.6} r="1.6" fill="#FFFFFF" />
                      </g>
                    </g>
                    <rect
                      {...j(i === 0 ? "lid0" : "lid1")}
                      className="leon-skin"
                      fill="var(--leon-body)"
                      x={e.cx - EYE_R}
                      y={e.cy - EYE_R}
                      width={EYE_R * 2}
                      height={EYE_R * 2}
                    />
                  </g>
                </g>
                {/* happy, squeezed-shut eyes when celebrating */}
                <path
                  className="leon-fade"
                  opacity={happy ? 1 : 0}
                  d={`M${e.cx - 5.5} ${e.cy + 2} Q${e.cx} ${e.cy - 5} ${e.cx + 5.5} ${e.cy + 2}`}
                  fill="none"
                  stroke={INK}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* old-professor rectangular browline glasses: part of Léon in every language */}
            <g {...j("specs")} fill="none" stroke="#3B2414" strokeLinecap="round" strokeLinejoin="round">
              {EYES.map((e, i) => (
                <rect key={i} x={e.cx - 13.5} y={e.cy - 10.5} width="27" height="21.5" rx="4" fill="#FFFFFF" fillOpacity=".06" strokeWidth="2.6" />
              ))}
              {/* heavy brow bar across the top of each lens; it lifts on its own */}
              <g {...j("brows")}>
                {EYES.map((e, i) => (
                  <path key={i} strokeWidth="5" d={`M${e.cx - 13} ${e.cy - 9.2} L${e.cx + 13} ${e.cy - 9.2}`} />
                ))}
              </g>
              <path strokeWidth="3" d="M49.5 36.5 Q56 33.5 62.5 36.5" />
              <path strokeWidth="2.6" d="M22.5 35.5 L16 32.5 M89.5 35.5 L96 32.5" />
              {EYES.map((e, i) => (
                <path key={i} stroke="#FFFFFF" strokeWidth="1.6" opacity=".85" d={`M${e.cx + 6} ${e.cy - 4.5} L${e.cx + 10} ${e.cy - 0.5} M${e.cx + 8.5} ${e.cy - 5.5} L${e.cx + 10.5} ${e.cy - 3.5}`} />
              ))}
            </g>

            {mood === "correcting" && (
              // a quick tongue flick toward the correction, then back
              <g className="leon-tongue">
                <path d="M68 61 Q86 57 100 53" fill="none" stroke={TONGUE} strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="101" cy="53" r="4.2" fill={TONGUE} />
              </g>
            )}

            {/* mouth: one outline, redrawn every frame from the lip numbers */}
            <g>
              <path data-m="lips" d={geo.d} fill={INSIDE} />
              <g clipPath={`url(#${uid}-mouth)`}>
                <ellipse data-m="tongue" cx={geo.tongue.cx} cy={geo.tongue.cy} rx={geo.tongue.rx} ry={geo.tongue.ry} fill={TONGUE} />
                <rect data-m="teeth" x={geo.teeth.x} y={geo.teeth.y} width={geo.teeth.w} height={geo.teeth.h} fill="#FFFFFF" />
              </g>
              <path data-m="lips" d={geo.d} fill="none" stroke={LIP} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          </g>

          {/* arms: outlines first, then fills, so the elbow has no seam */}
          {(["outline", "fill"] as const).map((layer) => (
            <g key={layer}>
              <Arm side="L" layer={layer} j={j} />
              <Arm side="R" layer={layer} j={j} />
            </g>
          ))}
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
    </>
  );
}

/** A two-part arm: shoulder → elbow → mitten hand, with an optional pointing finger. */
function Arm({
  side,
  layer,
  j,
}: {
  side: "L" | "R";
  layer: "outline" | "fill";
  j: (part: RigPart) => Record<string, string>;
}) {
  const outline = layer === "outline";
  const seg = {
    fill: "none",
    stroke: outline ? "var(--leon-dark)" : "var(--leon-body)",
    strokeWidth: outline ? 8 : 4.6,
    strokeLinecap: "round" as const,
    className: "leon-skin",
  };
  const finger = side === "L" ? "fingerL" : "fingerR";
  const handY = FOREARM + 1.5;
  return (
    <g {...j(side === "L" ? "armL" : "armR")}>
      <path d={`M0 0 L0 ${UPPER_ARM}`} {...seg} />
      <g {...j(side === "L" ? "foreL" : "foreR")}>
        <path d={`M0 0 L0 ${FOREARM}`} {...seg} />
        <g {...j(finger)}>
          <path
            d={`M0 ${handY + 2} L0 ${handY + 8}`}
            {...seg}
            stroke={outline ? "var(--leon-dark)" : "var(--leon-light)"}
            strokeWidth={outline ? 4.8 : 2.2}
          />
        </g>
        {/* light mitten hands, so gestures read against his head */}
        <ellipse
          cx="0"
          cy={handY}
          rx={outline ? 6 : 4.7}
          ry={outline ? 5.6 : 4.3}
          fill={outline ? "var(--leon-dark)" : "var(--leon-light)"}
          className="leon-skin"
        />
      </g>
    </g>
  );
}
