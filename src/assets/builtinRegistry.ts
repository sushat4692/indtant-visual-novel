// Builtin placeholder assets, generated as inline SVG data URLs so the platform
// ships with usable backgrounds and character sprites and needs no binary files.
// Uploaded assets (resolved elsewhere) override these by id.

export type AssetType = "background" | "character";

export interface BuiltinAsset {
  id: string;
  type: AssetType;
  label: string;
  /** data: URL ready to drop into an <img src> or CSS background. */
  url: string;
}

function svgUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A simple gradient background with an optional accent shape. */
function background(from: string, to: string, accent?: string): string {
  const shape = accent
    ? `<ellipse cx="640" cy="620" rx="520" ry="160" fill="${accent}" opacity="0.5"/>`
    : "";
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="1280" height="720" fill="url(#g)"/>${shape}</svg>`,
  );
}

/** A flat-color character silhouette (head + shoulders). */
function silhouette(color: string): string {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="700" viewBox="0 0 400 700">` +
      `<g fill="${color}">` +
      `<circle cx="200" cy="180" r="110"/>` +
      `<path d="M40 700 C40 470 120 360 200 360 C280 360 360 470 360 700 Z"/>` +
      `</g></svg>`,
  );
}

const ASSETS: BuiltinAsset[] = [
  { id: "bg_classroom", type: "background", label: "教室", url: background("#cfe8ff", "#9cc4e4", "#7da7c9") },
  { id: "bg_room", type: "background", label: "部屋", url: background("#f3e2c7", "#d9b98f", "#c79f6f") },
  { id: "bg_town", type: "background", label: "街", url: background("#dfe7ee", "#a9b6c4", "#8b99a8") },
  { id: "bg_sunset", type: "background", label: "夕焼け", url: background("#ffd194", "#d1668e", "#b25179") },
  { id: "bg_sky", type: "background", label: "空", url: background("#aee1ff", "#5fa8e0", "#7fbfe8") },
  { id: "bg_night", type: "background", label: "夜", url: background("#2b3a67", "#101626", "#1d2742") },
  { id: "char_male_a", type: "character", label: "男性A", url: silhouette("#3f6fb0") },
  { id: "char_male_b", type: "character", label: "男性B", url: silhouette("#2f8f7f") },
  { id: "char_female_a", type: "character", label: "女性A", url: silhouette("#c75d8d") },
  { id: "char_female_b", type: "character", label: "女性B", url: silhouette("#b5742f") },
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
