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
    origin: true,
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
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://0.0.0.0:${port}`);
}
bootstrap();
