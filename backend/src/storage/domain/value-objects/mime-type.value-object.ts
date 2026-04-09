export class MimeType {
  private readonly _value: string;

  // Basic regex to check for type/subtype where both are 1+ word characters/dashes/dots/pluses
  private static readonly MIME_TYPE_REGEX = /^[-\w.]+\/[-\w.+]+$/;

  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('MimeType cannot be empty');
    }
    const trimmed = value.trim().toLowerCase();
    if (!MimeType.MIME_TYPE_REGEX.test(trimmed)) {
      throw new Error('Invalid MimeType format');
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: MimeType): boolean {
    return this._value === other.value;
  }
}
