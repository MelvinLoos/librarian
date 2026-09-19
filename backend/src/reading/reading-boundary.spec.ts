import * as fs from 'fs';
import * as path from 'path';

describe('Reading Module Boundary Manifest (.ruler)', () => {
  const rulerPath = path.join(__dirname, '.ruler');

  it('should ship a .ruler boundary manifest for the reading context', () => {
    expect(fs.existsSync(rulerPath)).toBe(true);
  });

  it('should restrict agents to the /src/reading directory', () => {
    const content = fs.readFileSync(rulerPath, 'utf8');
    expect(content).toContain('/src/reading');
  });

  it('should explicitly ban imports from the iam bounded context', () => {
    const content = fs.readFileSync(rulerPath, 'utf8');
    expect(content).toMatch(/iam/i);
  });

  it('should explicitly ban imports from the catalog bounded context', () => {
    const content = fs.readFileSync(rulerPath, 'utf8');
    expect(content).toMatch(/catalog/i);
  });

  it('should explicitly ban imports from the storage bounded context', () => {
    const content = fs.readFileSync(rulerPath, 'utf8');
    expect(content).toMatch(/storage/i);
  });

  it('should allow global primitives from the /src/shared module', () => {
    const content = fs.readFileSync(rulerPath, 'utf8');
    expect(content).toContain('/src/shared');
  });
});
