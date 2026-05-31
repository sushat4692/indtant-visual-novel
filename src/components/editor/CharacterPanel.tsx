import type { CharacterDef, Project } from "../../engine/types";
import { builtinAssetsByType } from "../../assets/builtinRegistry";

/** Edit the project's character definitions (key, display name, sprite). */
export function CharacterPanel({
  project,
  onChange,
}: {
  project: Project;
  onChange: (characters: Record<string, CharacterDef>) => void;
}) {
  const chars = project.meta.characters;
  const spriteOptions = builtinAssetsByType("character").map((a) => ({ id: a.id, label: a.label }));

  const update = (key: string, patch: Partial<CharacterDef>) => {
    onChange({ ...chars, [key]: { ...chars[key], ...patch } });
  };
  const rename = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey || chars[newKey]) return;
    const next: Record<string, CharacterDef> = {};
    for (const [k, v] of Object.entries(chars)) next[k === oldKey ? newKey : k] = v;
    onChange(next);
  };
  const add = () => {
    let key = "char1";
    let n = 1;
    while (chars[key]) key = `char${++n}`;
    onChange({ ...chars, [key]: { name: "名前", sprite: spriteOptions[0]?.id ?? "char_male_a" } });
  };
  const remove = (key: string) => {
    const next = { ...chars };
    delete next[key];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">キャラクター</h3>
        <button onClick={add} className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">
          + 追加
        </button>
      </div>
      <div className="space-y-2">
        {Object.entries(chars).map(([key, def]) => (
          <div key={key} className="rounded-lg border border-slate-200 p-2 text-xs">
            <div className="mb-1 flex items-center gap-1">
              <span className="text-slate-600">キー</span>
              <input
                defaultValue={key}
                onBlur={(e) => rename(key, e.target.value.trim())}
                className="w-20 rounded border border-slate-300 px-1 py-0.5 font-mono text-slate-800"
              />
              <button onClick={() => remove(key)} className="ml-auto text-slate-500 hover:text-red-600">
                削除
              </button>
            </div>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-slate-600">表示名</span>
              <input
                value={def.name}
                onChange={(e) => update(key, { name: e.target.value })}
                className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-slate-800"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600">立ち絵</span>
              <select
                value={def.sprite}
                onChange={(e) => update(key, { sprite: e.target.value })}
                className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-slate-800"
              >
                {spriteOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} ({o.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {Object.keys(chars).length === 0 && (
          <p className="text-xs text-slate-500">キャラクター未登録です。</p>
        )}
      </div>
    </div>
  );
}
