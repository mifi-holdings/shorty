import { describe, it, expect } from 'vitest';
import { createMulter } from './upload.js';

describe('createMulter', () => {
    it('returns multer instance with single()', () => {
        const upload = createMulter({
            UPLOADS_PATH: '/tmp',
        } as Parameters<typeof createMulter>[0]);
        expect(upload.single).toBeDefined();
        expect(typeof upload.single).toBe('function');
    });
});
