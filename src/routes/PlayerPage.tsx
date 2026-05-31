import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { playRouteApi } from "../router";
import { getProject } from "../storage/projectStore";
import type { Project } from "../engine/types";
import { Runtime, type RuntimeState } from "../engine/runtime";
import { StageView } from "../components/StageView";
import { TitleScreen } from "../components/TitleScreen";

export function PlayerPage() {
  const { projectId } = playRouteApi.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId).then((p) => {
      if (p) setProject(p);
      else setMissing(true);
    });
  }, [projectId]);

  if (missing) {
    return (
      <Centered>
        <p className="mb-4">プロジェクトが見つかりませんでした。</p>
        <Link to="/" className="text-sky-400 underline">ホームに戻る</Link>
      </Centered>
    );
  }
  if (!project) return <Centered>読み込み中…</Centered>;
  return <Player project={project} />;
}

function Player({ project }: { project: Project }) {
  const runtime = useMemo(() => new Runtime(project), [project]);
  const [, setTick] = useState(0);
  const [state, setState] = useState<RuntimeState>(runtime.state);
  const [started, setStarted] = useState(false);

  // Advance to first stop point only after the user clicks 始める.
  useEffect(() => {
    if (started) setState({ ...runtime.next() });
  }, [started, runtime]);

  const advance = () => {
    setState({ ...runtime.next() });
    setTick((t) => t + 1);
  };
  const select = (i: number) => {
    setState({ ...runtime.select(i) });
    setTick((t) => t + 1);
  };
  const restart = () => {
    runtime.reset();
    setState({ ...runtime.state });
    setStarted(false);
    setTick((t) => t + 1);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      <div className="flex items-center justify-between px-4 py-2 text-sm text-white/80">
        <Link to="/" className="hover:text-white">← ホーム</Link>
        <span className="font-medium">{project.meta.title || project.name}</span>
        <span className="w-16" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-2 sm:p-4">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          {!started
            ? <TitleScreen project={project} onStart={() => setStarted(true)} />
            : <StageView project={project} state={state} onAdvance={advance} onSelect={select} onRestart={restart} enableAudio />
          }
        </div>
        <div className="w-full">
          <p className="mt-2 text-center text-xs text-white/50">
            {state.finished
              ? ""
              : state.choices
                ? "選択肢を選んでください。"
                : "画面をクリック / タップで進む"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      {children}
    </div>
  );
}
