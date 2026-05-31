import { useEffect, useState } from "react";
import type { Project } from "../engine/types";
import type { VisibleChar } from "../engine/runtime";
import { useAssetUrl } from "./useAssetUrl";

const POSITION_CLASS: Record<VisibleChar["at"], string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const CHAR_ANIM_CLASS: Record<string, string> = {
  shake:  "vn-char-shake",
  bounce: "vn-char-bounce",
  sway:   "vn-char-sway",
  pulse:  "vn-char-pulse",
  flash:  "vn-char-flash",
  nod:    "vn-char-nod",
};

function CharacterSprite({ char, project }: { char: VisibleChar; project: Project }) {
  const spriteId = project.meta.characters[char.char]?.sprite ?? char.char;
  const url = useAssetUrl(spriteId);
  const [animClass, setAnimClass] = useState("");

  // One-shot animation via anim command (effectToken pattern).
  useEffect(() => {
    if (!char.anim) return;
    const cls = CHAR_ANIM_CLASS[char.anim] ?? "";
    setAnimClass(cls);
    const timer = setTimeout(() => setAnimClass(""), 900);
    return () => clearTimeout(timer);
  }, [char.anim, char.animToken]);

  return (
    <div
      className={`vn-char-enter pointer-events-none absolute inset-0 flex items-end px-[6%] ${POSITION_CLASS[char.at]}`}
    >
      {url && (
        <img
          src={url}
          alt={char.char}
          className={`h-[88%] max-w-[40%] object-contain drop-shadow-xl ${animClass}`}
        />
      )}
    </div>
  );
}

/** Render all currently visible character sprites. */
export function CharacterLayer({ characters, project }: { characters: VisibleChar[]; project: Project }) {
  return (
    <>
      {characters.map((c) => (
        // Key includes enterToken so React unmounts+remounts on each show,
        // triggering the .vn-char-enter CSS animation on the new DOM node.
        <CharacterSprite key={`${c.char}-${c.enterToken}`} char={c} project={project} />
      ))}
    </>
  );
}
