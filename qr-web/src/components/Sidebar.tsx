'use client';

import { useState, useCallback } from 'react';
import {
    NavLink,
    Stack,
    Title,
    Button,
    Box,
    Collapse,
    TextInput,
    ActionIcon,
    Group,
    Text,
    Modal,
} from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    IconPlus,
    IconQrcode,
    IconFolder,
    IconFolderOpen,
    IconChevronDown,
    IconChevronRight,
    IconFolderPlus,
    IconTrash,
} from '@tabler/icons-react';
import { useProjects } from '@/contexts/ProjectsContext';
import classes from './Sidebar.module.css';

export interface ProjectItem {
    id: string;
    name: string;
    updatedAt: string;
    logoUrl: string | null;
    folderId?: string | null;
}

export interface FolderItem {
    id: string;
    name: string;
    sortOrder: number;
}

const UNCATEGORIZED_ID = '__uncategorized__';

export function Sidebar() {
    const pathname = usePathname();
    const {
        projects,
        folders,
        moveProjectToFolder,
        createFolder,
        updateFolder,
        deleteFolder,
    } = useProjects();

    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [folderToDelete, setFolderToDelete] = useState<{
        folder: FolderItem;
        projectCount: number;
    } | null>(null);

    const toggleFolder = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent, projectId: string) => {
        e.dataTransfer.setData('application/x-project-id', projectId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(zoneId);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverId(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent, targetFolderId: string | null) => {
            e.preventDefault();
            setDragOverId(null);
            const projectId = e.dataTransfer.getData('application/x-project-id');
            if (!projectId) return;
            const fid = targetFolderId === UNCATEGORIZED_ID ? null : targetFolderId;
            moveProjectToFolder(projectId, fid);
        },
        [moveProjectToFolder],
    );

    const uncategorized = projects.filter((p) => !p.folderId || p.folderId === '');
    const projectsByFolder = folders.map((f) => ({
        folder: f,
        projects: projects.filter((p) => p.folderId === f.id),
    }));

    const startEditFolder = (folder: FolderItem) => {
        setEditingFolderId(folder.id);
        setEditingName(folder.name);
    };

    const saveEditFolder = async () => {
        if (editingFolderId && editingName.trim()) {
            await updateFolder(editingFolderId, { name: editingName.trim() });
        }
        setEditingFolderId(null);
        setEditingName('');
    };

    const handleDeleteFolder = useCallback(
        (folder: FolderItem, projectCount: number) => {
            if (projectCount === 0) {
                deleteFolder(folder.id);
            } else {
                setFolderToDelete({ folder, projectCount });
            }
        },
        [deleteFolder],
    );

    const confirmDeleteFolder = useCallback(() => {
        if (folderToDelete) {
            deleteFolder(folderToDelete.folder.id);
            setFolderToDelete(null);
        }
    }, [folderToDelete, deleteFolder]);

    const renderProjectLink = (p: ProjectItem) => (
        <NavLink
            key={p.id}
            component={Link}
            href={`/projects/${p.id}`}
            label={p.name || 'Untitled QR'}
            active={pathname === `/projects/${p.id}`}
            className={classes.navLink}
            draggable
            onDragStart={(e) => handleDragStart(e, p.id)}
        />
    );

    const renderDropZone = (
        zoneId: string,
        label: string,
        folderId: string | null,
        children: React.ReactNode,
    ) => (
        <Box
            className={classes.dropZone}
            data-dragging={dragOverId === zoneId ? true : undefined}
            onDragOver={(e) => handleDragOver(e, zoneId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folderId)}
        >
            {children}
        </Box>
    );

    return (
        <Stack gap="md" p="md" className={classes.sidebar}>
            <div className={classes.header}>
                <Title order={4} className={classes.title}>
                    <IconQrcode size={20} style={{ marginRight: 8 }} />
                    QR Designer
                </Title>
                <Group gap={4}>
                    <Button
                        component={Link}
                        href="/projects/new"
                        leftSection={<IconPlus size={16} />}
                        size="xs"
                        variant="light"
                    >
                        New
                    </Button>
                    <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconFolderPlus size={16} />}
                        onClick={() => {
                            createFolder().then((folder) => {
                                if (folder) setExpandedIds((prev) => new Set([...prev, folder.id]));
                            });
                        }}
                    >
                        Folder
                    </Button>
                </Group>
            </div>
            <nav className={classes.nav}>
                {renderDropZone(
                    UNCATEGORIZED_ID,
                    'Uncategorized',
                    null,
                    <>
                        <Text size="xs" c="dimmed" fw={500} mb={4} className={classes.sectionLabel}>
                            Uncategorized
                        </Text>
                        <Stack gap={2}>
                            {uncategorized.map((p) => renderProjectLink(p))}
                        </Stack>
                    </>,
                )}
                {projectsByFolder.map(({ folder, projects: folderProjects }) => {
                    const isExpanded = expandedIds.has(folder.id);
                    return (
                        <Box key={folder.id}>
                            {renderDropZone(
                                folder.id,
                                folder.name,
                                folder.id,
                                <>
                                    <Group
                                        gap={4}
                                        className={classes.folderHeader}
                                        onClick={() => toggleFolder(folder.id)}
                                    >
                                        {isExpanded ? (
                                            <IconChevronDown size={14} />
                                        ) : (
                                            <IconChevronRight size={14} />
                                        )}
                                        {isExpanded ? (
                                            <IconFolderOpen size={16} />
                                        ) : (
                                            <IconFolder size={16} />
                                        )}
                                        {editingFolderId === folder.id ? (
                                            <TextInput
                                                size="xs"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onBlur={saveEditFolder}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEditFolder();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                            />
                                        ) : (
                                            <Text
                                                size="sm"
                                                fw={500}
                                                style={{ flex: 1 }}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditFolder(folder);
                                                }}
                                            >
                                                {folder.name}
                                            </Text>
                                        )}
                                        {editingFolderId !== folder.id && (
                                            <ActionIcon
                                                size="xs"
                                                variant="subtle"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFolder(folder, folderProjects.length);
                                                }}
                                                aria-label="Delete folder"
                                            >
                                                <IconTrash size={12} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                    <Collapse in={isExpanded}>
                                        <Stack gap={2} pl="md" mt={4}>
                                            {folderProjects.map((p) => renderProjectLink(p))}
                                        </Stack>
                                    </Collapse>
                                </>,
                            )}
                        </Box>
                    );
                })}
            </nav>
            <Modal
                opened={folderToDelete !== null}
                onClose={() => setFolderToDelete(null)}
                title="Delete folder?"
                centered
            >
                {folderToDelete && (
                    <>
                        <Text size="sm" c="dimmed" mb="md">
                            This folder contains {folderToDelete.projectCount} project
                            {folderToDelete.projectCount === 1 ? '' : 's'}. They will be moved to
                            Uncategorized. Delete folder &quot;{folderToDelete.folder.name}&quot;?
                        </Text>
                        <Group justify="flex-end" gap="xs">
                            <Button
                                variant="subtle"
                                onClick={() => setFolderToDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button color="red" onClick={confirmDeleteFolder}>
                                Delete folder
                            </Button>
                        </Group>
                    </>
                )}
            </Modal>
        </Stack>
    );
}
