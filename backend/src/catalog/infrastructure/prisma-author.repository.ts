import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { IAuthorRepository } from '../application/ports/author.repository.interface';

@Injectable()
export class PrismaAuthorRepository implements IAuthorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const authors = await this.prisma.author.findMany({
      orderBy: { name: 'asc' },
    });
    return authors as any; // Map to Domain Entity if strictly using Mappers
  }
}