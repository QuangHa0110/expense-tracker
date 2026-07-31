import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tất cả API nằm dưới prefix /api
  app.setGlobalPrefix('api');

  // CORS: cho phép frontend (localhost:5173 khi dev, domain Vercel khi deploy)
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  });

  // ValidationPipe GLOBAL: validate mọi DTO trong toàn app
  // - whitelist: loại bỏ các field không khai báo trong DTO
  // - forbidNonWhitelisted: trả 400 nếu client gửi field lạ
  // - transform: tự chuyển kiểu (string -> number, ...)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter: mọi lỗi đổ về 1 chỗ, trả JSON thống nhất
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running at http://localhost:${port}/api`);
}
bootstrap();
