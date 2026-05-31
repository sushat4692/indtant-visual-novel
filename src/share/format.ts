import type { ProjectBundle } from "./bundle";
import type { EncryptedPayload } from "./crypto";

export const FILE_VERSION = 1;

/** Editable (plaintext) export file: can be re-imported into the editor. */
export interface EditableFile {
  format: "instant-visual-novel";
  version: number;
  mode: "editable";
  bundle: ProjectBundle;
}

/** Play-only (encrypted) export file: imports as a locked, play-only project. */
export interface PlayFile {
  format: "instant-visual-novel";
  version: number;
  mode: "play";
  /** Project title surfaced before decryption (for the import UI). */
  title: string;
  enc: EncryptedPayload;
}

export type ExportFile = EditableFile | PlayFile;

export function isExportFile(value: unknown): value is ExportFile {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { format?: unknown }).format === "instant-visual-novel"
  );
}
