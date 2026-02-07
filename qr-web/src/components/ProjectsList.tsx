'use client';

import { Stack, Text } from '@mantine/core';
import classes from './ProjectsList.module.css';

export function ProjectsList() {
    return (
        <div className={classes.content}>
            <Stack align="center" gap="md" mt="xl">
                <Text c="dimmed" size="sm">
                    Select a project from the sidebar or create a new one.
                </Text>
            </Stack>
        </div>
    );
}
