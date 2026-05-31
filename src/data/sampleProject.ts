import type { Project } from "../engine/types";

/** A small branching sample used to seed first-time users. */
export function makeSampleProject(): Project {
  return {
    id: "sample",
    name: "サンプル：放課後の告白",
    updatedAt: Date.now(),
    meta: {
      title: "放課後の告白",
      startScene: "start",
      characters: {
        taro: { name: "太郎", sprite: "char_male_a" },
        hanako: { name: "花子", sprite: "char_female_a" },
      },
      orientation: "landscape",
    },
    scenes: {
      start: {
        id: "start",
        name: "プロローグ",
        script: `# 放課後の教室
bg bg_classroom
show hanako center
: 放課後の教室。西日が机を照らしている。
hanako: あれ、太郎くん。まだ残ってたんだ。
show taro left
taro: うん、ちょっと話したいことがあって。
@shake
hanako: な、なに……？
: 太郎は深呼吸をした。
-> 思いきって告白する : confess
-> やっぱりごまかす : dodge
`,
      },
      confess: {
        id: "confess",
        name: "告白ルート",
        script: `bg bg_sunset
taro: ずっと前から、君が好きだ！
@flash
hanako: ……うん。わたしも。
: 二人の影が、夕日に長く伸びていった。
end
`,
      },
      dodge: {
        id: "dodge",
        name: "ごまかしルート",
        script: `taro: えっと……明日の宿題、どこまでだっけ？
hanako: なーんだ、そんなこと。
: 太郎は心の中で、また今度こそ、と誓った。
end
`,
      },
    },
    uploadedAssetIds: [],
  };
}
