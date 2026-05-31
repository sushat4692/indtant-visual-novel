import type { Project } from "../../engine/types";

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
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onSetStart: (id: string) => void;
}) {
  const scenes = Object.values(project.scenes);
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">シーン</h3>
        <button onClick={onAdd} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">
          + 追加
        </button>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto">
        {scenes.map((s) => {
          const isStart = project.meta.startScene === s.id;
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <div
                className={`group flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                  active ? "bg-sky-100 text-sky-900" : "text-slate-800 hover:bg-slate-100"
                }`}
              >
                <button onClick={() => onSelect(s.id)} className="min-w-0 flex-1 truncate text-left">
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
                  <button onClick={() => onRename(s.id)} title="名前変更" className="text-xs text-slate-500 hover:text-sky-600">
                    名
                  </button>
                  <button onClick={() => onDelete(s.id)} title="削除" className="text-xs text-slate-500 hover:text-red-600">
                    ×
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
