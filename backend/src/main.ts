import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation using the class-validator DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  // Enable CORS for the upcoming Nuxt 3 frontend
  app.enableCors();

  // Setup OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Librarian API')
    .setDescription(
      'The Next-Gen Calibre REST API for managing eBook collections. ' +
      'Authenticate with POST /auth/login to receive a JWT access token, then send it as Bearer token in the Authorization header for protected endpoints.',
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
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT ?? 3001;
  await app.listen(PORT);
  console.log(`Librarian API is running on: http://localhost:` + PORT);
  console.log(`OpenAPI Docs available at: http://localhost:` + PORT + `/api/docs`);
}
bootstrap();