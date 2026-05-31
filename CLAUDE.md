# CLAUDE.md

ブラウザで動くビジュアルノベル作成・再生プラットフォーム。独自 DSL でシーンを記述し、エディタで編集・プレビュー、プレイヤーで再生する。

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — 型チェック + ビルド
- `npm run test` — テスト一括実行（vitest）
- `npm run test:watch` — テスト監視実行

## アーキテクチャ
- `src/engine/` — DSL パーサー・ランタイム（React 非依存の純粋ロジック）
  - `commands/` — 各 DSL コマンド定義（`CommandDef`）。`commands/index.ts` の `COMMAND_REGISTRY` に登録順で並ぶ（`say` は必ず最後＝フォールバック）
  - `parser.ts` — `parseScene()` がスクリプト → `Command[]`
  - `runtime.ts` — `Runtime` クラス。`next()`/`select()`/`reset()`/`seekToLine()`、`RuntimeState`
  - `validate.ts` — プロジェクト全体の検証
  - `preloader.ts` — `collectAssetIds()` でアセット収集
- `src/components/` — 再生 UI（StageView, CharacterLayer, TextBox など）。`editor/` にエディタ UI
  - `editor/vnLanguage.ts` — CodeMirror のシンタックスハイライト + オートコンプリート
- `src/storage/` — IndexedDB 永続化、`src/share/` — エクスポート/インポート

## テスト方針（重要）
**機能を追加・変更したとき、および DSL 記法を追加・変更したときは、必ず対応するテストケースを追加すること。** テストなしで機能追加を完了とみなさない。

- テストは振る舞いベース。パーサーは `parseScene()` 経由、ランタイムは `new Runtime(...)` → `next()/select()` で状態を検証する（個別 `CommandDef` を直接叩かない）
- 新 DSL 記法 → `src/engine/parser.test.ts` にパース結果のテストを追加
- ランタイム挙動（新 `RuntimeState` フィールド、状態遷移）→ `src/engine/runtime.test.ts`
- 純粋関数（richText・validate・preloader 等）→ 同階層の `*.test.ts`
- 正常系だけでなくエラー系・省略時のデフォルト・エッジケースもカバーする
- 追加後は `npm run test` が全て green であることを確認する

## DSL 記法の追加手順
1. `src/engine/commands/` に `CommandDef` を作成
2. `commands/index.ts` の `COMMAND_REGISTRY` に登録（`say` より前）
3. 必要なら `engine/types.ts` の `Command` union と `RuntimeState` を拡張
4. `runtime.ts` の `apply()` に処理を追加
5. 描画が必要なら該当コンポーネントを更新
6. `validate.ts` に検証を追加（アセット/シーン参照がある場合）
7. `editor/vnLanguage.ts` にハイライト・オートコンプリートを追加
8. **テストを追加**（上記テスト方針に従う）

## コーディング規約
- 既存ファイルの慣例（型・命名・コメントの粒度）に合わせる
- UI 文言は日本語
- 後方互換のためのシム・未使用コードは残さない
