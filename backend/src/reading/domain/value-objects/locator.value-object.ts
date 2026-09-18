/**
 * Ubiquitous Language: Locator
 *
 * A format-agnostic representation of a User's reading position within a Book.
 * Examples: an EPUB CFI string ("epubcfi(/6/4!/4/2/1:0)") or a PDF page
 * identifier ("page=42"). It is an immutable Value Object: two Locators are
 * equal when their string values are equal.
 */
export class Locator {
  public static readonly MAX_LENGTH = 1024;

  private constructor(public readonly value: string) {}

  public static create(locator: string): Locator {
    const trimmed = locator.trim();
    if (trimmed.length === 0) {
      throw new Error('Locator must not be empty');
    }
    if (trimmed.length > Locator.MAX_LENGTH) {
      throw new Error(
        `Locator exceeds maximum length of ${Locator.MAX_LENGTH} characters`,
      );
    }
    return new Locator(trimmed);
  }

  public equals(other: Locator): boolean {
    return this.value === other.value;
  }
}
