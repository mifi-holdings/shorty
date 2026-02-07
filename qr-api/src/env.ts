import { z } from 'zod';

const envSchema = z.object({
    PORT: z.coerce.number().default(8080),
    DB_PATH: z.string().default('/data/db.sqlite'),
    UPLOADS_PATH: z.string().default('/uploads'),
    KUTT_API_KEY: z.string().optional(),
    KUTT_BASE_URL: z.string().url().default('http://kutt:3000'),
    SHORT_DOMAIN: z.string().default('https://mifi.me'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        throw new Error('Invalid env: ' + parsed.error.message);
    }
    return parsed.data;
}
