import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.tokens';
import { healthSchema } from '../../presentation/http/openapi/schemas';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application and PostgreSQL readiness' })
  @ApiResponse({ status: 200, description: 'Application is ready', schema: healthSchema })
  @ApiResponse({ status: 503, description: 'PostgreSQL is unavailable', schema: healthSchema })
  async check(): Promise<HealthCheckResult> {
    const startedAt = performance.now();
    try {
      await this.pingDatabase(150);
      const postgres = {
        status: 'up' as const,
        latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      };
      return { status: 'ok', info: { postgres }, error: {}, details: { postgres } };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        error: { postgres: { status: 'down' } },
        cause: error instanceof Error ? error.message : 'Database health check failed',
      });
    }
  }

  private async pingDatabase(timeoutMs: number): Promise<void> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.pool.query('select 1').then(() => undefined),
        new Promise<void>((_resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error(`Database health check exceeded ${timeoutMs} ms`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
