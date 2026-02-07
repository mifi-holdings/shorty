import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Env } from '../env.js';
import { shortenUrl } from '../shorten.js';

const bodySchema = z.object({
    targetUrl: z.string().url(),
    customSlug: z.string().optional(),
});

export function shortenRouter(env: Env): ReturnType<typeof Router> {
    const router = Router();

    router.post('/', async (req: Request, res: Response) => {
        const parsed = bodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.message });
        }
        try {
            const result = await shortenUrl(env, parsed.data);
            return res.json(result);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes('KUTT_API_KEY')) {
                return res.status(503).json({ error: msg });
            }
            return res.status(502).json({ error: msg });
        }
    });

    return router;
}
