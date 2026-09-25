/**
 * Load .env / .env.local the same way `next dev` does.
 *
 * Next.js loads these files for the web app, but the worker runs under plain
 * tsx, so without this `npm run worker` sees none of them. Must be the first
 * import in worker/index.ts: lib/queue/sqs reads process.env at module load.
 * Variables already set in the environment (docker-compose env_file, CI) win.
 */
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
