import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { shareRouteApi } from "../router";
import type { Project } from "../engine/types";
import { decodeProject, getShareMode } from "../share/urlShare";
import { Player, Centered } from "./PlayerPage";

export function SharePage() {
  const { data } = shareRouteApi.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Plain links decode immediately; encrypted links wait for a password.
  useEffect(() => {
    let mode: "plain" | "encrypted";
    try {
      mode = getShareMode(data);
    } catch {
      setError("リンクが壊れているか、対応していない形式です。");
      return;
    }
    if (mode === "encrypted") {
      setNeedsPassword(true);
      return;
    }
    decodeProject(data).then(setProject).catch(() => {
      setError("リンクが壊れているか、対応していない形式です。");
    });
  }, [data]);

  const submitPassword = async () => {
    setError(null);
    try {
      setProject(await decodeProject(data, password));
    } catch {
      setError("パスワードが正しくありません。");
    }
  };

  if (project) return <Player project={project} />;

  if (needsPassword) {
    return (
      <Centered>
        <p className="mb-3">このリンクはパスワードで保護されています。</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitPassword(); }}
          placeholder="パスワード"
          className="mb-2 w-64 rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
        />
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <button
          onClick={submitPassword}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          再生する
        </button>
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <p className="mb-4">{error}</p>
        <Link to="/" className="text-sky-400 underline">ホームに戻る</Link>
      </Centered>
    );
  }

  return <Centered>読み込み中…</Centered>;
}
