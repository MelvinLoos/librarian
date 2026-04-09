import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedModule { }
