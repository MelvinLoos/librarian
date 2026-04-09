import { Role, RoleEnum } from './role.value-object';

describe('Role Value Object', () => {
  it('should create a valid Role', () => {
    const role = Role.create('ADMIN');
    expect(role.value).toBe(RoleEnum.ADMIN);
  });

  it('should create roles via factory methods', () => {
    expect(Role.admin().value).toBe(RoleEnum.ADMIN);
    expect(Role.contributor().value).toBe(RoleEnum.CONTRIBUTOR);
    expect(Role.reader().value).toBe(RoleEnum.READER);
    expect(Role.customer().value).toBe(RoleEnum.CUSTOMER);
  });

  it('should fail to create with an invalid role string', () => {
    expect(() => Role.create('Unknown')).toThrow('Invalid role: Unknown');
  });

  it('should evaluate equality correctly', () => {
    const role1 = Role.create('READER');
    const role2 = Role.create('READER');
    const role3 = Role.create('CONTRIBUTOR');
    
    expect(role1.equals(role2)).toBe(true);
    expect(role1.equals(role3)).toBe(false);
  });
});
