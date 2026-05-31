import { BUILTIN_ASSETS } from "../../assets/builtinRegistry";

/** Lists builtin asset IDs for use in the DSL (bg / bgm / se / sprite). */
export function AssetPanel() {
  return (
    <div className="space-y-1 text-xs">
      <h3 className="text-sm font-bold text-slate-700">組み込みアセットID</h3>
      <ul className="grid grid-cols-2 gap-x-2">
        {BUILTIN_ASSETS.map((a) => (
          <li key={a.id} className="flex justify-between gap-1">
            <span className="text-slate-600">{a.label}</span>
            <code className="text-slate-600">{a.id}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
