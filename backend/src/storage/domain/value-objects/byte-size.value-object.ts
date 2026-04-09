export class ByteSize {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error('ByteSize cannot be negative');
    }
    if (!Number.isInteger(value)) {
      throw new Error('ByteSize must be an integer');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: ByteSize): boolean {
    return this._value === other.value;
  }
}
