import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Rfc7807ExceptionFilter } from './shared/filters/rfc7807-exception.filter';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Applies the cross-cutting HTTP configuration that must be identical in the
 * production bootstrap (main.ts) and the e2e test harness.
 *
 * Before this extraction, all of this lived only in main.ts, so the ts-jest
 * harness booted the AppModule without the global 'api' prefix, the
 * ValidationPipe, the RFC 7807 exception filter, cookie parsing, CORS, and —
 * critically — the SPA fallback middleware. As a result, non-API GET requests
 * such as `/` returned 404 in tests while working in production.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  // Enable global validation using the class-validator DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Register RFC 7807 Exception Filter globally
  app.useGlobalFilters(new Rfc7807ExceptionFilter());

  // Use cookie parser for HttpOnly Refresh Tokens
  app.use(cookieParser());

  // Enable CORS for the Nuxt 3 frontend with credentials support
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // SPA fallback: serve index.html for any non-API, non-asset GET request.
  // This allows client-side routing (e.g., /book/123) to work on page refresh.
  // The HTML is read once at startup to avoid path resolution issues at runtime.
  const indexPath = join(
    __dirname,
    '../..',
    'frontend',
    '.output',
    'public',
    'index.html',
  );
  const indexHtml = readFileSync(indexPath, 'utf-8');
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    // Skip API routes and static asset requests (files with extensions)
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next();
    }
    res.type('html').send(indexHtml);
  });
}