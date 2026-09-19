import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getFrontendIndexPath,
  getFrontendPublicDir,
  locateMonorepoRoot,
} from './app.paths';

describe('app.paths (frontend static root resolution)', () => {
  describe('layout independence (ts-jest src/ vs compiled dist/)', () => {
    let tempRoot: string;

    beforeEach(() => {
      tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'librarian-paths-'));
      // Mirror the real monorepo layout: backend/{src,dist}/…, frontend/.output/public
      fs.mkdirSync(path.join(tempRoot, 'backend', 'src'), { recursive: true });
      fs.mkdirSync(path.join(tempRoot, 'backend', 'dist'), { recursive: true });
      fs.mkdirSync(path.join(tempRoot, 'frontend', '.output', 'public'), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(tempRoot, 'frontend', '.output', 'public', 'index.html'),
        '<!DOCTYPE html>',
      );
    });

    afterEach(() => {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    });

    it('resolves the same monorepo root from src/ (ts-jest) and dist/ (compiled) depths', () => {
      const fromSrc = locateMonorepoRoot(path.join(tempRoot, 'backend', 'src'));
      const fromDist = locateMonorepoRoot(
        path.join(tempRoot, 'backend', 'dist'),
      );

      expect(fromSrc).toBe(tempRoot);
      expect(fromDist).toBe(tempRoot);
    });

    it('walks up arbitrarily deep nested build output to the monorepo root', () => {
      const deepNested = path.join(
        tempRoot,
        'backend',
        'dist',
        'modules',
        'deeply',
        'nested',
      );
      fs.mkdirSync(deepNested, { recursive: true });

      expect(locateMonorepoRoot(deepNested)).toBe(tempRoot);
    });
  });

  describe('frontend output resolution', () => {
    it('resolves the actual monorepo root from this repository', () => {
      const root = locateMonorepoRoot(__dirname);

      expect(fs.existsSync(path.join(root, 'backend'))).toBe(true);
      expect(fs.existsSync(path.join(root, 'frontend'))).toBe(true);
    });

    it('points at <repo>/frontend/.output/public for the ServeStatic root', () => {
      const root = locateMonorepoRoot(__dirname);

      expect(getFrontendPublicDir()).toBe(
        path.join(root, 'frontend', '.output', 'public'),
      );
    });

    it('points at <repo>/frontend/.output/public/index.html for the SPA fallback', () => {
      expect(getFrontendIndexPath()).toBe(
        path.join(getFrontendPublicDir(), 'index.html'),
      );
    });
  });

  describe('failure mode', () => {
    it('throws a descriptive error when the monorepo root cannot be found', () => {
      const orphan = fs.mkdtempSync(
        path.join(os.tmpdir(), 'librarian-orphan-'),
      );

      try {
        expect(() => locateMonorepoRoot(orphan)).toThrow(
          /Could not locate the librarian monorepo root/i,
        );
      } finally {
        fs.rmSync(orphan, { recursive: true, force: true });
      }
    });
  });
});
