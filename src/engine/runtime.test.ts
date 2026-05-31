import { describe, it, expect } from "vitest";
import { Runtime } from "./runtime";
import type { Project } from "./types";

function makeProject(scenes: Record<string, string>, startScene = "start"): Project {
  return {
    id: "p1",
    name: "test",
    updatedAt: 0,
    meta: {
      title: "test",
      startScene,
      characters: { taro: { name: "太郎", sprite: "char_a" } },
    },
    scenes: Object.fromEntries(
      Object.entries(scenes).map(([id, script]) => [id, { id, name: id, script }]),
    ),
    uploadedAssetIds: [],
  };
}

describe("Runtime", () => {
  it("advances through lines and stops at each one", () => {
    const rt = new Runtime(makeProject({ start: `bg bg_room\ntaro: こんにちは\n: ナレーション\n` }));
    rt.next();
    expect(rt.state.background).toBe("bg_room");
    expect(rt.state.speaker).toBe("太郎");
    expect(rt.state.text).toBe("こんにちは");
    rt.next();
    expect(rt.state.speaker).toBe(null);
    expect(rt.state.text).toBe("ナレーション");
  });

  it("resolves a choice by jumping to the target scene", () => {
    const rt = new Runtime(
      makeProject({
        start: `-> A : sceneA\n-> B : sceneB\n`,
        sceneA: `taro: Aです\nend\n`,
        sceneB: `taro: Bです\nend\n`,
      }),
    );
    rt.next();
    expect(rt.state.choices).toHaveLength(2);
    rt.select(1);
    expect(rt.state.text).toBe("Bです");
  });

  it("follows jump and reaches end", () => {
    const rt = new Runtime(
      makeProject({ start: `jump other\n`, other: `taro: ゴール\nend\n` }),
    );
    rt.next();
    expect(rt.state.text).toBe("ゴール");
    rt.next();
    expect(rt.state.finished).toBe(true);
  });

  it("finishes when a scene runs out of commands", () => {
    const rt = new Runtime(makeProject({ start: `taro: 最後\n` }));
    rt.next();
    expect(rt.state.finished).toBe(false);
    rt.next();
    expect(rt.state.finished).toBe(true);
  });
});
