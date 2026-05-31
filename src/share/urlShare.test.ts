import { describe, it, expect, beforeAll } from "vitest";
import {
  encodeProject,
  decodeProject,
  getShareMode,
  shareLengthTier,
  estimateShareUrlLength,
} from "./urlShare";
import type { Project } from "../engine/types";

// estimateShareUrlLength / buildShareUrl read window.location; stub it for node.
beforeAll(() => {
  if (typeof (globalThis as { window?: unknown }).window === "undefined") {
    (globalThis as { window?: unknown }).window = {
      location: { origin: "https://example.com", pathname: "/" },
    };
  }
});

function makeProject(scenes: Record<string, string>): Project {
  return {
    id: "p1",
    name: "テスト作品",
    updatedAt: 0,
    meta: {
      title: "テスト作品",
      startScene: "start",
      characters: { taro: { name: "太郎", sprite: "char_male_a" } },
      orientation: "landscape",
    },
    scenes: Object.fromEntries(
      Object.entries(scenes).map(([id, script]) => [id, { id, name: id, script }]),
    ),
    uploadedAssetIds: [],
  };
}

const sample = makeProject({ start: `bg bg_classroom\ntaro: こんにちは\nend\n` });

describe("urlShare encode/decode", () => {
  it("round-trips a plain project", async () => {
    const payload = await encodeProject(sample);
    expect(await decodeProject(payload)).toEqual(sample);
  });

  it("round-trips an encrypted project with the password", async () => {
    const payload = await encodeProject(sample, "secret");
    expect(await decodeProject(payload, "secret")).toEqual(sample);
  });

  it("throws on a wrong password", async () => {
    const payload = await encodeProject(sample, "secret");
    await expect(decodeProject(payload, "wrong")).rejects.toThrow();
  });

  it("throws when an encrypted payload is decoded without a password", async () => {
    const payload = await encodeProject(sample, "secret");
    await expect(decodeProject(payload)).rejects.toThrow();
  });

  it("reports the share mode from the payload flag", async () => {
    expect(getShareMode(await encodeProject(sample))).toBe("plain");
    expect(getShareMode(await encodeProject(sample, "pw"))).toBe("encrypted");
  });

  it("produces URL-safe base64 (no + / =)", async () => {
    const payload = await encodeProject(sample);
    expect(payload).not.toMatch(/[+/=]/);
  });
});

describe("shareLengthTier", () => {
  it("classifies lengths into tiers", () => {
    expect(shareLengthTier(0)).toBe("sns");
    expect(shareLengthTier(5000)).toBe("browser");
    expect(shareLengthTier(20000)).toBe("over");
  });
});

describe("estimateShareUrlLength", () => {
  it("stays small for a short project", async () => {
    expect(await estimateShareUrlLength(sample)).toBeLessThan(2000);
  });

  it("grows past the limit for a huge project", async () => {
    const scenes: Record<string, string> = {};
    for (let i = 0; i < 4000; i++) {
      scenes[`s${i}`] = `taro: これはとても長い物語のセリフ番号 ${i} です。\njump s${i + 1}\n`;
    }
    const huge = makeProject(scenes);
    expect(await estimateShareUrlLength(huge)).toBeGreaterThan(16000);
  });
});
