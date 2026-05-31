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
      orientation: "landscape",
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

describe("Runtime — reset & seek", () => {
  it("reset() returns to the first stop point and clears finished", () => {
    const rt = new Runtime(makeProject({ start: `taro: いち\ntaro: に\nend\n` }));
    rt.next();
    rt.next();
    rt.next();
    expect(rt.state.finished).toBe(true);
    rt.reset();
    expect(rt.state.text).toBe("いち");
    expect(rt.state.finished).toBe(false);
  });

  it("seekToLine reconstructs preceding state then stops at the line", () => {
    const rt = new Runtime(
      makeProject({ start: `bg bg_room\nshow taro left\ntaro: A\ntaro: B\n` }),
    );
    rt.seekToLine(4); // line 4 = "taro: B"
    expect(rt.state.text).toBe("B");
    expect(rt.state.background).toBe("bg_room");
    expect(rt.state.characters.some((c) => c.char === "taro")).toBe(true);
  });

  it("seekToLine honours an explicit sceneId", () => {
    const rt = new Runtime(
      makeProject({
        start: `taro: S\njump other\n`,
        other: `bg bg_night\ntaro: O1\ntaro: O2\n`,
      }),
    );
    rt.seekToLine(3, "other"); // line 3 in `other` = "taro: O2"
    expect(rt.state.text).toBe("O2");
    expect(rt.state.background).toBe("bg_night");
  });
});

describe("Runtime — audio, end text, anim, show", () => {
  it("sets endText from end command (empty for plain end)", () => {
    const rt = new Runtime(makeProject({ start: `end おしまい\n` }));
    rt.next();
    expect(rt.state.finished).toBe(true);
    expect(rt.state.endText).toBe("おしまい");

    const rt2 = new Runtime(makeProject({ start: `end\n` }));
    rt2.next();
    expect(rt2.state.endText).toBe("");
  });

  it("triggers se with an incrementing token", () => {
    const rt = new Runtime(makeProject({ start: `se se_door\ntaro: x\n` }));
    rt.next();
    expect(rt.state.se).toBe("se_door");
    expect(rt.state.seToken).toBe(1);
  });

  it("sets bgm and clears it with bgm off", () => {
    const rt = new Runtime(
      makeProject({ start: `bgm bgm_calm\ntaro: A\nbgm off\ntaro: B\n` }),
    );
    rt.next();
    expect(rt.state.bgm).toBe("bgm_calm");
    rt.next();
    expect(rt.state.bgm).toBe(null);
  });

  it("applies a one-shot anim to the targeted character only", () => {
    const rt = new Runtime(
      makeProject({ start: `show taro left\nshow hanako right\nanim taro shake\ntaro: x\n` }),
    );
    rt.next();
    const taro = rt.state.characters.find((c) => c.char === "taro");
    const hanako = rt.state.characters.find((c) => c.char === "hanako");
    expect(taro?.anim).toBe("shake");
    expect(taro?.animToken).toBe(1);
    expect(hanako?.anim).toBeUndefined();
  });

  it("increments enterToken each time a character is shown", () => {
    const rt = new Runtime(
      makeProject({ start: `show taro left\ntaro: A\nshow taro right\ntaro: B\n` }),
    );
    rt.next();
    expect(rt.state.characters.find((c) => c.char === "taro")?.enterToken).toBe(1);
    rt.next();
    const taro = rt.state.characters.find((c) => c.char === "taro");
    expect(taro?.enterToken).toBe(2);
    expect(taro?.at).toBe("right");
  });
});

describe("Runtime — transitions", () => {
  it("sets transition state and duration on jump", () => {
    const rt = new Runtime(
      makeProject({ start: `jump s2 fade slow\n`, s2: `taro: done\nend\n` }),
    );
    rt.next();
    expect(rt.state.transition).toBe("fade");
    expect(rt.state.transitionToken).toBe(1);
    expect(rt.state.transitionDuration).toBe(1.4);
  });

  it("maps speed presets and numeric values to durations", () => {
    const dur = (line: string) => {
      const rt = new Runtime(makeProject({ start: `${line}\n`, s2: `taro: x\n` }));
      rt.next();
      return rt.state.transitionDuration;
    };
    expect(dur("jump s2 fade slow")).toBe(1.4);
    expect(dur("jump s2 fade normal")).toBe(0.7);
    expect(dur("jump s2 fade fast")).toBe(0.35);
    expect(dur("jump s2 fade 1.2")).toBe(1.2);
    expect(dur("jump s2 fade bogus")).toBe(0.7);
  });

  it("applies a transition when a choice is selected", () => {
    const rt = new Runtime(
      makeProject({ start: `-> 行く : s2 white fast\n`, s2: `taro: done\nend\n` }),
    );
    rt.next();
    rt.select(0);
    expect(rt.state.transition).toBe("white");
    expect(rt.state.transitionDuration).toBe(0.35);
    expect(rt.state.text).toBe("done");
  });
});
