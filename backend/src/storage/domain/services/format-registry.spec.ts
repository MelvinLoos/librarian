import { FormatRegistry } from './format-registry';

describe('FormatRegistry', () => {
  it('should list the CLI-backed targets for EPUB', () => {
    const targets = FormatRegistry.getTargets('EPUB');
    expect(targets).toContain('PDF');
    expect(targets).toContain('MOBI');
  });

  it('should support the minimum DoD matrix EPUB<->MOBI and EPUB<->PDF', () => {
    expect(FormatRegistry.supports('EPUB', 'MOBI')).toBe(true);
    expect(FormatRegistry.supports('MOBI', 'EPUB')).toBe(true);
    expect(FormatRegistry.supports('EPUB', 'PDF')).toBe(true);
    expect(FormatRegistry.supports('PDF', 'EPUB')).toBe(true);
  });

  it('should reject unknown formats and identity conversions', () => {
    expect(FormatRegistry.supports('EPUB', 'EPUB')).toBe(false);
    expect(FormatRegistry.supports('TXT', 'PDF')).toBe(false);
    expect(FormatRegistry.supports('EPUB', 'UNKNOWN')).toBe(false);
    expect(FormatRegistry.supports('UNKNOWN', 'EPUB')).toBe(false);
  });

  it('should normalise format casing', () => {
    expect(FormatRegistry.supports('epub', 'mobi')).toBe(true);
    expect(FormatRegistry.supports('Epub', 'PDF')).toBe(true);
  });

  it('should mark the native Node pairs as native', () => {
    expect(FormatRegistry.isNative('EPUB', 'TXT')).toBe(true);
    expect(FormatRegistry.isNative('TXT', 'EPUB')).toBe(true);
    expect(FormatRegistry.isNative('EPUB', 'MOBI')).toBe(false);
    expect(FormatRegistry.isNative('EPUB', 'PDF')).toBe(false);
  });

  it('should expose TXT as a target only for EPUB', () => {
    expect(FormatRegistry.getTargets('EPUB')).toContain('TXT');
    expect(FormatRegistry.getTargets('MOBI')).not.toContain('TXT');
  });
});
