import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

export default async function globalSetup() {
  dotenv.config({ path: '.env.test' });
  if (process.env.DATABASE_URL) {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env },
    });
  }
}
