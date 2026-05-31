import { useEffect, useState } from "react";
import type { Project } from "../../engine/types";
import { exportEditable, exportPlayLocked, estimateBundleSize } from "../../share/exportProject";
import {
  buildShareUrl,
  estimateShareUrlLength,
  shareLengthTier,
  isUrlShareSupported,
} from "../../share/urlShare";

type Method = "file" | "url";
type Protect = "none" | "password";

/** Modal to export as a file or a share URL, optionally password-protected. */
export function ExportDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const [method, setMethod] = useState<Method>("file");
  const [protect, setProtect] = useState<Protect>("none");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [urlLen, setUrlLen] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    estimateBundleSize(project).then((bytes) => {
      if (bytes > 4 * 1024 * 1024) {
        setSizeWarning(`同梱画像が約 ${(bytes / 1024 / 1024).toFixed(1)}MB あります。共有ファイルが大きくなります。`);
      }
    });
  }, [project]);

  // Estimate the share URL length when URL method is selected (fast, no PBKDF2).
  useEffect(() => {
    if (method !== "url" || !isUrlShareSupported()) return;
    let active = true;
    estimateShareUrlLength(project).then((len) => {
      if (active) setUrlLen(len);
    });
    return () => { active = false; };
  }, [method, project]);

  const tier = urlLen != null ? shareLengthTier(urlLen) : null;
  const urlSupported = isUrlShareSupported();
  const urlBlocked = method === "url" && (!urlSupported || tier === "over");

  const run = async () => {
    setError(null);
    setCopied(false);
    if (protect === "password" && password.length < 4) {
      setError("パスワードは4文字以上にしてください。");
      return;
    }
    setBusy(true);
    try {
      const pw = protect === "password" ? password : undefined;
      if (method === "file") {
        if (pw) await exportPlayLocked(project, pw);
        else await exportEditable(project);
        onClose();
      } else {
        const { url } = await buildShareUrl(project, pw);
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const radio = (checked: boolean, onChange: () => void, title: string, desc: string) => (
    <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
      <input type="radio" checked={checked} onChange={onChange} className="mt-1" />
      <div>
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-600">{desc}</div>
      </div>
    </label>
  );

  const actionLabel = busy
    ? (method === "file" ? "出力中…" : "生成中…")
    : (method === "file" ? "エクスポート" : copied ? "コピーしました" : "リンクをコピー");

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-slate-800">共有 / エクスポート</h2>

        {/* 配布方法 */}
        <div className="mb-1 text-xs font-bold text-slate-500">配布方法</div>
        <div className="mb-3 flex gap-2">
          {radio(method === "file", () => { setMethod("file"); setCopied(false); }, "ファイル", "JSON を書き出して渡す")}
          {radio(method === "url", () => { setMethod("url"); setCopied(false); }, "URLリンク", "リンクを渡してその場で再生")}
        </div>

        {/* 保護 */}
        <div className="mb-1 text-xs font-bold text-slate-500">保護</div>
        <div className="mb-3 flex gap-2">
          {radio(protect === "none", () => setProtect("none"), "なし", method === "file" ? "編集可能な平文" : "誰でも開ける")}
          {radio(protect === "password", () => setProtect("password"), "パスワード", "暗号化・再生専用")}
        </div>
        {protect === "password" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（4文字以上）"
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          />
        )}

        {/* URL 長の段階案内 */}
        {method === "url" && (
          <div className="mb-1 text-xs">
            {!urlSupported ? (
              <p className="text-red-600">このブラウザは URL 共有に対応していません。ファイル配布をご利用ください。</p>
            ) : urlLen == null ? (
              <p className="text-slate-500">URL長を計算中…</p>
            ) : tier === "over" ? (
              <p className="text-red-600">内容が大きすぎて URL 共有できません（約 {urlLen.toLocaleString()} 文字）。ファイル配布をご利用ください。</p>
            ) : tier === "browser" ? (
              <p className="text-amber-600">約 {urlLen.toLocaleString()} 文字。ブラウザ・チャット向き（X 等の公開 SNS では不安定）。</p>
            ) : (
              <p className="text-emerald-600">約 {urlLen.toLocaleString()} 文字。SNS・チャット・ブラウザいずれも OK。</p>
            )}
          </div>
        )}

        {method === "file" && sizeWarning && <p className="mt-1 text-xs text-amber-600">{sizeWarning}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <p className="mt-3 text-xs text-slate-500">
          ※ ブラウザ再生のため暗号化は完全な保護ではありません（パスワードを知る人には内容が渡ります）。
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            閉じる
          </button>
          <button
            onClick={run}
            disabled={busy || urlBlocked}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
