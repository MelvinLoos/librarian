import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { StreamableFile } from '@nestjs/common';
import * as fs from 'fs';

describe('AssetController', () => {
  let controller: AssetController;
  let service: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: AssetService,
          useValue: {
            getCoverStream: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    service = module.get<AssetService>(AssetService);
  });

  it('should successfully stream the file returned by the service', async () => {
    const mockStream = { pipe: jest.fn() } as unknown as fs.ReadStream;
    jest.spyOn(service, 'getCoverStream').mockResolvedValue(mockStream);

    const result = await controller.getCover(1);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(service.getCoverStream).toHaveBeenCalledWith(1);
  });
});