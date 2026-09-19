/**
 * FormatRegistry
 *
 * Pure domain service mapping supported source → target conversions for the
 * storage context. Zero external dependencies.
 */
export class FormatRegistry {
  static getTargets(source: string): string[] {
    throw new Error('Not implemented');
  }

  static supports(source: string, target: string): boolean {
    throw new Error('Not implemented');
  }

  /** True when the pair can be converted with the built-in Node engine. */
  static isNative(source: string, target: string): boolean {
    throw new Error('Not implemented');
  }
}