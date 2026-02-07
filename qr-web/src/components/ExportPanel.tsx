'use client';

import { useRef, useCallback } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import QRCodeStyling from 'qr-code-styling';
import { PDFDocument } from 'pdf-lib';
import type { RecipeOptions } from '@/types/project';
import { buildQrStylingOptions } from '@/lib/qrStylingOptions';
import classes from './ExportPanel.module.css';

interface ExportPanelProps {
    data: string;
    recipe: RecipeOptions;
    logoUrl?: string | null;
    projectName?: string;
}

export function ExportPanel({
    data,
    recipe,
    logoUrl,
    projectName,
}: ExportPanelProps) {
    const qrRef = useRef<QRCodeStyling | null>(null);

    const getQrInstance = useCallback(() => {
        const opts = buildQrStylingOptions(recipe, {
            width: 512,
            height: 512,
            data: data || ' ',
            image: logoUrl || undefined,
        });
        if (qrRef.current) {
            qrRef.current.update(
                opts as Parameters<QRCodeStyling['update']>[0],
            );
            return qrRef.current;
        }
        const qr = new QRCodeStyling(
            opts as ConstructorParameters<typeof QRCodeStyling>[0],
        );
        qrRef.current = qr;
        return qr;
    }, [data, recipe, logoUrl]);

    const toBlob = (raw: Blob | Buffer | null): Blob | null => {
        if (!raw) return null;
        return raw instanceof Blob ? raw : new Blob([raw as BlobPart]);
    };

    const handleSvg = useCallback(async () => {
        const qr = getQrInstance();
        const raw = await qr.getRawData('svg');
        const blob = toBlob(raw);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${projectName || 'export'}.svg`.replace(
            /[^a-z0-9.-]/gi,
            '-',
        );
        a.click();
        URL.revokeObjectURL(url);
    }, [getQrInstance, projectName]);

    const handlePng = useCallback(async () => {
        const qr = getQrInstance();
        const raw = await qr.getRawData('png');
        const blob = toBlob(raw);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${projectName || 'export'}.png`.replace(
            /[^a-z0-9.-]/gi,
            '-',
        );
        a.click();
        URL.revokeObjectURL(url);
    }, [getQrInstance, projectName]);

    const handlePdf = useCallback(async () => {
        const qr = getQrInstance();
        const raw = await qr.getRawData('png');
        const blob = toBlob(raw);
        if (!blob) return;
        const arrayBuffer = await blob.arrayBuffer();
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([400, 500]);
        const pngImage = await pdfDoc.embedPng(new Uint8Array(arrayBuffer));
        const scale = Math.min(280 / pngImage.width, 280 / pngImage.height);
        const w = pngImage.width * scale;
        const h = pngImage.height * scale;
        page.drawImage(pngImage, {
            x: (400 - w) / 2,
            y: (500 - h) / 2,
            width: w,
            height: h,
        });
        if (projectName) {
            page.drawText(projectName, { x: 50, y: 80, size: 12 });
        }
        if (data) {
            const urlText = data.length > 50 ? data.slice(0, 47) + '...' : data;
            page.drawText(urlText, { x: 50, y: 60, size: 10 });
        }
        const pdfBytes = await pdfDoc.save();
        const url = URL.createObjectURL(
            new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }),
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${projectName || 'export'}.pdf`.replace(
            /[^a-z0-9.-]/gi,
            '-',
        );
        a.click();
        URL.revokeObjectURL(url);
    }, [getQrInstance, data, projectName]);

    return (
        <Stack gap="md" mt="md" className={classes.panel}>
            <Text size="sm" fw={500}>
                Export
            </Text>
            <Group>
                <Button
                    leftSection={<IconDownload size={16} />}
                    variant="light"
                    size="sm"
                    onClick={handleSvg}
                >
                    SVG
                </Button>
                <Button
                    leftSection={<IconDownload size={16} />}
                    variant="light"
                    size="sm"
                    onClick={handlePng}
                >
                    PNG
                </Button>
                <Button
                    leftSection={<IconDownload size={16} />}
                    variant="light"
                    size="sm"
                    onClick={handlePdf}
                >
                    PDF
                </Button>
            </Group>
        </Stack>
    );
}
