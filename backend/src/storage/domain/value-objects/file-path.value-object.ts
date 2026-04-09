export class FilePath {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('FilePath cannot be empty');
    }
    
    const trimmed = value.trim();

    // Directory traversal check
    if (trimmed.includes('..')) {
      throw new Error('FilePath cannot contain directory traversal characters (..)');
    }

    // Absolute path check (disallow absolute paths for internal storage domain to keep them relative)
    if (trimmed.startsWith('/')) {
      throw new Error('FilePath must be a relative path');
    }

    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: FilePath): boolean {
    return this._value === other.value;
  }
}
