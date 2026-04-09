import { User } from '../../domain/user.aggregate';
import { EmailAddress } from '../../domain/value-objects/email-address.value-object';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export const IUserRepository = Symbol('IUserRepository');
