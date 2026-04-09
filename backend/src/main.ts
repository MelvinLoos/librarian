import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation using the class-validator DTOs the agents built
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  // Enable CORS for the upcoming Nuxt 3 frontend
  app.enableCors();

  // Setup OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Librarian API')
    .setDescription('The Next-Gen Calibre REST API')
    .setVersion('1.0')
    .addBearerAuth() // Sets up the JWT input box in the UI
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Librarian API is running on: http://localhost:3000`);
  console.log(`OpenAPI Docs available at: http://localhost:3000/api/docs`);
}
bootstrap();