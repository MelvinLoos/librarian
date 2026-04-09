export enum RoleEnum {
  ADMIN = 'Admin',
  CONTRIBUTOR = 'Contributor',
  READER = 'Reader'
}

export class Role {
  private constructor(public readonly value: RoleEnum) {}

  public static create(roleStr: string): Role {
    const roleValue = Object.values(RoleEnum).find(r => r === roleStr);
    if (!roleValue) {
      throw new Error(`Invalid role: ${roleStr}`);
    }
    return new Role(roleValue);
  }

  public equals(other: Role): boolean {
    return this.value === other.value;
  }
}
