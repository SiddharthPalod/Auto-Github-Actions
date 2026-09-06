import { promises as fs } from "node:fs";
import path from "node:path";
import type { RepositoryContext } from "./detector.js";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "vendor",
  ".turbo",
  ".next",
  ".nuxt",
  ".output",
  ".venv",
  "venv",
  "env",
  "__pycache__",
  ".pytest_cache",
  ".gradle",
  ".cargo",
  "coverage",
  ".cache"
]);

async function walk(
  directory: string,
  root: string,
  files: Set<string>
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    // Safely skip unreadable directories or broken symlinks
    return;
  }

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      await walk(absolute, root, files);
    } else {
      files.add(relative);
    }
  }
}

export async function createRepositoryContext(root: string): Promise<RepositoryContext> {
  const absoluteRoot = path.resolve(root);
  const files = new Set<string>();
  const fileContentCache = new Map<string, string | null>();

  await walk(absoluteRoot, absoluteRoot, files);

  async function readFile(relativePath: string): Promise<string | null> {
    const normalized = relativePath.replace(/\\/g, "/");
    if (fileContentCache.has(normalized)) {
      return fileContentCache.get(normalized)!;
    }

    try {
      const content = await fs.readFile(path.join(absoluteRoot, normalized), "utf8");
      fileContentCache.set(normalized, content);
      return content;
    } catch {
      fileContentCache.set(normalized, null);
      return null;
    }
  }

  async function readJson<T = unknown>(relativePath: string): Promise<T | null> {
    const raw = await readFile(relativePath);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  return {
    root: absoluteRoot,
    files,

    hasFile(relativePath: string): boolean {
      return files.has(relativePath.replace(/\\/g, "/"));
    },

    findFiles(predicate: (file: string) => boolean): string[] {
      const results: string[] = [];
      for (const file of files) {
        if (predicate(file)) {
          results.push(file);
        }
      }
      return results;
    },

    readFile,
    readJson
  };
}