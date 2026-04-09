export class EmailAddress {
  private constructor(public readonly value: string) {}

  public static create(email: string): EmailAddress {
    const trimmed = email.trim();
    if (!EmailAddress.isValid(trimmed)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    return new EmailAddress(trimmed);
  }

  private static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  public equals(other: EmailAddress): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
