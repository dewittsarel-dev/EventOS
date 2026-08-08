import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { resolve } from 'node:path';

loadEnv({ path: resolve(__dirname, '.env') });
loadEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://eventos:eventos123@localhost:5432/eventos',
  },
});
