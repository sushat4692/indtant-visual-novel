import { useRef, useState } from "react";
import type { Project } from "../../engine/types";

interface RenameState {
  id: string;
  name: string;
  newId: string;
}

export function SceneList({
  project,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onSetStart,
}: {
  project: Project;
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string, newId: string) => void;
  onDelete: (id: string) => void;
  onSetStart: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState<RenameState | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startRename = (s: { id: string; name: string }) => {
    setRenaming({ id: s.id, name: s.name, newId: s.id });
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commit = () => {
    if (!renaming) return;
    const name = renaming.name.trim();
    const newId = renaming.newId.trim();
    if (name && newId) onRename(renaming.id, name, newId);
    setRenaming(null);
  };

  const scenes = Object.values(project.scenes);
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">シーン</h3>
        <button onClick={onAdd} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">
          + 追加
        </button>
      </div>
      <ul className="space-y-1">
        {scenes.map((s) => {
          const isStart = project.meta.startScene === s.id;
          const active = s.id === activeId;
          const isRenaming = renaming?.id === s.id;
          return (
            <li key={s.id}>
              {isRenaming ? (
                <div className="rounded border border-sky-400 bg-white p-1.5 text-xs">
                  <div className="mb-1 flex items-center gap-1">
                    <span className="w-6 shrink-0 text-slate-500">名前</span>
                    <input
                      ref={nameInputRef}
                      value={renaming.name}
                      onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-slate-800 outline-none focus:border-sky-400"
                      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setRenaming(null); }}
                    />
                  </div>
                  <div className="mb-1.5 flex items-center gap-1">
                    <span className="w-6 shrink-0 text-slate-500">ID</span>
                    <input
                      value={renaming.newId}
                      onChange={(e) => setRenaming({ ...renaming, newId: e.target.value })}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 font-mono text-slate-800 outline-none focus:border-sky-400"
                      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setRenaming(null); }}
                    />
                  </div>
                  {renaming.newId !== renaming.id && project.scenes[renaming.newId] && (
                    <p className="mb-1 text-red-600">そのIDは使用中です</p>
                  )}
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setRenaming(null)} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100">
                      キャンセル
                    </button>
                    <button
                      onClick={commit}
                      disabled={!renaming.name.trim() || !renaming.newId.trim() || (renaming.newId !== renaming.id && !!project.scenes[renaming.newId])}
                      className="rounded bg-sky-600 px-2 py-0.5 text-white hover:bg-sky-700 disabled:opacity-40"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`group flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                    active ? "bg-sky-100 text-sky-900" : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <button
                    onClick={() => onSelect(s.id)}
                    onDoubleClick={() => startRename(s)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {isStart && <span title="開始シーン">▶ </span>}
                    {s.name}
                    <span className="ml-1 text-xs text-slate-500">({s.id})</span>
                  </button>
                  <div className="ml-1 hidden shrink-0 gap-1 group-hover:flex">
                    {!isStart && (
                      <button onClick={() => onSetStart(s.id)} title="開始シーンにする" className="text-xs text-slate-500 hover:text-emerald-600">
                        開始
                      </button>
                    )}
                    <button onClick={() => startRename(s)} title="名前・ID変更" className="text-xs text-slate-500 hover:text-sky-600">
                      名
                    </button>
                    <button onClick={() => onDelete(s.id)} title="削除" className="text-xs text-slate-500 hover:text-red-600">
                      ×
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
