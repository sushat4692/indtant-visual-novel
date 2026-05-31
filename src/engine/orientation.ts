import type { Orientation } from "./types";

/** Default orientation for projects that predate the orientation field. */
export const DEFAULT_ORIENTATION: Orientation = "landscape";

/** Resolve a (possibly missing) orientation to a concrete value. */
export function resolveOrientation(orientation: Orientation | undefined): Orientation {
  return orientation ?? DEFAULT_ORIENTATION;
}

/** Human-readable label for orientation toggles. */
export const ORIENTATION_LABEL: Record<Orientation, string> = {
  landscape: "横型 (16:9)",
  portrait: "縦型 (9:16)",
};

/** Intrinsic pixel size of the builtin background SVGs per orientation. */
export const STAGE_SIZE: Record<Orientation, { width: number; height: number }> = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
};
