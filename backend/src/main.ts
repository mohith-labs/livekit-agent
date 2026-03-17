import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api', {
    exclude: [{ path: ':agentName/token', method: RequestMethod.GET }],
  });

  // Serve frontend static files in production
  const frontendPath = join(__dirname, '..', 'public');
  if (existsSync(frontendPath)) {
    app.useStaticAssets(frontendPath);

    // SPA fallback: serve index.html for any non-API, non-file route
    const express = app.getHttpAdapter().getInstance();
    express.get(/^\/(?!api\/)(?!.*\/token$).*/, (req: any, res: any, next: any) => {
      const indexPath = join(frontendPath, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  }
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
