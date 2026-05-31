import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Project } from "../engine/types";
import { listProjects, saveProject, deleteProject, getProject } from "../storage/projectStore";
import { makeSampleProject } from "../data/sampleProject";
import { parseExportFile, importEditable, importPlayLocked } from "../share/importProject";
import type { PlayFile } from "../share/format";

const SEED_FLAG = "ivn.seeded";

function blankProject(): Project {
  const id = crypto.randomUUID();
  return {
    id,
    name: "新しいノベル",
    updatedAt: Date.now(),
    meta: {
      title: "新しいノベル",
      startScene: "start",
      characters: {},
    },
    scenes: {
      start: { id: "start", name: "最初のシーン", script: ": ここから物語が始まる。\nend\n" },
    },
    uploadedAssetIds: [],
  };
}

export function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingPlay, setPendingPlay] = useState<PlayFile | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refresh = () => listProjects().then(setProjects);

  useEffect(() => {
    // Seed the sample once on first ever visit.
    (async () => {
      if (!localStorage.getItem(SEED_FLAG)) {
        const existing = await getProject("sample");
        if (!existing) await saveProject(makeSampleProject());
        localStorage.setItem(SEED_FLAG, "1");
      }
      await refresh();
    })();
  }, []);

  const onCreate = async () => {
    const p = blankProject();
    await saveProject(p);
    navigate({ to: "/editor/$projectId", params: { projectId: p.id } });
  };

  const onDelete = async (id: string) => {
    if (!confirm("このプロジェクトを削除しますか？")) return;
    await deleteProject(id);
    await refresh();
  };

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    try {
      const parsed = parseExportFile(await file.text());
      if (parsed.mode === "editable") {
        const p = await importEditable(parsed);
        await refresh();
        navigate({ to: "/editor/$projectId", params: { projectId: p.id } });
      } else {
        setPendingPlay(parsed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmPlayImport = async () => {
    if (!pendingPlay) return;
    setError(null);
    try {
      const p = await importPlayLocked(pendingPlay, password);
      setPendingPlay(null);
      setPassword("");
      await refresh();
      navigate({ to: "/play/$projectId", params: { projectId: p.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Instant Visual Novel</h1>
            <p className="text-sm text-slate-500">ブラウザで作る・遊ぶビジュアルノベル</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              インポート
            </button>
            <button
              onClick={onCreate}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              新規作成
            </button>
          </div>
        </header>

        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <p className="mb-4 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-center text-sm text-slate-500">
          .vnproj.json / .vnplay.json をここにドラッグ&ドロップしてインポートできます
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <ul className="space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{p.name}</span>
                  {p.locked && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                      プレイ専用
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(p.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  to="/play/$projectId"
                  params={{ projectId: p.id }}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  再生
                </Link>
                {!p.locked && (
                  <Link
                    to="/editor/$projectId"
                    params={{ projectId: p.id }}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    編集
                  </Link>
                )}
                <button
                  onClick={() => onDelete(p.id)}
                  className="rounded-md px-2 py-1.5 text-sm text-slate-400 hover:text-red-600"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-400">
              プロジェクトがありません。「新規作成」から始めましょう。
            </li>
          )}
        </ul>
      </div>

      {pendingPlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold">プレイ専用ファイル</h2>
            <p className="mb-4 text-sm text-slate-500">
              「{pendingPlay.title}」を再生するにはパスワードが必要です。
            </p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmPlayImport()}
              placeholder="パスワード"
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setPendingPlay(null);
                  setPassword("");
                  setError(null);
                }}
                className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100"
              >
                キャンセル
              </button>
              <button
                onClick={confirmPlayImport}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                取り込んで再生
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
