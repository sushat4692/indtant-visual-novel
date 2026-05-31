import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { editorRouteApi } from "../router";
import type { CharacterDef, Project } from "../engine/types";
import { getProject, saveProject } from "../storage/projectStore";
import { listAssets } from "../storage/assetStore";
import type { StoredAsset } from "../storage/db";
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
  const [uploads, setUploads] = useState<StoredAsset[]>([]);
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
    listAssets().then(setUploads);
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
  const renameScene = (id: string) => {
    const name = prompt("シーン名", project.scenes[id].name);
    if (name == null) return;
    mutate((p) => ({ ...p, scenes: { ...p.scenes, [id]: { ...p.scenes[id], name } } }));
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
  const onUploaded = (asset: StoredAsset) => {
    setUploads((u) => [...u, asset]);
    mutate((p) => ({ ...p, uploadedAssetIds: [...new Set([...p.uploadedAssetIds, asset.id])] }));
  };

  const sceneErrors = scene ? (() => {
    const r = parseScene(scene.script);
    return r.ok ? [] : r.errors;
  })() : [];
  const knownAssetIds = new Set(uploads.map((u) => u.id));
  const projectErrors = validateProject(project, knownAssetIds).filter((e) => e.scene === activeScene);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">← ホーム</Link>
          <input
            value={project.name}
            onChange={(e) => mutate((p) => ({ ...p, name: e.target.value, meta: { ...p.meta, title: e.target.value } }))}
            className="rounded border border-transparent px-2 py-1 text-sm font-bold hover:border-slate-300 focus:border-sky-500 focus:outline-none"
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
          <button onClick={() => setShowExport(true)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
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
          <CharacterPanel project={project} uploads={uploads} onChange={setCharacters} />
          <hr className="border-slate-200" />
          <AssetPanel uploads={uploads} onUploaded={onUploaded} />
        </aside>

        {/* Center: script editor */}
        <main className="col-span-5 overflow-hidden rounded-lg bg-white p-3">
          {scene ? (
            <ScriptEditor value={scene.script} onChange={updateScript} errors={[...sceneErrors, ...projectErrors]} />
          ) : (
            <p className="text-slate-400">シーンを選択してください。</p>
          )}
        </main>

        {/* Right: live preview */}
        <section className="col-span-4 flex flex-col gap-2 overflow-y-auto rounded-lg bg-white p-3">
          <h3 className="text-sm font-bold text-slate-600">プレビュー（このシーン）</h3>
          {scene && <ScenePreview project={project} sceneId={activeScene} />}
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
function ScenePreview({ project, sceneId }: { project: Project; sceneId: string }) {
  const script = project.scenes[sceneId]?.script ?? "";
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
      <StageView
        project={project}
        state={state}
        onAdvance={() => setState({ ...runtime.next() })}
        onSelect={(i) => setState({ ...runtime.select(i) })}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => setState({ ...runtime.next() })}
          className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800"
        >
          次へ ▶
        </button>
        <span className="text-xs text-slate-400">
          {state.finished ? "終了" : state.choices ? "選択肢待ち" : "クリックで進む"}
        </span>
      </div>
    </div>
  );
}
