import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env["PORT"] ?? 4000);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env["CORS_ORIGIN"] ?? "http://localhost:3000",
    credentials: true
  });

  await app.listen(port);
  console.log(`InsureConnect API running on port ${port}`);
}

void bootstrap();