import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { editorRouteApi } from "../router";
import type { CharacterDef, Orientation, Project } from "../engine/types";
import { ORIENTATION_LABEL, resolveOrientation } from "../engine/orientation";
import { getProject, saveProject } from "../storage/projectStore";
import { BUILTIN_ASSETS, builtinAssetsByType } from "../assets/builtinRegistry";
import { parseScene } from "../engine/parser";
import { validateProject } from "../engine/validate";
import { Runtime } from "../engine/runtime";
import { StageView } from "../components/StageView";
import { SceneList } from "../components/editor/SceneList";
import { ScriptEditor } from "../components/editor/ScriptEditor";
import { CharacterPanel } from "../components/editor/CharacterPanel";
import { AssetPanel } from "../components/editor/AssetPanel";
import { ExportDialog } from "../components/editor/ExportDialog";

export function EditorPage() {
  const { projectId } = editorRouteApi.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeScene, setActiveScene] = useState<string>("");
  const [cursorLine, setCursorLine] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId).then((p) => {
      if (!p) return setMissing(true);
      if (p.locked) {
        // Play-only projects must not be edited.
        navigate({ to: "/play/$projectId", params: { projectId: p.id }, replace: true });
        return;
      }
      setProject(p);
      setActiveScene(p.meta.startScene in p.scenes ? p.meta.startScene : Object.keys(p.scenes)[0] ?? "");
    });
  }, [projectId, navigate]);

  // Debounced autosave whenever the project changes.
  const saveTimer = useRef<number | null>(null);
  const scheduleSave = useCallback((next: Project) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveProject(next), 400);
  }, []);

  const mutate = useCallback(
    (updater: (p: Project) => Project) => {
      setProject((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>プロジェクトが見つかりませんでした。</p>
        <Link to="/" className="text-sky-600 underline">ホームに戻る</Link>
      </div>
    );
  }
  if (!project) return <div className="p-8 text-slate-500">読み込み中…</div>;

  const scene = project.scenes[activeScene];

  const updateScript = (script: string) =>
    mutate((p) => ({
      ...p,
      scenes: { ...p.scenes, [activeScene]: { ...p.scenes[activeScene], script } },
    }));

  const addScene = () => {
    let id = "scene1";
    let n = 1;
    while (project.scenes[id]) id = `scene${++n}`;
    mutate((p) => ({
      ...p,
      scenes: { ...p.scenes, [id]: { id, name: id, script: ": 新しいシーン\n" } },
    }));
    setActiveScene(id);
  };
  const renameScene = (id: string, name: string, newId: string) => {
    mutate((p) => {
      // Update display name on existing key first.
      let scenes: typeof p.scenes = { ...p.scenes, [id]: { ...p.scenes[id], name } };
      let meta = p.meta;

      if (newId !== id && !p.scenes[newId]) {
        // Move scene to new key.
        const entry = { ...scenes[id], id: newId };
        const reordered: typeof scenes = {};
        for (const [k, v] of Object.entries(scenes)) {
          reordered[k === id ? newId : k] = k === id ? entry : v;
        }
        // Rewrite jump / choice targets in all scene scripts.
        for (const sid of Object.keys(reordered)) {
          reordered[sid] = {
            ...reordered[sid],
            script: reordered[sid].script
              .split("\n")
              .map((line) => {
                const t = line.trim();
                // jump <id>
                if (t === `jump ${id}` || t.startsWith(`jump ${id} `))
                  return line.replace(`jump ${id}`, `jump ${newId}`);
                // -> text : <id>
                if (t.startsWith("->")) {
                  const last = line.lastIndexOf(":");
                  if (last !== -1 && line.slice(last + 1).trim() === id)
                    return line.slice(0, last + 1) + " " + newId;
                }
                return line;
              })
              .join("\n"),
          };
        }
        if (meta.startScene === id) meta = { ...meta, startScene: newId };
        scenes = reordered;
        // Keep activeScene in sync (caller side handles via setActiveScene).
      }

      return { ...p, scenes, meta };
    });
    if (newId !== id) setActiveScene(newId);
  };
  const deleteScene = (id: string) => {
    if (Object.keys(project.scenes).length <= 1) {
      alert("最後のシーンは削除できません。");
      return;
    }
    if (!confirm(`シーン "${project.scenes[id].name}" を削除しますか？`)) return;
    mutate((p) => {
      const scenes = { ...p.scenes };
      delete scenes[id];
      const startScene = p.meta.startScene === id ? Object.keys(scenes)[0] : p.meta.startScene;
      return { ...p, scenes, meta: { ...p.meta, startScene } };
    });
    if (activeScene === id) setActiveScene(Object.keys(project.scenes).filter((s) => s !== id)[0]);
  };
  const setStart = (id: string) =>
    mutate((p) => ({ ...p, meta: { ...p.meta, startScene: id } }));
  const setCharacters = (characters: Record<string, CharacterDef>) =>
    mutate((p) => ({ ...p, meta: { ...p.meta, characters } }));
  const setOrientation = (orientation: Orientation) =>
    mutate((p) => ({ ...p, meta: { ...p.meta, orientation } }));

  const sceneErrors = scene ? (() => {
    const r = parseScene(scene.script);
    return r.ok ? [] : r.errors;
  })() : [];
  const knownAssetIds = new Set(BUILTIN_ASSETS.map((a) => a.id));
  const projectErrors = validateProject(project, knownAssetIds).filter((e) => e.scene === activeScene);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">← ホーム</Link>
          <input
            value={project.name}
            onChange={(e) => mutate((p) => ({ ...p, name: e.target.value, meta: { ...p.meta, title: e.target.value } }))}
            className="rounded border border-transparent px-2 py-1 text-sm font-bold text-slate-800 hover:border-slate-300 focus:border-sky-500 focus:outline-none"
          />
          <OrientationToggle
            value={resolveOrientation(project.meta.orientation)}
            onChange={setOrientation}
          />
        </div>
        <div className="flex gap-2">
          <Link
            to="/play/$projectId"
            params={{ projectId: project.id }}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            再生
          </Link>
          <button onClick={() => setShowExport(true)} className="rounded-lg border border-slate-400 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            エクスポート
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-12 gap-3 overflow-hidden p-3">
        {/* Left: scene list + characters + assets */}
        <aside className="col-span-3 flex flex-col gap-3 overflow-y-auto rounded-lg bg-white p-3">
          <SceneList
            project={project}
            activeId={activeScene}
            onSelect={setActiveScene}
            onAdd={addScene}
            onRename={renameScene}
            onDelete={deleteScene}
            onSetStart={setStart}
          />
          <hr className="border-slate-200" />
          <CharacterPanel project={project} onChange={setCharacters} />
          <hr className="border-slate-200" />
          <AssetPanel />
          <hr className="border-slate-200" />
          <div className="space-y-1.5 text-xs">
            <h3 className="text-sm font-bold text-slate-700">プロジェクト設定</h3>
            <div className="flex items-center gap-1">
              <span className="w-16 shrink-0 text-slate-600">タイトル背景</span>
              <select
                value={project.meta.titleBg ?? ""}
                onChange={(e) =>
                  mutate((p) => ({
                    ...p,
                    meta: { ...p.meta, titleBg: e.target.value || undefined },
                  }))
                }
                className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-slate-800"
              >
                <option value="">なし</option>
                {builtinAssetsByType("background").map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Center: script editor */}
        <main className="col-span-5 overflow-hidden rounded-lg bg-white p-3">
          {scene ? (
            <ScriptEditor
              value={scene.script}
              onChange={updateScript}
              errors={[...sceneErrors, ...projectErrors]}
              onCursorChange={setCursorLine}
              completionData={{
                characterKeys: Object.keys(project.meta.characters),
                sceneIds: Object.keys(project.scenes),
                assetIds: BUILTIN_ASSETS.map((a) => a.id),
              }}
            />
          ) : (
            <p className="text-slate-400">シーンを選択してください。</p>
          )}
        </main>

        {/* Right: live preview */}
        <section className="col-span-4 flex flex-col gap-2 overflow-y-auto rounded-lg bg-white p-3">
          <h3 className="text-sm font-bold text-slate-600">プレビュー（このシーン）</h3>
          {scene && <ScenePreview project={project} sceneId={activeScene} cursorLine={cursorLine} />}
        </section>
      </div>

      {showExport && <ExportDialog project={project} onClose={() => setShowExport(false)} />}
    </div>
  );
}

/**
 * Live preview that runs a single scene from its start. Re-creates the runtime
 * whenever the scene content changes so edits are reflected immediately.
 */
function ScenePreview({ project, sceneId, cursorLine }: { project: Project; sceneId: string; cursorLine: number }) {
  const script = project.scenes[sceneId]?.script ?? "";
  const savedOrientation = resolveOrientation(project.meta.orientation);
  // Transient preview-only orientation override; does not change the saved value.
  const [previewOrientation, setPreviewOrientation] = useState<Orientation>(savedOrientation);
  // Follow the project's orientation whenever the author changes it.
  useEffect(() => {
    setPreviewOrientation(savedOrientation);
  }, [savedOrientation]);

  // Build a project whose start scene is the one being previewed.
  const runtime = useMemo(() => {
    const previewProject: Project = { ...project, meta: { ...project.meta, startScene: sceneId } };
    return new Runtime(previewProject);
    // Re-init when the scene id or its script changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, script, project.meta.characters]);

  const [state, setState] = useState(() => ({ ...runtime.next() }));
  useEffect(() => {
    setState({ ...runtime.next() });
  }, [runtime]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <OrientationToggle value={previewOrientation} onChange={setPreviewOrientation} />
        {previewOrientation !== savedOrientation && (
          <span className="text-xs text-amber-600">プレビュー確認用（保存値は{ORIENTATION_LABEL[savedOrientation]}）</span>
        )}
      </div>
      {/* Fixed-height frame so the fit-box can letterbox portrait/landscape. */}
      <div className="h-[55vh] w-full">
        <StageView
          project={project}
          state={state}
          orientation={previewOrientation}
          onAdvance={() => setState({ ...runtime.next() })}
          onSelect={(i) => setState({ ...runtime.select(i) })}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => setState({ ...runtime.next() })}
          className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800"
        >
          次へ ▶
        </button>
        <button
          onClick={() => setState({ ...runtime.seekToLine(cursorLine, sceneId) })}
          className="rounded bg-sky-700 px-3 py-1 text-xs text-white hover:bg-sky-800"
          title={`${cursorLine}行目から再生`}
        >
          カーソル位置から ▶
        </button>
        <span className="text-xs text-slate-400">
          {state.finished ? "終了" : state.choices ? "選択肢待ち" : "クリックで進む"}
        </span>
      </div>
    </div>
  );
}

/** A two-button segmented control for choosing landscape / portrait. */
function OrientationToggle({
  value,
  onChange,
}: {
  value: Orientation;
  onChange: (orientation: Orientation) => void;
}) {
  const orientations: Orientation[] = ["landscape", "portrait"];
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-xs">
      {orientations.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2 py-1 ${
            value === o ? "bg-sky-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {ORIENTATION_LABEL[o]}
        </button>
      ))}
    </div>
  );
}
