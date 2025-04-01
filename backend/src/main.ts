import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BigIntInterceptor } from './interceptors/bigint.interceptor'; // путь подкорректируй под проект
import 'dotenv/config';
import {startDiscordBot} from "./discordBot";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Валидация DTO
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Конвертация BigInt → string
    app.useGlobalInterceptors(new BigIntInterceptor());

    // CORS
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('EVE Board API')
        .setDescription('API для заказов и исполнителей в EVE Online')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    // Запуск
    await app.listen(3000);
    console.log('🚀 Server running at http://localhost:3000');
    console.log('📚 Swagger UI at http://localhost:3000/docs');

    await startDiscordBot();
}

bootstrap();
