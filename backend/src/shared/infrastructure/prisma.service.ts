import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly data: {
    create: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
  } = {
    async create(): Promise<unknown> {
      throw new Error('PrismaService.data.create() is not implemented in this environment');
    },
    async findFirst(): Promise<unknown> {
      throw new Error('PrismaService.data.findFirst() is not implemented in this environment');
    },
  };

  async onModuleInit(): Promise<void> {
    // No-op in this build-safe stub.
  }

  async onModuleDestroy(): Promise<void> {
    // No-op in this build-safe stub.
  }
}
