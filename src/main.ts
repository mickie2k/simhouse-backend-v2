import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GenericExceptionFilter } from './common/filters/generic-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { httpLoggingMiddleware } from './common/middleware/http-logging.middleware';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: true,
        credentials: true,
    });

    // Register global exception filter to mask internal errors while logging them
    app.useGlobalFilters(new GenericExceptionFilter());

    app.use(cookieParser());
    app.use(httpLoggingMiddleware);

    // Enable validation pipe globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Swagger/OpenAPI configuration - only enable in non-production environments
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
        const config = new DocumentBuilder()
            .setTitle('SimHouse API')
            .setDescription(
                'SimHouse Simulator Booking Platform API Documentation',
            )
            .setVersion('2.0')
            .addTag('auth', 'Authentication endpoints')
            .addTag('user', 'User management endpoints')
            .addTag('booking', 'Booking management endpoints')
            .addTag('host', 'Host management endpoints')
            .addTag('simulator', 'Simulator management endpoints')
            .addCookieAuth('customer_access_token', {
                type: 'apiKey',
                in: 'cookie',
                name: 'customer_access_token',
                description: 'JWT access token stored in cookie',
            })
            .addCookieAuth('customer_refresh_token', {
                type: 'apiKey',
                in: 'cookie',
                name: 'customer_refresh_token',
                description: 'JWT refresh token stored in cookie',
            })
            .addCookieAuth('host_access_token', {
                type: 'apiKey',
                in: 'cookie',
                name: 'host_access_token',
                description: 'JWT access token stored in cookie',
            })
            .addCookieAuth('host_refresh_token', {
                type: 'apiKey',
                in: 'cookie',
                name: 'host_refresh_token',
                description: 'JWT refresh token stored in cookie',
            })
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                withCredentials: true,
            },
        });
    }

    await app.listen(process.env.PORT ?? 3000);
    const port = process.env.PORT ?? 3000;
    console.log(`Application is running on: http://localhost:${port}`);

    if (!isProduction) {
        console.log(
            `Swagger documentation available at: http://localhost:${port}/api`,
        );
    } else {
        console.log(
            '✓ Running in PRODUCTION mode - Swagger documentation is disabled',
        );
    }
}

void bootstrap();
