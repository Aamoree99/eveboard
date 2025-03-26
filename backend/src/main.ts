import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Swagger конфиг
    const config = new DocumentBuilder()
        .setTitle('EVE Board API')
        .setDescription('API для заказов и исполнителей в EVE Online')
        .setVersion('1.0')
        .addBearerAuth() // если будет JWT
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document); // http://localhost:3000/docs

    await app.listen(3000);
    console.log(`🚀 Server running at http://localhost:3000`);
    console.log(`📚 Swagger UI at http://localhost:3000/docs`);
}
bootstrap();
