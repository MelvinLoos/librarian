import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { CustomColumn } from '../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../application/ports/custom-column.repository.interface';

@Injectable()
export class PrismaCustomColumnRepository implements CustomColumnRepositoryInterface {
  private readonly logger = new Logger(PrismaCustomColumnRepository.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<CustomColumn[]> {
    const rows = await this.prisma.librarianCustomColumn.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async upsert(column: CustomColumn): Promise<CustomColumn> {
    const now = new Date();
    const existing = await this.prisma.librarianCustomColumn.findUnique({
      where: { name: column.props.name },
    });

    if (existing) {
      await this.prisma.librarianCustomColumn.update({
        where: { id: existing.id },
        data: {
          dataType: column.props.dataType ?? 'text',
          displayLabel: column.props.displayLabel,
          isMultiple: column.props.isMultiple ?? false,
          updatedAt: now,
        },
      });
      return this.toDomain({
        ...existing,
        dataType: column.props.dataType ?? 'text',
        displayLabel: column.props.displayLabel,
        isMultiple: column.props.isMultiple ?? false,
        updatedAt: now,
      });
    }

    const id = column.id ?? randomUUID();
    await this.prisma.librarianCustomColumn.create({
      data: {
        id,
        name: column.props.name,
        dataType: column.props.dataType ?? 'text',
        displayLabel: column.props.displayLabel,
        isMultiple: column.props.isMultiple ?? false,
      },
    });
    return this.toDomain({
      id,
      name: column.props.name,
      dataType: column.props.dataType ?? 'text',
      displayLabel: column.props.displayLabel,
      isMultiple: column.props.isMultiple ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.librarianCustomColumn.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  private toDomain(row: {
    id: string;
    name: string;
    dataType: string;
    displayLabel?: string | null;
    isMultiple: boolean;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }): CustomColumn {
    return new CustomColumn(
      {
        name: row.name,
        value: '',
        dataType: row.dataType as CustomColumn['props']['dataType'],
        displayLabel: row.displayLabel ?? undefined,
        isMultiple: row.isMultiple,
      },
      row.id,
    );
  }
}
