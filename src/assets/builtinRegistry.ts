// Builtin placeholder assets, generated as inline SVG data URLs so the platform
// ships with usable backgrounds and character sprites and needs no binary files.
// Uploaded assets (resolved elsewhere) override these by id.

import type { Orientation } from "../engine/types";
import { STAGE_SIZE } from "../engine/orientation";

export type AssetType = "background" | "character";

export interface BuiltinAsset {
  id: string;
  type: AssetType;
  label: string;
  /**
   * Resolve the asset's data URL for a given orientation. Backgrounds provide a
   * dedicated variant per orientation; characters are orientation-independent.
   */
  urlFor(orientation: Orientation): string;
  /** Convenience landscape URL (used by thumbnails / orientation-agnostic UI). */
  readonly url: string;
}

function svgUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * A simple gradient background with an optional accent ellipse, sized to the
 * given orientation so the placeholder fills the fixed-ratio stage cleanly.
 */
function backgroundSvg(orientation: Orientation, from: string, to: string, accent?: string): string {
  const { width, height } = STAGE_SIZE[orientation];
  // Anchor the accent ellipse near the lower third, scaled to the canvas.
  const shape = accent
    ? `<ellipse cx="${width / 2}" cy="${height * 0.86}" rx="${width * 0.41}" ry="${height * 0.22}" fill="${accent}" opacity="0.5"/>`
    : "";
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="${width}" height="${height}" fill="url(#g)"/>${shape}</svg>`,
  );
}

/** Build an orientation-aware background asset definition. */
function background(
  id: string,
  label: string,
  from: string,
  to: string,
  accent?: string,
): BuiltinAsset {
  const landscape = backgroundSvg("landscape", from, to, accent);
  const portrait = backgroundSvg("portrait", from, to, accent);
  return {
    id,
    type: "background",
    label,
    urlFor: (orientation) => (orientation === "portrait" ? portrait : landscape),
    url: landscape,
  };
}

/** A flat-color character silhouette (head + shoulders), orientation-independent. */
function silhouette(id: string, label: string, color: string): BuiltinAsset {
  const url = svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="700" viewBox="0 0 400 700">` +
      `<g fill="${color}">` +
      `<circle cx="200" cy="180" r="110"/>` +
      `<path d="M40 700 C40 470 120 360 200 360 C280 360 360 470 360 700 Z"/>` +
      `</g></svg>`,
  );
  return { id, type: "character", label, urlFor: () => url, url };
}

const ASSETS: BuiltinAsset[] = [
  background("bg_classroom", "教室", "#cfe8ff", "#9cc4e4", "#7da7c9"),
  background("bg_room", "部屋", "#f3e2c7", "#d9b98f", "#c79f6f"),
  background("bg_town", "街", "#dfe7ee", "#a9b6c4", "#8b99a8"),
  background("bg_sunset", "夕焼け", "#ffd194", "#d1668e", "#b25179"),
  background("bg_sky", "空", "#aee1ff", "#5fa8e0", "#7fbfe8"),
  background("bg_night", "夜", "#2b3a67", "#101626", "#1d2742"),
  silhouette("char_male_a", "男性A", "#3f6fb0"),
  silhouette("char_male_b", "男性B", "#2f8f7f"),
  silhouette("char_female_a", "女性A", "#c75d8d"),
  silhouette("char_female_b", "女性B", "#b5742f"),
];

const BY_ID = new Map(ASSETS.map((a) => [a.id, a]));

export function isBuiltinAsset(id: string): boolean {
  return BY_ID.has(id);
}

export function getBuiltinAsset(id: string): BuiltinAsset | undefined {
  return BY_ID.get(id);
}

export function builtinAssetsByType(type: AssetType): BuiltinAsset[] {
  return ASSETS.filter((a) => a.type === type);
}

export const BUILTIN_ASSETS = ASSETS;
