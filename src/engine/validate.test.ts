import { describe, it, expect } from "vitest";
import { validateProject } from "./validate";
import type { Project } from "./types";

function makeProject(scenes: Record<string, string>, startScene = "start"): Project {
  return {
    id: "p1",
    name: "test",
    updatedAt: 0,
    meta: {
      title: "test",
      startScene,
      characters: { taro: { name: "太郎", sprite: "char_male_a" } },
      orientation: "landscape",
    },
    scenes: Object.fromEntries(
      Object.entries(scenes).map(([id, script]) => [id, { id, name: id, script }]),
    ),
    uploadedAssetIds: [],
  };
}

const NO_UPLOADS = new Set<string>();

describe("validateProject", () => {
  it("returns no errors for a valid project", () => {
    const project = makeProject({
      start: `bg bg_classroom\nshow taro left\ntaro: やあ\njump s2\n`,
      s2: `taro: またね\nend\n`,
    });
    expect(validateProject(project, NO_UPLOADS)).toEqual([]);
  });

  it("flags a missing start scene", () => {
    const project = makeProject({ start: `taro: hi\n` }, "nope");
    const errors = validateProject(project, NO_UPLOADS);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("flags an unknown jump target", () => {
    const project = makeProject({ start: `jump ghost\n` });
    expect(validateProject(project, NO_UPLOADS).length).toBeGreaterThan(0);
  });

  it("flags an unknown choice target", () => {
    const project = makeProject({ start: `-> 行く : ghost\n` });
    expect(validateProject(project, NO_UPLOADS).length).toBeGreaterThan(0);
  });

  it("flags an undefined character in show", () => {
    const project = makeProject({ start: `show unknown left\n` });
    expect(validateProject(project, NO_UPLOADS).length).toBeGreaterThan(0);
  });

  it("flags an unknown asset id", () => {
    const project = makeProject({ start: `bg ghost_bg\n` });
    expect(validateProject(project, NO_UPLOADS).length).toBeGreaterThan(0);
  });

  it("does not flag bgm off (no asset to check)", () => {
    const project = makeProject({ start: `bgm off\ntaro: hi\nend\n` });
    expect(validateProject(project, NO_UPLOADS)).toEqual([]);
  });

  it("accepts builtin asset ids without uploads", () => {
    const project = makeProject({ start: `bg bg_sunset\nshow taro left\nend\n` });
    expect(validateProject(project, NO_UPLOADS)).toEqual([]);
  });
});
