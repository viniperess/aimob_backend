import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://aimob-frontend.vercel.app'],
  });

  app.setGlobalPrefix('/api/v1/');

  await app.listen(3001);
}
bootstrap();
