import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { Rfc7807ExceptionFilter } from './shared/filters/rfc7807-exception.filter';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino as the global logger
  app.useLogger(app.get(Logger));

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

  // Setup OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Librarian API')
    .setDescription(
      'The Next-Gen Calibre REST API for managing eBook collections. ' +
      'Authenticate with POST /auth/login to receive a JWT access token, then send it as Bearer token in the Authorization header for protected endpoints. ' +
      'The raw OpenAPI JSON document is also available via a dynamic full URL shown on the docs page.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token returned by /auth/login. Use: Authorization: Bearer <token>',
      },
      'JWT',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);

  // Expose the raw OpenAPI JSON document for direct download and programmatic access.
  app.use('/api/docs-json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(document);
  });

  app.use('/api/swagger-custom.js', (req: Request, res: Response) => {
    res.type('application/javascript');
    res.send(`
      document.addEventListener('DOMContentLoaded', function () {
        const interval = setInterval(function () {
          const infoElement = document.querySelector('.swagger-ui .info');
          if (!infoElement) {
            return;
          }
          clearInterval(interval);

          const linkWrapper = document.createElement('div');
          linkWrapper.style.marginTop = '0.5rem';
          linkWrapper.style.fontSize = '0.9rem';
          linkWrapper.style.color = '#555';
          linkWrapper.innerHTML =
            'OpenAPI JSON: <a href="' + window.location.origin + '/api/docs-json" target="_blank" ' +
            'style="font-weight:600;text-decoration:none;color:#1a73e8;">' +
            window.location.origin + '/api/docs-json</a>';

          infoElement.appendChild(linkWrapper);
        }, 100);
      });
    `);
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      url: '/api/docs-json',
    },
    customJs: ['/api/swagger-custom.js'],
  });

  const PORT = process.env.PORT ?? 3001;
  await app.listen(PORT);
  console.log(`Librarian API is running on: http://localhost:` + PORT);
  console.log(`OpenAPI Docs available at: http://localhost:` + PORT + `/api/docs`);
}
bootstrap();