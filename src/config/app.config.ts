import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
}

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get port(): number {
    return this.config.getOrThrow<number>('PORT');
  }

  get dataDirectory(): string {
    return this.config.getOrThrow<string>('DATA_DIR');
  }

  get resultDirectory(): string {
    return this.config.getOrThrow<string>('RESULT_DIR');
  }

  get corsOrigins(): readonly string[] {
    return this.config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get database(): DatabaseConfig {
    return {
      host: this.config.getOrThrow<string>('DB_HOST'),
      port: this.config.getOrThrow<number>('DB_PORT'),
      name: this.config.getOrThrow<string>('DB_NAME'),
      username: this.config.getOrThrow<string>('DB_USERNAME'),
      password: this.config.getOrThrow<string>('DB_PASSWORD'),
    };
  }
}
