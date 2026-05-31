import { useRef } from "react";
import { BUILTIN_ASSETS } from "../../assets/builtinRegistry";
import { saveAsset, newAssetId } from "../../storage/assetStore";
import type { StoredAsset } from "../../storage/db";

/**
 * Lists builtin asset ids and lets the user upload images (stored in IndexedDB).
 * Uploaded asset ids can then be referenced from the DSL (bg / sprite).
 */
export function AssetPanel({
  uploads,
  onUploaded,
}: {
  uploads: StoredAsset[];
  onUploaded: (asset: StoredAsset) => void;
}) {
  const bgInput = useRef<HTMLInputElement>(null);
  const charInput = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined, type: "background" | "character") => {
    if (!file) return;
    const asset: StoredAsset = { id: newAssetId(), type, name: file.name, blob: file };
    await saveAsset(asset);
    onUploaded(asset);
  };

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-600">画像アップロード</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => bgInput.current?.click()} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">
            背景を追加
          </button>
          <button onClick={() => charInput.current?.click()} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">
            立ち絵を追加
          </button>
        </div>
        <input ref={bgInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "background")} />
        <input ref={charInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "character")} />
      </div>

      {uploads.length > 0 && (
        <div>
          <h4 className="mb-1 font-bold text-slate-500">アップロード済み</h4>
          <ul className="space-y-0.5">
            {uploads.map((u) => (
              <li key={u.id} className="flex justify-between">
                <span className="truncate">{u.name}</span>
                <code className="ml-2 shrink-0 text-slate-400">{u.id}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="mb-1 font-bold text-slate-500">組み込みアセットID</h4>
        <ul className="grid grid-cols-2 gap-x-2">
          {BUILTIN_ASSETS.map((a) => (
            <li key={a.id} className="flex justify-between">
              <span className="text-slate-500">{a.label}</span>
              <code className="text-slate-400">{a.id}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
