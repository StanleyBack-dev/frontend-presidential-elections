import type { Candidate } from "../../../api/elections";

const WHITE = "#ffffff";
export const NEUTRAL_FILL = "#d4d4d8";
export const EMPTY_FILL = "#f1f5f9";
export const INK = "#0f172a";

function toRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** Mixes `hex` toward white; t = 1 → pure `hex`. */
export function tint(hex: string, t: number): string {
  const [r, g, b] = toRgb(hex);
  const [wr, wg, wb] = toRgb(WHITE);
  const mix = (c: number, w: number) =>
    Math.round(w + (c - w) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r, wr)}${mix(g, wg)}${mix(b, wb)}`;
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or ink, whichever reads better on `fill`. */
export function textOn(fill: string): string {
  const l = luminance(fill);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastInk = (l + 0.05) / (luminance(INK) + 0.05);
  return contrastWhite >= contrastInk ? WHITE : INK;
}

export interface DivergingBin {
  key: string;
  label: string;
  fill: string;
  /** Inclusive lower bound of the signed margin, in percentage points. */
  min: number;
}

// Thresholds of the signed margin (left share − right share), in p.p.
const STEPS = [
  { min: 30, t: 1, label: "+30 p.p." },
  { min: 15, t: 0.62, label: "15–30 p.p." },
  { min: 5, t: 0.3, label: "5–15 p.p." },
];

/**
 * Diverging scale centered on a tie: the left candidate's hue on one side,
 * the right candidate's on the other, neutral gray in the middle (< 5 p.p.).
 * Seven classes in total — the legibility ceiling for a color scale.
 */
export function buildDivergingScale(left: Candidate, right: Candidate) {
  // Both lists run strongest → weakest, which is the order `binFor` scans.
  const leftBins: DivergingBin[] = STEPS.map((step) => ({
    key: `${left.slug}-${step.min}`,
    label: `${left.name} ${step.label}`,
    fill: tint(left.color, step.t),
    min: step.min,
  }));
  const rightBins: DivergingBin[] = STEPS.map((step) => ({
    key: `${right.slug}-${step.min}`,
    label: `${right.name} ${step.label}`,
    fill: tint(right.color, step.t),
    min: -step.min,
  }));
  const neutral: DivergingBin = {
    key: "neutral",
    label: "Empate técnico (< 5 p.p.)",
    fill: NEUTRAL_FILL,
    min: -5,
  };

  /** Legend order: strongest left → neutral → strongest right. */
  const bins = [...leftBins, neutral, ...[...rightBins].reverse()];

  const binFor = (signedMargin: number): DivergingBin => {
    if (signedMargin >= 5) {
      return leftBins.find((bin) => signedMargin >= bin.min)!;
    }
    if (signedMargin <= -5) {
      return rightBins.find((bin) => signedMargin <= bin.min)!;
    }
    return neutral;
  };

  return { bins, binFor };
}
