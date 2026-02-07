'use client';

import { useEffect } from 'react';
import { AppShell } from '@mantine/core';
import { Sidebar } from '@/components/Sidebar';
import { ProjectsProvider, useProjects } from '@/contexts/ProjectsContext';
import classes from './layout.module.css';

function ProjectsLayoutInner({
    children,
}: {
    children: React.ReactNode;
}) {
    const { refetch } = useProjects();

    useEffect(() => {
        refetch();
    }, [refetch]);

    return (
        <AppShell
            navbar={{ width: 280, breakpoint: 'sm' }}
            padding="md"
            classNames={{ main: classes.main }}
        >
            <AppShell.Navbar>
                <Sidebar />
            </AppShell.Navbar>
            <AppShell.Main>{children}</AppShell.Main>
        </AppShell>
    );
}

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProjectsProvider>
            <ProjectsLayoutInner>{children}</ProjectsLayoutInner>
        </ProjectsProvider>
    );
}
