import type { Project } from "../engine/types";
import type { VisibleChar } from "../engine/runtime";
import { useAssetUrl } from "./useAssetUrl";

const POSITION_CLASS: Record<VisibleChar["at"], string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

function Sprite({ char, project }: { char: VisibleChar; project: Project }) {
  const spriteId = project.meta.characters[char.char]?.sprite ?? char.char;
  const url = useAssetUrl(spriteId);
  return (
    <div className={`pointer-events-none absolute inset-0 flex items-end px-[6%] ${POSITION_CLASS[char.at]}`}>
      {url && <img src={url} alt={char.char} className="h-[88%] max-w-[40%] object-contain drop-shadow-xl" />}
    </div>
  );
}

/** Render all currently visible character sprites. */
export function CharacterLayer({ characters, project }: { characters: VisibleChar[]; project: Project }) {
  return (
    <>
      {characters.map((c) => (
        <Sprite key={c.char} char={c} project={project} />
      ))}
    </>
  );
}
