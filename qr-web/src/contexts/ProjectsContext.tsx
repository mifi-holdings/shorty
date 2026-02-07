'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { ProjectItem, FolderItem } from '@/components/Sidebar';

interface ProjectsContextValue {
    projects: ProjectItem[];
    folders: FolderItem[];
    setProjects: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
    setFolders: React.Dispatch<React.SetStateAction<FolderItem[]>>;
    refetch: () => void;
    updateProjectInList: (id: string, patch: Partial<ProjectItem>) => void;
    removeProjectFromList: (id: string) => void;
    moveProjectToFolder: (projectId: string, folderId: string | null) => Promise<void>;
    createFolder: (name?: string) => Promise<FolderItem | null>;
    updateFolder: (id: string, patch: Partial<FolderItem>) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function useProjects(): ProjectsContextValue {
    const ctx = useContext(ProjectsContext);
    if (!ctx) {
        throw new Error('useProjects must be used within ProjectsProvider');
    }
    return ctx;
}

export function ProjectsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);

    const refetch = useCallback(() => {
        Promise.all([
            fetch('/api/projects').then((r) => r.json()),
            fetch('/api/folders').then((r) => r.json()),
        ])
            .then(([projectsData, foldersData]) => {
                setProjects(Array.isArray(projectsData) ? projectsData : []);
                setFolders(Array.isArray(foldersData) ? foldersData : []);
            })
            .catch(() => {
                setProjects([]);
                setFolders([]);
            });
    }, []);

    const updateProjectInList = useCallback((id: string, patch: Partial<ProjectItem>) => {
        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        );
    }, []);

    const removeProjectFromList = useCallback((id: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const moveProjectToFolder = useCallback(
        async (projectId: string, folderId: string | null) => {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderId }),
            });
            if (!res.ok) return;
            updateProjectInList(projectId, { folderId });
        },
        [updateProjectInList],
    );

    const createFolder = useCallback(async (name = 'New folder') => {
        const res = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) return null;
        const folder = await res.json();
        setFolders((prev) => [...prev, folder].sort((a, b) => a.sortOrder - b.sortOrder));
        return folder;
    }, []);

    const updateFolder = useCallback(async (id: string, patch: Partial<FolderItem>) => {
        const res = await fetch(`/api/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!res.ok) return;
        const folder = await res.json();
        setFolders((prev) =>
            prev.map((f) => (f.id === id ? folder : f)).sort((a, b) => a.sortOrder - b.sortOrder),
        );
    }, []);

    const deleteFolder = useCallback(async (id: string) => {
        const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
        if (!res.ok) return;
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setProjects((prev) =>
            prev.map((p) => (p.folderId === id ? { ...p, folderId: null } : p)),
        );
    }, []);

    return (
        <ProjectsContext.Provider
            value={{
                projects,
                folders,
                setProjects,
                setFolders,
                refetch,
                updateProjectInList,
                removeProjectFromList,
                moveProjectToFolder,
                createFolder,
                updateFolder,
                deleteFolder,
            }}
        >
            {children}
        </ProjectsContext.Provider>
    );
}
