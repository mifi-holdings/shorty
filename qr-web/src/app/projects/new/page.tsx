'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';

export default function NewProjectPage() {
    const router = useRouter();

    useEffect(() => {
        fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Untitled QR',
                originalUrl: '',
                shortenEnabled: false,
                recipeJson: '{}',
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data?.id) {
                    router.replace(`/projects/${data.id}`);
                }
            })
            .catch(() => {});
    }, [router]);

    return (
        <Center h={200}>
            <Loader size="sm" />
        </Center>
    );
}
