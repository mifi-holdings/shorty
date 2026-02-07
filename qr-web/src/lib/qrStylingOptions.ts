import type { RecipeOptions, QrGradient } from '@/types/project';

type DotType =
    | 'square'
    | 'rounded'
    | 'dots'
    | 'classy'
    | 'classy-rounded'
    | 'extra-rounded';
type CornerType = 'square' | 'dot' | 'extra-rounded' | DotType;
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrStylingOverrides {
    width?: number;
    height?: number;
    data?: string;
    image?: string;
}

/** Build options for qr-code-styling from RecipeOptions (shared by QrPreview and ExportPanel). */
export function buildQrStylingOptions(
    recipe: RecipeOptions,
    overrides: QrStylingOverrides = {},
): Record<string, unknown> {
    const opts: Record<string, unknown> = {
        width: overrides.width ?? recipe.width ?? 256,
        height: overrides.height ?? recipe.height ?? 256,
        data: overrides.data ?? recipe.data ?? ' ',
        image: overrides.image,
        type: 'canvas',
        shape: recipe.shape ?? 'square',
        margin: recipe.margin ?? 0,
        qrOptions: {
            type: 'canvas',
            mode: 'Byte',
            errorCorrectionLevel:
                (recipe.qrOptions?.errorCorrectionLevel as ErrorLevel) ?? 'M',
        },
        imageOptions: {
            hideBackgroundDots: recipe.imageOptions?.hideBackgroundDots ?? true,
            imageSize: recipe.imageOptions?.imageSize ?? 0.4,
            margin: recipe.imageOptions?.margin ?? 0,
        },
    };

    const bg = recipe.backgroundOptions;
    opts.backgroundOptions = {
        color: bg?.color ?? '#ffffff',
        round: bg?.round ?? 0,
        ...(bg?.gradient && { gradient: bg.gradient }),
    };

    const dots = recipe.dotsOptions;
    opts.dotsOptions = {
        type: (dots?.type as DotType) ?? 'square',
        color: dots?.color ?? '#000000',
        roundSize: dots?.roundSize ?? false,
        ...(dots?.gradient && { gradient: dots.gradient }),
    };

    const cornersSq = recipe.cornersSquareOptions;
    opts.cornersSquareOptions = {
        type: (cornersSq?.type as CornerType) ?? 'square',
        color: cornersSq?.color ?? '#000000',
        ...(cornersSq?.gradient && { gradient: cornersSq.gradient }),
    };

    const cornersDot = recipe.cornersDotOptions;
    opts.cornersDotOptions = {
        type:
            (cornersDot?.type as CornerType) ??
            (cornersSq?.type as CornerType) ??
            'square',
        color: cornersDot?.color ?? cornersSq?.color ?? '#000000',
        ...((cornersDot?.gradient ?? cornersSq?.gradient) && {
            gradient: cornersDot?.gradient ?? cornersSq?.gradient,
        }),
    };

    return opts;
}

/** Create a simple two-stop gradient (for UI defaults). */
export function makeGradient(
    type: 'linear' | 'radial',
    color1: string,
    color2: string,
    rotation = 0,
): QrGradient {
    return {
        type,
        rotation,
        colorStops: [
            { offset: 0, color: color1 },
            { offset: 1, color: color2 },
        ],
    };
}
