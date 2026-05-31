import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Project } from "../engine/types";

/** A stored uploaded asset (image blob + metadata). */
export interface StoredAsset {
  id: string;
  type: "background" | "character" | "audio";
  name: string;
  blob: Blob;
}

interface VNDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { updatedAt: number };
  };
  assets: {
    key: string;
    value: StoredAsset;
  };
}

const DB_NAME = "instant-visual-novel";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VNDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<VNDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VNDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const projects = db.createObjectStore("projects", { keyPath: "id" });
        projects.createIndex("updatedAt", "updatedAt");
        db.createObjectStore("assets", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}
