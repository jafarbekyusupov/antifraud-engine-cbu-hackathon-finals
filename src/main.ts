import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { HttpProblemDetailsFilter } from './presentation/http/common/http-problem-details.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpProblemDetailsFilter());

  const appConfig = app.get(AppConfig);
  app.enableCors({
    origin: [...appConfig.corsOrigins],
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'Idempotency-Key',
      'x-authenticated-client-id',
    ],
  });

  const openApiConfig = new DocumentBuilder()
    .setTitle('CBU Anti-Fraud API')
    .setDescription(
      'backend for transaction scoring, dataset replay, alert investigation, and case management system',
    )
    .setVersion('1.0')
    .addTag('Health', 'Application and PostgreSQL readiness')
    .addTag('Transaction scoring', 'Internal payment-processing integration')
    .addTag('Dataset replay', 'Administrative dataset import and chronological replay')
    .addTag('Alerts', 'Fraud analyst alert queue and detail')
    .addTag('Cases', 'Fraud investigation lifecycle and timeline')
    .addTag('Cards', 'Operator card list and filtering')
    .addTag('Customer cards', 'Authenticated customer card list')
    .addTag('Transactions', 'Operator transaction list and detail')
    .addTag('Customer transactions', 'Authenticated customer transaction list and detail')
    .addTag('Customer security', 'Mobile suspicious-transaction verification')
    .build();
  const openApiDocument = (): OpenAPIObject =>
    SwaggerModule.createDocument(app, openApiConfig, {
      operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
    });
  SwaggerModule.setup('docs', app, openApiDocument, {
    jsonDocumentUrl: 'docs/openapi.json',
    yamlDocumentUrl: 'docs/openapi.yaml',
  });

  const port = appConfig.port;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
