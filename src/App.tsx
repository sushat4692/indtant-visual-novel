import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./routes/HomePage";
import { EditorPage } from "./routes/EditorPage";
import { PlayerPage } from "./routes/PlayerPage";

/**
 * Uses HashRouter so the app works when served from a static host or opened
 * without server-side routing.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
        <Route path="/play/:projectId" element={<PlayerPage />} />
      </Routes>
    </HashRouter>
  );
}
