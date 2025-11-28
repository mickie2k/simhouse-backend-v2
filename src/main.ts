import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GenericExceptionFilter } from './common/filters/generic-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Register global exception filter to mask internal errors while logging them
  app.useGlobalFilters(new GenericExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
