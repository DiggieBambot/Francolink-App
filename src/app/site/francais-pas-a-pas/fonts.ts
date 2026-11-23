// Shared by the sales page and its sub-pages (download, free sample).
//
// Self-hosted by next/font: no render-blocking @import, no layout shift, and
// nothing injected into the React tree — an inline <style> and a <link> in the
// component body are exactly the kind of thing that breaks hydration.
import { Fraunces, Instrument_Sans } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"], display: "swap", variable: "--font-display", weight: ["400", "500", "600"],
});
export const instrument = Instrument_Sans({
  subsets: ["latin"], display: "swap", variable: "--font-body", weight: ["400", "500", "600"],
});
