import { describe, it, expect } from 'vitest';
import {
    buildQrStylingOptions,
    makeGradient,
    type QrStylingOverrides,
} from './qrStylingOptions';
describe('buildQrStylingOptions', () => {
    it('uses recipe defaults when minimal recipe', () => {
        const opts = buildQrStylingOptions({});
        expect(opts.width).toBe(256);
        expect(opts.height).toBe(256);
        expect(opts.data).toBe(' ');
        expect(opts.shape).toBe('square');
        expect(opts.margin).toBe(0);
        expect(opts.qrOptions).toEqual({
            type: 'canvas',
            mode: 'Byte',
            errorCorrectionLevel: 'M',
        });
        expect((opts.backgroundOptions as { color: string }).color).toBe(
            '#ffffff',
        );
        expect((opts.dotsOptions as { type: string }).type).toBe('square');
        expect((opts.cornersSquareOptions as { type: string }).type).toBe(
            'square',
        );
    });

    it('uses overrides for width, height, data', () => {
        const overrides: QrStylingOverrides = {
            width: 100,
            height: 200,
            data: 'https://x.com',
        };
        const opts = buildQrStylingOptions({}, overrides);
        expect(opts.width).toBe(100);
        expect(opts.height).toBe(200);
        expect(opts.data).toBe('https://x.com');
    });

    it('includes gradient in backgroundOptions when set', () => {
        const gradient = {
            type: 'linear' as const,
            rotation: 90,
            colorStops: [
                { offset: 0, color: '#f00' },
                { offset: 1, color: '#00f' },
            ],
        };
        const opts = buildQrStylingOptions({
            backgroundOptions: { color: '#fff', gradient },
        });
        expect(
            (opts.backgroundOptions as { gradient: unknown }).gradient,
        ).toEqual(gradient);
    });

    it('includes gradient in dotsOptions and cornersSquareOptions when set', () => {
        const gradient = {
            type: 'radial' as const,
            colorStops: [
                { offset: 0, color: '#000' },
                { offset: 1, color: '#fff' },
            ],
        };
        const opts = buildQrStylingOptions({
            dotsOptions: { type: 'rounded', color: '#000', gradient },
            cornersSquareOptions: { type: 'dot', color: '#000', gradient },
        });
        expect((opts.dotsOptions as { gradient: unknown }).gradient).toEqual(
            gradient,
        );
        expect(
            (opts.cornersSquareOptions as { gradient: unknown }).gradient,
        ).toEqual(gradient);
    });

    it('falls back cornersDotOptions to cornersSquareOptions', () => {
        const opts = buildQrStylingOptions({
            cornersSquareOptions: { type: 'extra-rounded', color: '#111' },
        });
        expect((opts.cornersDotOptions as { type: string }).type).toBe(
            'extra-rounded',
        );
        expect((opts.cornersDotOptions as { color: string }).color).toBe(
            '#111',
        );
    });

    it('uses cornersDotOptions gradient when both set', () => {
        const g1 = {
            type: 'linear' as const,
            colorStops: [
                { offset: 0, color: '#a' },
                { offset: 1, color: '#b' },
            ],
        };
        const g2 = {
            type: 'radial' as const,
            colorStops: [
                { offset: 0, color: '#c' },
                { offset: 1, color: '#d' },
            ],
        };
        const opts = buildQrStylingOptions({
            cornersSquareOptions: { gradient: g1 },
            cornersDotOptions: { gradient: g2 },
        });
        expect(
            (opts.cornersDotOptions as { gradient: unknown }).gradient,
        ).toEqual(g2);
    });

    it('falls back cornersDotOptions gradient to cornersSquareOptions', () => {
        const g = {
            type: 'linear' as const,
            colorStops: [
                { offset: 0, color: '#0' },
                { offset: 1, color: '#1' },
            ],
        };
        const opts = buildQrStylingOptions({
            cornersSquareOptions: { type: 'dot', gradient: g },
        });
        expect(
            (opts.cornersDotOptions as { gradient: unknown }).gradient,
        ).toEqual(g);
    });

    it('uses imageOptions and shape from recipe', () => {
        const opts = buildQrStylingOptions({
            imageOptions: {
                hideBackgroundDots: false,
                imageSize: 0.5,
                margin: 5,
            },
            shape: 'circle',
        });
        expect(
            (opts.imageOptions as { hideBackgroundDots: boolean })
                .hideBackgroundDots,
        ).toBe(false);
        expect((opts.imageOptions as { imageSize: number }).imageSize).toBe(
            0.5,
        );
        expect((opts.imageOptions as { margin: number }).margin).toBe(5);
        expect(opts.shape).toBe('circle');
    });
});

describe('makeGradient', () => {
    it('returns linear gradient with rotation', () => {
        const g = makeGradient('linear', '#f00', '#0f0', 45);
        expect(g.type).toBe('linear');
        expect(g.rotation).toBe(45);
        expect(g.colorStops).toHaveLength(2);
        expect(g.colorStops[0]).toEqual({ offset: 0, color: '#f00' });
        expect(g.colorStops[1]).toEqual({ offset: 1, color: '#0f0' });
    });

    it('defaults rotation to 0', () => {
        const g = makeGradient('radial', '#000', '#fff');
        expect(g.type).toBe('radial');
        expect(g.rotation).toBe(0);
    });
});
