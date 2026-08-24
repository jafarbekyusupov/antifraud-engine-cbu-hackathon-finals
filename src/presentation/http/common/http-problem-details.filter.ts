import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ExceptionResponse {
  type?: unknown;
  title?: unknown;
  message?: unknown;
  errors?: unknown;
}

@Catch()
export class HttpProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = this.exceptionResponse(exception);
    const detail = this.detail(response.message, exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${request.method} ${request.url}: ${detail}`, stack);
    }

    reply.status(status).send({
      type:
        typeof response.type === 'string'
          ? response.type
          : `https://cbu.uz/problems/http-${status}`,
      title:
        typeof response.title === 'string'
          ? response.title
          : (STATUS_CODES[status] ?? 'Request failed'),
      status,
      detail,
      instance: request.url,
      ...(Array.isArray(response.errors) ? { errors: response.errors } : {}),
    });
  }

  private exceptionResponse(exception: unknown): ExceptionResponse {
    if (!(exception instanceof HttpException)) return {};
    const response = exception.getResponse();
    return typeof response === 'object' && response !== null
      ? (response as ExceptionResponse)
      : { message: response };
  }

  private detail(message: unknown, exception: unknown, status: number): string {
    if (Array.isArray(message)) return message.map(String).join('; ');
    if (typeof message === 'string') return message;
    if (exception instanceof HttpException) return exception.message;
    return status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? 'An unexpected server error occurred'
      : 'The request could not be completed';
  }
}
