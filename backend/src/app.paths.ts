import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Locates the librarian monorepo root by walking up from `startDir` until a
 * directory containing both the `backend/` and `frontend/` projects is found.
 *
 * The resolution is intentionally layout-agnostic: under ts-jest the
 * application executes from `backend/src`, while the compiled production build
 * executes from `backend/dist`. A blind `__dirname`-relative traversal
 * (`../..`) makes the two contexts disagree and silently breaks the e2e
 * harness whenever the source/build layouts diverge in depth. Walking up to
 * the authoritative monorepo root keeps the ts-jest test harness and the
 * compiled `dist` output resolving byte-for-byte identical paths.
 *
 * @param startDir directory from which the upward search begins
 * @returns absolute path of the monorepo root
 * @throws {Error} when no ancestor directory contains both projects
 */
export function locateMonorepoRoot(startDir: string = __dirname): string {
  let current = resolve(startDir);

  for (;;) {
    if (
      existsSync(join(current, 'backend')) &&
      existsSync(join(current, 'frontend'))
    ) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(
        `Could not locate the librarian monorepo root from "${startDir}": ` +
          'no ancestor directory contains both a "backend" and a "frontend" ' +
          'project',
      );
    }
    current = parent;
  }
}

/** Absolute path to the Nuxt static output directory (frontend/.output/public). */
export function getFrontendPublicDir(): string {
  return join(locateMonorepoRoot(), 'frontend', '.output', 'public');
}

/** Absolute path to the SPA entry file served by the backend (index.html). */
export function getFrontendIndexPath(): string {
  return join(getFrontendPublicDir(), 'index.html');
}
