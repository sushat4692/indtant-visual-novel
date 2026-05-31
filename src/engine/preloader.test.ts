import { describe, it, expect } from "vitest";
import { collectAssetIds } from "./preloader";
import type { Project } from "./types";

function makeProject(
  scenes: Record<string, string>,
  opts: { titleBg?: string; characters?: Project["meta"]["characters"] } = {},
): Project {
  return {
    id: "p1",
    name: "test",
    updatedAt: 0,
    meta: {
      title: "test",
      startScene: "start",
      characters: opts.characters ?? { taro: { name: "太郎", sprite: "char_male_a" } },
      orientation: "landscape",
      titleBg: opts.titleBg,
    },
    scenes: Object.fromEntries(
      Object.entries(scenes).map(([id, script]) => [id, { id, name: id, script }]),
    ),
    uploadedAssetIds: [],
  };
}

describe("collectAssetIds", () => {
  it("collects background images", () => {
    const { images } = collectAssetIds(makeProject({ start: `bg bg_classroom\n` }));
    expect(images).toContain("bg_classroom");
  });

  it("collects character sprites from show", () => {
    const { images } = collectAssetIds(makeProject({ start: `show taro left\n` }));
    expect(images).toContain("char_male_a");
  });

  it("collects bgm and se audio", () => {
    const { audio } = collectAssetIds(makeProject({ start: `bgm m1\nse s1\n` }));
    expect(audio).toEqual(expect.arrayContaining(["m1", "s1"]));
  });

  it("skips bgm off (null asset)", () => {
    const { audio } = collectAssetIds(makeProject({ start: `bgm off\n` }));
    expect(audio).toEqual([]);
  });

  it("includes the title background", () => {
    const { images } = collectAssetIds(makeProject({ start: `taro: hi\n` }, { titleBg: "bg_night" }));
    expect(images).toContain("bg_night");
  });

  it("deduplicates repeated asset ids", () => {
    const { images } = collectAssetIds(makeProject({ start: `bg bg_classroom\nbg bg_classroom\n` }));
    expect(images.filter((id) => id === "bg_classroom")).toHaveLength(1);
  });

  it("skips unparseable scenes without crashing", () => {
    const result = collectAssetIds(makeProject({ start: `!!!broken`, s2: `bg bg_room\n` }));
    expect(result.images).toContain("bg_room");
  });

  it("ignores show for an undefined character", () => {
    const { images } = collectAssetIds(makeProject({ start: `show ghost left\n` }));
    expect(images).toEqual([]);
  });
});
