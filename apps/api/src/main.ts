import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { HttpErrorFilter } from "./common/http.filter.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  app.use(cookieParser());
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpErrorFilter());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    request.headers["x-request-id"] = requestId;
    response.setHeader("X-Request-Id", requestId);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cache-Control", "no-store");
    const started = Date.now();
    response.on("finish", () =>
      console.log(
        JSON.stringify({
          requestId,
          method: request.method,
          route: request.path,
          statusCode: response.statusCode,
          duration: Date.now() - started,
        }),
      ),
    );
    next();
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.enableCors({
    origin: config
      .get<string>("WEB_ORIGIN", "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const documentConfig = new DocumentBuilder()
    .setTitle("Future Fit API")
    .setDescription("Assessment-first career guidance API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(app, documentConfig),
  );
  await app.listen(config.get<number>("API_PORT", 4000));
}
void bootstrap();
