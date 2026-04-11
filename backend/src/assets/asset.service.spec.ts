import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './asset.service';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('AssetService', () => {
  let service: AssetService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotFoundException if DB returns null', async () => {
    jest.spyOn(prisma.book, 'findUnique').mockResolvedValue(null);

    await expect(service.getCoverStream(1)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if the file does not exist on disk', async () => {
    jest.spyOn(prisma.book, 'findUnique').mockResolvedValue({ id: 1, path: 'Test/Path' } as any);
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(service.getCoverStream(1)).rejects.toThrow(NotFoundException);
  });

  it('should successfully return a read stream if both exist', async () => {
    jest.spyOn(prisma.book, 'findUnique').mockResolvedValue({ id: 1, path: 'Test/Path' } as any);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const mockStream = {} as fs.ReadStream;
    (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

    const result = await service.getCoverStream(1);
    expect(result).toBe(mockStream);
  });
});