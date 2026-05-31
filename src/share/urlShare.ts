import type { Project } from "../engine/types";
import { encryptBytes, decryptBytes } from "./crypto";

/** Total URL length above which sharing via URL is disabled. */
export const MAX_SHARE_URL_LENGTH = 16000;
/** URL length under which sharing is safe even on public SNS (X, etc.). */
export const SNS_SAFE_URL_LENGTH = 2000;

export type ShareLengthTier = "sns" | "browser" | "over";

/** Classify a URL length into a guidance tier. */
export function shareLengthTier(length: number): ShareLengthTier {
  if (length > MAX_SHARE_URL_LENGTH) return "over";
  if (length > SNS_SAFE_URL_LENGTH) return "browser";
  return "sns";
}

const SHARE_VERSION = 1;
const FLAG_PLAIN = 0x00;
const FLAG_ENCRYPTED = 0x01;

interface SharePayload {
  v: number;
  project: Project;
}

/** True when the browser supports the compression APIs URL sharing needs. */
export function isUrlShareSupported(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

function toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.length));
  copy.set(bytes);
  return copy;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([toArrayBufferView(bytes)]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([toArrayBufferView(bytes)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function prefix(flag: number, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(body.length + 1);
  out[0] = flag;
  out.set(body, 1);
  return out;
}

/** Encode a project into a URL-safe payload. With a password the data is encrypted. */
export async function encodeProject(project: Project, password?: string): Promise<string> {
  const payload: SharePayload = { v: SHARE_VERSION, project };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const compressed = await deflate(json); // compress BEFORE encrypting
  const body = password ? await encryptBytes(compressed, password) : compressed;
  return bytesToBase64Url(prefix(password ? FLAG_ENCRYPTED : FLAG_PLAIN, body));
}

/** Inspect a payload's leading flag to decide if a password is required. */
export function getShareMode(payload: string): "plain" | "encrypted" {
  const bytes = base64UrlToBytes(payload);
  return bytes[0] === FLAG_ENCRYPTED ? "encrypted" : "plain";
}

/** Decode a payload back into a project. Throws on malformed data or wrong password. */
export async function decodeProject(payload: string, password?: string): Promise<Project> {
  const bytes = base64UrlToBytes(payload);
  const flag = bytes[0];
  const body = bytes.slice(1);
  let compressed: Uint8Array;
  if (flag === FLAG_ENCRYPTED) {
    if (!password) throw new Error("このリンクにはパスワードが必要です");
    compressed = await decryptBytes(body, password);
  } else {
    compressed = body;
  }
  const json = new TextDecoder().decode(await inflate(compressed));
  const parsed = JSON.parse(json) as SharePayload;
  if (!parsed || typeof parsed !== "object" || !parsed.project) {
    throw new Error("共有データの形式が不正です");
  }
  return parsed.project;
}

/** Build a shareable URL and report whether it exceeds the practical limit. */
export async function buildShareUrl(
  project: Project,
  password?: string,
): Promise<{ url: string; length: number; tooLong: boolean }> {
  const payload = await encodeProject(project, password);
  const { origin, pathname } = window.location;
  const url = `${origin}${pathname}#/share/${payload}`;
  return { url, length: url.length, tooLong: url.length > MAX_SHARE_URL_LENGTH };
}

/**
 * Quickly estimate the share URL length without running PBKDF2. Encryption adds
 * only a small fixed overhead, so the plaintext estimate (plus margin) is enough
 * to drive the length-tier UI.
 */
export async function estimateShareUrlLength(project: Project): Promise<number> {
  const payload = await encodeProject(project); // plain, fast
  const { origin, pathname } = window.location;
  const base = `${origin}${pathname}#/share/`.length;
  return base + payload.length + 80; // margin covers possible encryption overhead
}
