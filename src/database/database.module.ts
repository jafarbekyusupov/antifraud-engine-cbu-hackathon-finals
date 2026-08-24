import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { AppConfig } from '../config/app.config';
import { AntiFraudDatabase } from './database.types';
import { DATABASE, DATABASE_POOL } from './database.tokens';
import * as schema from './schemas';

@Injectable()
class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Module({
  providers: [
    AppConfig,
    {
      provide: DATABASE_POOL,
      inject: [AppConfig],
      useFactory: (config: AppConfig): Pool =>
        new Pool({
          host: config.database.host,
          port: config.database.port,
          database: config.database.name,
          user: config.database.username,
          password: config.database.password,
          max: 10,
          connectionTimeoutMillis: 3_000,
        }),
    },
    {
      provide: DATABASE,
      inject: [DATABASE_POOL],
      useFactory: async (pool: Pool): Promise<AntiFraudDatabase> => {
        const database = drizzle(pool, { schema });
        await migrate(database, { migrationsFolder: resolve(process.cwd(), 'drizzle') });
        return database;
      },
    },
    DatabaseLifecycle,
  ],
  exports: [AppConfig, DATABASE, DATABASE_POOL],
})
export class DatabaseModule {}
