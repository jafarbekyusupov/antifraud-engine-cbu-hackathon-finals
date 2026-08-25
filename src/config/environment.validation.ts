type RawEnvironment = Record<string, unknown>;

function integer(value: unknown, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function nonNegativeInteger(value: unknown, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function boolean(value: unknown, fallback: boolean, name: string): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new Error(`${name} must be true or false`);
}

function requiredString(value: unknown, fallback: string, name: string): string {
  const parsed = typeof value === 'string' ? value.trim() : fallback;
  if (!parsed) {
    throw new Error(`${name} must not be empty`);
  }
  return parsed;
}

export function validateEnvironment(environment: RawEnvironment): RawEnvironment {
  return {
    ...environment,
    NODE_ENV: requiredString(environment.NODE_ENV, 'development', 'NODE_ENV'),
    PORT: integer(environment.PORT, 3000, 'PORT'),
    DB_HOST: requiredString(environment.DB_HOST, 'localhost', 'DB_HOST'),
    DB_PORT: integer(environment.DB_PORT, 5432, 'DB_PORT'),
    DB_NAME: requiredString(environment.DB_NAME, 'antifraud', 'DB_NAME'),
    DB_USERNAME: requiredString(environment.DB_USERNAME, 'antifraud', 'DB_USERNAME'),
    DB_PASSWORD: requiredString(environment.DB_PASSWORD, 'antifraud', 'DB_PASSWORD'),
    DATA_DIR: requiredString(environment.DATA_DIR, './data', 'DATA_DIR'),
    RESULT_DIR: requiredString(environment.RESULT_DIR, './natija', 'RESULT_DIR'),
    CREATE_REPLAY_CHALLENGES: boolean(
      environment.CREATE_REPLAY_CHALLENGES,
      false,
      'CREATE_REPLAY_CHALLENGES',
    ),
    SECURITY_CHALLENGE_TTL_SECONDS: nonNegativeInteger(
      environment.SECURITY_CHALLENGE_TTL_SECONDS,
      300,
      'SECURITY_CHALLENGE_TTL_SECONDS',
    ),
    CORS_ORIGINS: requiredString(
      environment.CORS_ORIGINS,
      'http://localhost:3001,http://localhost:5173',
      'CORS_ORIGINS',
    ),
  };
}
