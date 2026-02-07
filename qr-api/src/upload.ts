import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Env } from './env.js';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function createMulter(env: Env) {
    return multer({
        storage: multer.diskStorage({
            destination: (_req, _file, cb) => cb(null, env.UPLOADS_PATH),
            filename: (_req, file, cb) => {
                const ext = path.extname(file.originalname) || '.bin';
                cb(null, `${randomUUID()}${ext}`);
            },
        }),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, cb) => {
            if (IMAGE_MIME.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
            }
        },
    });
}
