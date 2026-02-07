import express from 'express';
import cors from 'cors';
import type { Database } from 'better-sqlite3';
import type { Env } from './env.js';
import { projectsRouter } from './routes/projects.js';
import { foldersRouter } from './routes/folders.js';
import { uploadsRouter } from './routes/uploads.js';
import { shortenRouter } from './routes/shorten.js';

export function createApp(
    db: Database,
    env: Env,
    baseUrl = '',
    logger?: { error: (o: object, msg?: string) => void },
): express.Express {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.use('/projects', projectsRouter(db, baseUrl));
    app.use('/folders', foldersRouter(db));
    app.use('/uploads', uploadsRouter(env, baseUrl));
    app.use('/shorten', shortenRouter(env));

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });

    app.use(
        (
            err: Error,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction,
        ) => {
            const msg = err.message ?? '';
            if (
                err.name === 'MulterError' ||
                msg.includes('image files') ||
                msg.includes('file size')
            ) {
                return res.status(400).json({ error: msg || 'Invalid upload' });
            }
            logger?.error({ err }, 'Unhandled error');
            res.status(500).json({ error: 'Internal server error' });
        },
    );

    return app;
}
