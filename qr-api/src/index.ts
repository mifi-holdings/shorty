import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { loadEnv } from './env.js';
import { initDb } from './db.js';
import { createApp } from './app.js';

const env = loadEnv();
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

// Ensure data dirs exist
const dataDir = path.dirname(env.DB_PATH);
const uploadsDir = env.UPLOADS_PATH;
for (const dir of [dataDir, uploadsDir]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info({ dir }, 'Created directory');
    }
}

const db = initDb(env);
const app = createApp(db, env, '', logger);

const port = env.PORT;
app.listen(port, () => {
    logger.info({ port }, 'qr-api listening');
});
