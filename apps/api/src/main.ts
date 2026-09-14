import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.enableCors({ origin: config.get("WEB_ORIGIN", "http://localhost:3000"), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const documentConfig = new DocumentBuilder().setTitle("Future Fit API").setDescription("Assessment-first career guidance API").setVersion("1.0").addBearerAuth().build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, documentConfig));
  await app.listen(config.get<number>("API_PORT", 4000));
}
void bootstrap();
