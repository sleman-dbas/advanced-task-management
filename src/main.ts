import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import  cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // الأمان
  app.use(helmet());

  app.use(cookieParser());

  // التحقق من صحة البيانات
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // تفعيل CORS للتطوير
  app.enableCors();
  

   
  // إعداد Swagger
  const config = new DocumentBuilder()
    .setTitle('Advanced Task Management API')
    .setDescription('API documentation for the Advanced Task Management System')
    .setVersion('1.0')
    .addBearerAuth() // لإضافة JWT authentication
    .addCookieAuth('refresh_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  


  // تعيين بادئة عالمية للـ API
  app.setGlobalPrefix('api/v1');
  
  const port = configService.get('port');
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();