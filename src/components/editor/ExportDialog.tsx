import { useEffect, useState } from "react";
import type { Project } from "../../engine/types";
import { exportEditable, exportPlayLocked, estimateBundleSize } from "../../share/exportProject";

type Mode = "editable" | "play";

/** Modal to choose between an editable (plaintext) or play-only (encrypted) export. */
export function ExportDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("editable");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  useEffect(() => {
    estimateBundleSize(project).then((bytes) => {
      if (bytes > 4 * 1024 * 1024) {
        setSizeWarning(`同梱画像が約 ${(bytes / 1024 / 1024).toFixed(1)}MB あります。共有ファイルが大きくなります。`);
      }
    });
  }, [project]);

  const run = async () => {
    setError(null);
    if (mode === "play" && password.length < 4) {
      setError("パスワードは4文字以上にしてください。");
      return;
    }
    setBusy(true);
    try {
      if (mode === "editable") await exportEditable(project);
      else await exportPlayLocked(project, password);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">エクスポート</h2>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input type="radio" checked={mode === "editable"} onChange={() => setMode("editable")} className="mt-1" />
            <div>
              <div className="text-sm font-medium">編集可（平文）</div>
              <div className="text-xs text-slate-600">
                .vnproj.json を出力。インポートすると編集できます。
              </div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input type="radio" checked={mode === "play"} onChange={() => setMode("play")} className="mt-1" />
            <div className="flex-1">
              <div className="text-sm font-medium">編集不可（パスワード暗号化）</div>
              <div className="text-xs text-slate-600">
                .vnplay.json を出力。再生専用で、編集はできません。
              </div>
              {mode === "play" && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="再生用パスワード"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                />
              )}
            </div>
          </label>
        </div>

        {sizeWarning && <p className="mt-3 text-xs text-amber-600">{sizeWarning}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <p className="mt-3 text-xs text-slate-500">
          ※ ブラウザ再生のため暗号化は完全な保護ではありません（パスワードを知る人には内容が渡ります）。
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            キャンセル
          </button>
          <button
            onClick={run}
            disabled={busy}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {busy ? "出力中…" : "エクスポート"}
          </button>
        </div>
      </div>
    </div>
  );
}
