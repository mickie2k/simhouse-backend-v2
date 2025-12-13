import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GenericExceptionFilter } from './common/filters/generic-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Register global exception filter to mask internal errors while logging them
  app.useGlobalFilters(new GenericExceptionFilter());
  
  // Enable validation pipe globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('SimHouse API')
    .setDescription('SimHouse Simulator Booking Platform API Documentation')
    .setVersion('2.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('user', 'User management endpoints')
    .addTag('booking', 'Booking management endpoints')
    .addTag('host', 'Host management endpoints')
    .addTag('simulator', 'Simulator management endpoints')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'JWT access token stored in cookie',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'JWT refresh token stored in cookie',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`);
}

bootstrap();
