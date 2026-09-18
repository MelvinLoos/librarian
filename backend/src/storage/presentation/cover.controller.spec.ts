import { Test, TestingModule } from '@nestjs/testing';
import { CoverController } from './cover.controller';
import { GetCoverStreamUseCase } from '../application/use-cases/get-cover-stream.use-case';
import { NotFoundException, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import type { ReadStream } from 'fs';

describe('CoverController', () => {
  let controller: CoverController;
  let execute: jest.Mock;

  beforeEach(async () => {
    execute = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoverController],
      providers: [
        {
          provide: GetCoverStreamUseCase,
          useValue: { execute },
        },
      ],
    }).compile();

    controller = module.get<CoverController>(CoverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a StreamableFile and set the JPEG content type', async () => {
    const mockStream: ReadStream = { pipe: jest.fn() } as unknown as ReadStream;
    execute.mockResolvedValue(mockStream);
    const setMock = jest.fn();
    const mockRes: Response = { set: setMock } as unknown as Response;

    const result = await controller.getCover(1, mockRes);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(execute).toHaveBeenCalledWith(1);
    expect(setMock).toHaveBeenCalledWith({ 'Content-Type': 'image/jpeg' });
  });

  it('should propagate NotFoundException from the use case', async () => {
    execute.mockRejectedValue(
      new NotFoundException('Book with ID 99 not found in the database.'),
    );
    const setMock = jest.fn();
    const mockRes: Response = { set: setMock } as unknown as Response;

    await expect(controller.getCover(99, mockRes)).rejects.toThrow(
      NotFoundException,
    );
    expect(setMock).not.toHaveBeenCalled();
  });
});
