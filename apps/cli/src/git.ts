import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { randomUUID } from "node:crypto";

export function isRemoteUrl(target: string): boolean {
  if (!target || typeof target !== "string") return false;
  const trimmed = target.trim();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("git@") ||
    trimmed.startsWith("ssh://") ||
    trimmed.endsWith(".git")
  );
}

export async function withRepository<T>(
  target: string,
  action: (path: string) => Promise<T>,
  onProgress?: (message: string) => void
): Promise<T> {
  if (!isRemoteUrl(target)) {
    return action(target);
  }

  const tempPath = join(tmpdir(), `auto-gha-scan-${randomUUID()}`);
  onProgress?.(`Fetching & shallow-cloning remote repository: ${target}...`);

  try {
    const cloneResult = spawnSync("git", ["clone", "--depth", "1", target, tempPath], {
      stdio: "pipe",
      encoding: "utf8"
    });

    if (cloneResult.status !== 0) {
      const errMessage = cloneResult.stderr?.trim() || `git clone exited with code ${cloneResult.status}`;
      throw new Error(`Failed to clone remote repository "${target}": ${errMessage}`);
    }

    return await action(tempPath);
  } finally {
    try {
      rmSync(tempPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch {
      // Ignore cleanup errors on temporary directories
    }
  }
}
