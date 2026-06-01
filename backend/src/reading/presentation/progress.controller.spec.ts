/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { UpdateReadingProgressUseCase } from '../application/use-cases/update-reading-progress.use-case';
import { GetReadingStatesUseCase } from '../application/use-cases/get-reading-states.use-case';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('ProgressController & UpdateProgressDto Presentation Contract', () => {
  describe('UpdateProgressDto Validation', () => {
    async function validateDto(dtoData: any) {
      const dto = plainToInstance(UpdateProgressDto, dtoData);
      return validate(dto);
    }

    describe('percentage boundaries (0.0 to 100.0)', () => {
      it('should validate successfully with valid boundaries (0.0, 50.0, 100.0)', async () => {
        const dto1 = { locator: 'epubcfi(1)', percentage: 0.0 };
        const dto2 = { locator: 'epubcfi(2)', percentage: 50.5 };
        const dto3 = { locator: 'epubcfi(3)', percentage: 100.0 };

        expect(await validateDto(dto1)).toHaveLength(0);
        expect(await validateDto(dto2)).toHaveLength(0);
        expect(await validateDto(dto3)).toHaveLength(0);
      });

      it('should reject a percentage strictly below 0.0', async () => {
        const dto = { locator: 'epubcfi(1)', percentage: -0.1 };
        const errors = await validateDto(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('percentage');
      });

      it('should reject a percentage strictly above 100.0', async () => {
        const dto = { locator: 'epubcfi(1)', percentage: 100.1 };
        const errors = await validateDto(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('percentage');
      });

      it('should reject non-numeric percentage values', async () => {
        const dto = { locator: 'epubcfi(1)', percentage: 'not-a-number' };
        const errors = await validateDto(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((err) => err.property === 'percentage')).toBe(true);
      });
    });

    describe('locator (opaque string)', () => {
      it('should accept arbitrary opaque strings as locator', async () => {
        const validLocators = [
          'epubcfi(/6/4!/4/2/1:0)',
          'page-42',
          '{}',
          'arbitrary-opaque-string-with-symbols-!@#$',
          '   ',
          'A'.repeat(5000),
        ];

        for (const loc of validLocators) {
          const dto = { locator: loc, percentage: 50.0 };
          const errors = await validateDto(dto);
          expect(errors).toHaveLength(0);
        }
      });

      it('should reject missing or empty locator', async () => {
        const dto1 = { percentage: 50.0 };
        const dto2 = { locator: '', percentage: 50.0 };

        const errors1 = await validateDto(dto1);
        expect(errors1).toHaveLength(1);
        expect(errors1[0].property).toBe('locator');

        const errors2 = await validateDto(dto2);
        expect(errors2).toHaveLength(1);
        expect(errors2[0].property).toBe('locator');
      });

      it('should reject non-string locators', async () => {
        const dto = { locator: 12345, percentage: 50.0 };
        const errors = await validateDto(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('locator');
      });
    });
  });

  describe('ProgressController Integration', () => {
    let controller: ProgressController;
    let updateReadingProgressUseCase: jest.Mocked<UpdateReadingProgressUseCase>;
    let getReadingStatesUseCase: jest.Mocked<GetReadingStatesUseCase>;

    beforeEach(async () => {
      updateReadingProgressUseCase = {
        execute: jest.fn(),
      } as any;
      getReadingStatesUseCase = {
        execute: jest.fn(),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [ProgressController],
        providers: [
          {
            provide: UpdateReadingProgressUseCase,
            useValue: updateReadingProgressUseCase,
          },
          {
            provide: GetReadingStatesUseCase,
            useValue: getReadingStatesUseCase,
          },
        ],
      }).compile();

      controller = module.get<ProgressController>(ProgressController);
    });

    it('should update progress successfully and delegate to updateReadingProgressUseCase', async () => {
      const bookId = 123;
      const dto: UpdateProgressDto = {
        locator: 'epubcfi(mock)',
        percentage: 76.5,
      };
      const req = { user: { id: 'user-id-999' } };

      updateReadingProgressUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.updateProgress(req, bookId, dto);

      expect(updateReadingProgressUseCase.execute).toHaveBeenCalledWith(
        'user-id-999',
        bookId,
        dto.locator,
        dto.percentage,
      );
      expect(result).toEqual({ message: 'Progress updated' });
    });

    it('should retrieve reading states successfully and delegate to getReadingStatesUseCase', async () => {
      const req = { user: { id: 'user-id-999' } };
      const mockStates = [
        { bookId: 123, locator: 'epubcfi(1)', percentage: 22.0 },
      ];

      getReadingStatesUseCase.execute.mockResolvedValue(mockStates);

      const result = await controller.getStates(req);

      expect(getReadingStatesUseCase.execute).toHaveBeenCalledWith(
        'user-id-999',
      );
      expect(result).toEqual(mockStates);
    });

    it('should propagate errors from use cases', async () => {
      const bookId = 123;
      const dto: UpdateProgressDto = {
        locator: 'epubcfi(mock)',
        percentage: 76.5,
      };
      const req = { user: { id: 'user-id-999' } };

      const useCaseError = new Error('Database down');
      updateReadingProgressUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.updateProgress(req, bookId, dto)).rejects.toThrow(
        'Database down',
      );
    });
  });
});
