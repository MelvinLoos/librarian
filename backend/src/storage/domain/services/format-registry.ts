/**
 * FormatRegistry
 *
 * Pure domain service mapping supported source → target conversions for the
 * storage context. Zero external dependencies.
 */
const MATRIX: Record<string, string[]> = {
  EPUB: ['PDF', 'MOBI', 'TXT'],
  MOBI: ['EPUB'],
  PDF: ['EPUB'],
  AZW3: ['EPUB'],
  TXT: ['EPUB'],
};

const normalize = (format: string): string => format.trim().toUpperCase();

export class FormatRegistry {
  static getTargets(source: string): string[] {
    const targets = MATRIX[normalize(source)];
    return targets ? [...targets] : [];
  }

  static supports(source: string, target: string): boolean {
    const from = normalize(source);
    const to = normalize(target);
    if (from === to || from.length === 0 || to.length === 0) {
      return false;
    }
    const targets = MATRIX[from];
    return targets !== undefined && targets.includes(to);
  }

  /** True when the pair can be converted with the built-in Node engine. */
  static isNative(source: string, target: string): boolean {
    const from = normalize(source);
    const to = normalize(target);
    return (
      (from === 'EPUB' && to === 'TXT') || (from === 'TXT' && to === 'EPUB')
    );
  }
}
