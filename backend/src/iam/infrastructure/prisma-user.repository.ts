import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { IUserRepository } from '../application/ports/user.repository.interface';
import { User } from '../domain/user.aggregate';
import { EmailAddress } from '../domain/value-objects/email-address.value-object';
import { HashedPassword } from '../domain/value-objects/hashed-password.value-object';
import { Role } from '../domain/value-objects/role.value-object';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email.value,
        passwordHash: user.password.getHash(),
        role: user.role.value,
      },
      create: {
        id: user.id,
        email: user.email.value,
        passwordHash: user.password.getHash(),
        role: user.role.value,
      },
    });
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
  }): User {
    return User.reconstruct(
      record.id,
      EmailAddress.create(record.email),
      HashedPassword.create(record.passwordHash),
      Role.create(record.role),
    );
  }
}
