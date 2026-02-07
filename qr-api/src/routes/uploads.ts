import { Router, type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import type { Env } from '../env.js';
import { createMulter } from '../upload.js';

export function uploadsRouter(env: Env, baseUrl: string): ReturnType<typeof Router> {
    const router = Router();
    const upload = createMulter(env);

    router.post('/logo', upload.single('file'), (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filename = req.file.filename;
        const url = `${baseUrl}/uploads/${filename}`;
        return res.json({ filename, url });
    });

    router.get('/:filename', (req: Request, res: Response) => {
        const raw = req.params.filename;
        const filename = typeof raw === 'string' ? raw : raw?.[0];
        if (!filename || filename.includes('..') || path.isAbsolute(filename)) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        const filePath = path.join(env.UPLOADS_PATH, filename);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.sendFile(path.resolve(filePath), (err) => {
            if (err) res.status(500).json({ error: String(err) });
        });
    });

    return router;
}
