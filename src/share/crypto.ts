// Password-based encryption for play-only exports, using WebCrypto only (no
// external dependencies). AES-GCM with a PBKDF2-derived key.
//
// NOTE: Because the player decrypts in the browser, anyone who knows the
// password can ultimately read the content. This deters casual re-editing and
// extraction, not a determined attacker.

const PBKDF2_ITERATIONS = 150_000;

/** Encrypted payload, all binary fields base64-encoded. */
export interface EncryptedPayload {
  salt: string;
  iv: string;
  ciphertext: string;
  iterations: number;
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** A random byte array backed by a plain ArrayBuffer (not Shared). */
function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length)));
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(value: unknown, password: string): Promise<EncryptedPayload> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Encrypt raw bytes, packing salt(16) + iv(12) + ciphertext into one array.
 * Used by URL sharing where a compact binary form (no JSON/base64 nesting) keeps
 * the payload close to the plaintext size.
 */
export async function encryptBytes(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, toArrayBufferView(data)),
  );
  const out = new Uint8Array(salt.length + iv.length + ciphertext.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(ciphertext, salt.length + iv.length);
  return out;
}

/** Copy into a fresh ArrayBuffer-backed array (satisfies WebCrypto's typing). */
function toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.length));
  copy.set(bytes);
  return copy;
}

/** Decrypt bytes packed by `encryptBytes`. Throws on wrong password. */
export async function decryptBytes(packed: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = toArrayBufferView(packed.slice(0, 16));
  const iv = toArrayBufferView(packed.slice(16, 28));
  const ciphertext = toArrayBufferView(packed.slice(28));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(plaintext);
}

/** Decrypt a payload. Throws if the password is wrong (AES-GCM auth failure). */
export async function decryptJson<T = unknown>(
  payload: EncryptedPayload,
  password: string,
): Promise<T> {
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const key = await deriveKey(password, salt, payload.iterations ?? PBKDF2_ITERATIONS);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    fromBase64(payload.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
