import { describe, it, expect } from 'vitest';
import { DEFAULT_RECIPE } from './project';

describe('project types', () => {
    it('DEFAULT_RECIPE has expected shape', () => {
        expect(DEFAULT_RECIPE.width).toBe(300);
        expect(DEFAULT_RECIPE.height).toBe(300);
        expect(DEFAULT_RECIPE.qrOptions?.errorCorrectionLevel).toBe('M');
        expect(DEFAULT_RECIPE.backgroundOptions?.color).toBe('#ffffff');
        expect(DEFAULT_RECIPE.dotsOptions?.color).toBe('#000000');
        expect(DEFAULT_RECIPE.cornersSquareOptions?.type).toBe('square');
    });
});
