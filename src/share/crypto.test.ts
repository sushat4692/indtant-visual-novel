import { describe, it, expect } from "vitest";
import { encryptJson, decryptJson } from "./crypto";

// Node 18+ exposes WebCrypto as the global `crypto`, which these functions use.

describe("crypto round trip", () => {
  it("decrypts what it encrypted with the right password", async () => {
    const data = { hello: "世界", n: 42, nested: { a: [1, 2, 3] } };
    const payload = await encryptJson(data, "s3cret");
    const out = await decryptJson(payload, "s3cret");
    expect(out).toEqual(data);
  });

  it("does not leak plaintext into the payload", async () => {
    const payload = await encryptJson({ secret: "コードネーム" }, "pw1234");
    expect(JSON.stringify(payload)).not.toContain("コードネーム");
    expect(JSON.stringify(payload)).not.toContain("secret");
  });

  it("fails to decrypt with a wrong password", async () => {
    const payload = await encryptJson({ x: 1 }, "correct-horse");
    await expect(decryptJson(payload, "wrong-password")).rejects.toBeDefined();
  });
});
