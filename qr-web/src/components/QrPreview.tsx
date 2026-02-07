'use client';

import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { RecipeOptions } from '@/types/project';
import { buildQrStylingOptions } from '@/lib/qrStylingOptions';

interface QrPreviewProps {
    data: string;
    recipe: RecipeOptions;
    logoUrl?: string | null;
    size?: number;
}

export function QrPreview({ data, recipe, logoUrl, size = 256 }: QrPreviewProps) {
    const ref = useRef<HTMLDivElement>(null);
    const qrRef = useRef<QRCodeStyling | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const qr = new QRCodeStyling(
            buildQrStylingOptions(recipe, {
                width: size,
                height: size,
                data: data || ' ',
                image: logoUrl || undefined,
            }) as ConstructorParameters<typeof QRCodeStyling>[0],
        );
        qrRef.current = qr;
        qr.append(el);
        return () => {
            el.replaceChildren();
            qrRef.current = null;
        };
    }, [data, logoUrl, recipe, size]);

    useEffect(() => {
        const qr = qrRef.current;
        if (!qr) return;
        qr.update(
            buildQrStylingOptions(recipe, {
                width: recipe.width ?? size,
                height: recipe.height ?? size,
                data: data || ' ',
                image: logoUrl || undefined,
            }) as Parameters<QRCodeStyling['update']>[0],
        );
    }, [data, recipe, logoUrl, size]);

    return <div ref={ref} style={{ display: 'inline-block' }} />;
}
