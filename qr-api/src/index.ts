import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { loadEnv } from './env.js';
import { initDb } from './db.js';
import { projectsRouter } from './routes/projects.js';
import { foldersRouter } from './routes/folders.js';
import { uploadsRouter } from './routes/uploads.js';
import { shortenRouter } from './routes/shorten.js';

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

const app = express();
app.use(cors());
app.use(express.json());

const baseUrl = ''; // relative; Next.js proxy will use same origin for /api

app.use('/projects', projectsRouter(db, baseUrl));
app.use('/folders', foldersRouter(db));
app.use('/uploads', uploadsRouter(env, baseUrl));
app.use('/shorten', shortenRouter(env));

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const msg = err.message ?? '';
    if (err.name === 'MulterError' || msg.includes('image files') || msg.includes('file size')) {
        return res.status(400).json({ error: msg || 'Invalid upload' });
    }
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
});

const port = env.PORT;
app.listen(port, () => {
    logger.info({ port }, 'qr-api listening');
});
