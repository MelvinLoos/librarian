import { Role, RoleEnum } from './role.value-object';

describe('Role Value Object', () => {
  it('should create a valid Role', () => {
    const role = Role.create('Admin');
    expect(role.value).toBe(RoleEnum.ADMIN);
  });

  it('should fail to create with an invalid role string', () => {
    expect(() => Role.create('Unknown')).toThrow('Invalid role: Unknown');
  });

  it('should evaluate equality correctly', () => {
    const role1 = Role.create('Reader');
    const role2 = Role.create('Reader');
    const role3 = Role.create('Contributor');
    
    expect(role1.equals(role2)).toBe(true);
    expect(role1.equals(role3)).toBe(false);
  });
});
