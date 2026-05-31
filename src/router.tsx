import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  Outlet,
} from "@tanstack/react-router";
import { HomePage } from "./routes/HomePage";
import { EditorPage } from "./routes/EditorPage";
import { PlayerPage } from "./routes/PlayerPage";

// Code-based route tree. Adding a route is a matter of defining a new
// createRoute(...) and listing it in rootRoute.addChildren below; route paths
// and params are then type-checked across Link / navigate / useParams.

const rootRoute = createRootRoute({ component: Outlet });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/$projectId",
  component: EditorPage,
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play/$projectId",
  component: PlayerPage,
});

const routeTree = rootRoute.addChildren([homeRoute, editorRoute, playRoute]);

// HashHistory keeps the app working on static hosts and when opened without
// server-side routing (matching the previous HashRouter behaviour).
export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

// Route handles, used by components for type-safe params (route.useParams()).
export const editorRouteApi = editorRoute;
export const playRouteApi = playRoute;

// Register the router instance for global type inference.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
