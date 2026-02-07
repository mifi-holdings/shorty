import { describe, it, expect } from 'vitest';
import type { RecipeOptions } from '@/types/project';

describe('recipe serialization', () => {
    it('round-trips recipe JSON', () => {
        const recipe: RecipeOptions = {
            width: 300,
            height: 300,
            data: 'https://mifi.me/abc',
            qrOptions: { errorCorrectionLevel: 'M' },
            backgroundOptions: { color: '#ffffff' },
            dotsOptions: { color: '#000000', type: 'rounded' },
            cornersSquareOptions: { color: '#000000', type: 'dot' },
        };
        const json = JSON.stringify(recipe);
        const parsed = JSON.parse(json) as RecipeOptions;
        expect(parsed.data).toBe('https://mifi.me/abc');
        expect(parsed.dotsOptions?.type).toBe('rounded');
        expect(parsed.cornersSquareOptions?.type).toBe('dot');
    });
});
