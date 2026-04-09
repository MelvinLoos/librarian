export enum RoleEnum {
  ADMIN = 'ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
  READER = 'READER',
  CUSTOMER = 'CUSTOMER'
}

export class Role {
  private constructor(public readonly value: RoleEnum) {}

  public static admin(): Role {
    return new Role(RoleEnum.ADMIN);
  }

  public static contributor(): Role {
    return new Role(RoleEnum.CONTRIBUTOR);
  }

  public static reader(): Role {
    return new Role(RoleEnum.READER);
  }

  public static customer(): Role {
    return new Role(RoleEnum.CUSTOMER);
  }

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

