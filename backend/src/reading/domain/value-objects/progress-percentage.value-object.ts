/**
 * Ubiquitous Language: ProgressPercentage
 *
 * The fraction of a Book the User has consumed, expressed as a Float between
 * 0.0 and 100.0. It is an immutable Value Object with a strict numeric
 * invariant: NaN and values outside the [0, 100] range are rejected.
 */
export class ProgressPercentage {
  private constructor(public readonly value: number) {}

  public static create(percentage: number): ProgressPercentage {
    if (typeof percentage !== 'number' || Number.isNaN(percentage)) {
      throw new Error('Percentage must be a finite number');
    }
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    return new ProgressPercentage(percentage);
  }

  public equals(other: ProgressPercentage): boolean {
    return this.value === other.value;
  }

  public isComplete(): boolean {
    return this.value >= 100;
  }
}
