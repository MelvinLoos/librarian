import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('system config', () => {
    it('should return the library path', () => {
      process.env.CALIBRE_LIBRARY_PATH = '/test/path';
      const config = appController.getConfig();
      expect(config).toEqual({ libraryPath: '/test/path' });
    });
  });
});
