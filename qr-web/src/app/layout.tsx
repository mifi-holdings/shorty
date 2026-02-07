'use client';

import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import './globals.css';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <MantineProvider defaultColorScheme="dark">
                    {children}
                </MantineProvider>
            </body>
        </html>
    );
}
