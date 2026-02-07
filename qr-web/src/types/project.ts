export interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    originalUrl: string;
    shortenEnabled: boolean;
    shortUrl: string | null;
    recipeJson: string;
    logoFilename: string | null;
    logoUrl?: string | null;
}

export type ContentType = 'url' | 'text' | 'email' | 'phone';

/** Matches qr-code-styling Gradient: linear/radial with rotation and color stops */
export interface QrGradient {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: Array<{ offset: number; color: string }>;
}

export interface RecipeOptions {
    width?: number;
    height?: number;
    data?: string;
    contentType?: ContentType;
    image?: string;
    qrOptions?: { type?: string; mode?: string; errorCorrectionLevel?: string };
    imageOptions?: {
        hideBackgroundDots?: boolean;
        imageSize?: number;
        margin?: number;
    };
    backgroundOptions?: {
        color?: string;
        gradient?: QrGradient;
        round?: number;
    };
    dotsOptions?: {
        color?: string;
        type?: string;
        gradient?: QrGradient;
        roundSize?: boolean;
    };
    cornersSquareOptions?: {
        color?: string;
        type?: string;
        gradient?: QrGradient;
    };
    cornersDotOptions?: {
        color?: string;
        type?: string;
        gradient?: QrGradient;
    };
    // shape removed - circle shape has rendering issues in qr-code-styling library
    margin?: number;
}

export const DEFAULT_RECIPE: RecipeOptions = {
    width: 300,
    height: 300,
    qrOptions: { type: 'canvas', mode: 'Byte', errorCorrectionLevel: 'M' },
    backgroundOptions: { color: '#ffffff' },
    dotsOptions: { color: '#000000', type: 'square' },
    cornersSquareOptions: { color: '#000000', type: 'square' },
};
