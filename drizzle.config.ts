import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schemas/index.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://antifraud:antifraud@localhost:5432/antifraud',
  },
  strict: true,
  verbose: true,
});
