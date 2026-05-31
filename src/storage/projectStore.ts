import { getDB } from "./db";
import type { Project } from "../engine/types";

export async function listProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll("projects");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get("projects", id);
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", { ...project, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("projects", id);
}
