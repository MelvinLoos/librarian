export class HashedPassword {
  private constructor(private readonly hash: string) {}

  public static create(hash: string): HashedPassword {
    if (!hash || hash.trim().length === 0) {
      throw new Error('Hashed password cannot be empty');
    }
    // ensure plain text is not visible directly as a property
    return new HashedPassword(hash);
  }

  public getHash(): string {
    return this.hash;
  }

  public equals(other: HashedPassword): boolean {
    return this.hash === other.hash;
  }
}
