'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Stack,
    TextInput,
    Switch,
    Text,
    Loader,
    Paper,
    Group,
    Select,
    ColorInput,
    Divider,
    Alert,
    Center,
    SegmentedControl,
    NumberInput,
    Modal,
    Button,
    ActionIcon,
} from '@mantine/core';
import { IconLink, IconFileText, IconMail, IconPhone, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useDebouncedCallback } from '@mantine/hooks';
import { QrPreview } from './QrPreview';
import { ExportPanel } from './ExportPanel';
import { useProjects } from '@/contexts/ProjectsContext';
import type { Project, RecipeOptions, ContentType, QrGradient } from '@/types/project';
import { makeGradient } from '@/lib/qrStylingOptions';
import classes from './Editor.module.css';

const CONTENT_TYPES: Array<{
    value: ContentType;
    label: React.ReactNode;
    placeholder: string;
    inputLabel: string;
    validate: (value: string) => string | null;
}> = [
    {
        value: 'url',
        label: (
            <Center style={{ gap: 6 }}>
                <IconLink size={18} />
                <span>URL</span>
            </Center>
        ),
        placeholder: 'https://example.com',
        inputLabel: 'Website address',
        validate: (v) =>
            !v.trim() ? 'Enter a URL' : /^https?:\/\/.+/i.test(v.trim()) ? null : 'URL must start with http:// or https://',
    },
    {
        value: 'text',
        label: (
            <Center style={{ gap: 6 }}>
                <IconFileText size={18} />
                <span>Text</span>
            </Center>
        ),
        placeholder: 'Any text, message, or text-based data',
        inputLabel: 'Text content',
        validate: (v) => (!v.trim() ? 'Enter some text' : null),
    },
    {
        value: 'email',
        label: (
            <Center style={{ gap: 6 }}>
                <IconMail size={18} />
                <span>Email</span>
            </Center>
        ),
        placeholder: 'name@example.com',
        inputLabel: 'Email address',
        validate: (v) => {
            if (!v.trim()) return 'Enter an email address';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(v.trim()) ? null : 'Enter a valid email address';
        },
    },
    {
        value: 'phone',
        label: (
            <Center style={{ gap: 6 }}>
                <IconPhone size={18} />
                <span>Phone</span>
            </Center>
        ),
        placeholder: '+1 234 567 8900',
        inputLabel: 'Phone number',
        validate: (v) => {
            if (!v.trim()) return 'Enter a phone number';
            const digits = v.replace(/\D/g, '');
            return digits.length >= 7 && digits.length <= 15 ? null : 'Enter a valid phone number (7–15 digits)';
        },
    },
];

function inferContentType(content: string, current?: ContentType): ContentType {
    if (current && CONTENT_TYPES.some((t) => t.value === current)) return current;
    const t = content.trim();
    if (/^https?:\/\//i.test(t)) return 'url';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'email';
    if (/^[\d\s+()-]{7,}$/.test(t)) return 'phone';
    return 'text';
}

const DOT_TYPES = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'dots', label: 'Dots' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy Rounded' },
    { value: 'extra-rounded', label: 'Extra Rounded' },
];

const CORNER_TYPES = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Dot' },
    { value: 'extra-rounded', label: 'Extra Rounded' },
];

const ERROR_LEVELS = [
    { value: 'L', label: 'L (7%)' },
    { value: 'M', label: 'M (15%)' },
    { value: 'Q', label: 'Q (25%)' },
    { value: 'H', label: 'H (30%)' },
];

interface EditorProps {
    id: string;
}

export function Editor({ id }: EditorProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [contentTouched, setContentTouched] = useState(false);
    const pendingRef = useRef<Partial<Project> | null>(null);

    const fetchProject = useCallback(() => {
        fetch(`/api/projects/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then(setProject)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const router = useRouter();
    const { updateProjectInList, removeProjectFromList } = useProjects();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const saveProject = useCallback(
        (patch: Partial<Project>) => {
            if (!id) return;
            setSaving(true);
            fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            })
                .then((r) => r.json())
                .then((data) => {
                    setProject((prev) => (prev ? { ...prev, ...data } : data));
                    setLastSaved(new Date());
                    updateProjectInList(id, {
                        name: data.name,
                        updatedAt: data.updatedAt,
                        logoUrl: data.logoUrl ?? undefined,
                        folderId: data.folderId ?? undefined,
                    });
                })
                .catch(() => {})
                .finally(() => {
                    setSaving(false);
                    pendingRef.current = null;
                });
        },
        [id, updateProjectInList],
    );

    const debouncedSave = useDebouncedCallback((patch: Partial<Project>) => {
        saveProject(patch);
    }, 600);

    const updateProject = useCallback(
        (patch: Partial<Project>) => {
            setProject((prev) => (prev ? { ...prev, ...patch } : null));
            pendingRef.current = { ...pendingRef.current, ...patch };
            debouncedSave({ ...pendingRef.current });
        },
        [debouncedSave],
    );

    const handleDeleteProject = useCallback(() => {
        if (!id) return;
        fetch(`/api/projects/${id}`, { method: 'DELETE' })
            .then((r) => {
                if (r.status === 204 || r.ok) {
                    removeProjectFromList(id);
                    router.push('/projects');
                }
            })
            .finally(() => setDeleteConfirmOpen(false));
    }, [id, removeProjectFromList, router]);

    const handleShorten = useCallback(() => {
        if (!project?.originalUrl?.trim()) return;
        fetch('/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl: project.originalUrl }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data?.shortUrl) {
                    updateProject({
                        shortUrl: data.shortUrl,
                        shortenEnabled: true,
                        recipeJson: (() => {
                            try {
                                const recipe = JSON.parse(project.recipeJson || '{}') as RecipeOptions;
                                recipe.data = data.shortUrl;
                                return JSON.stringify(recipe);
                            } catch {
                                return JSON.stringify({ ...project, data: data.shortUrl });
                            }
                        })(),
                    });
                }
            })
            .catch(() => {});
    }, [project, updateProject]);

    const handleLogoUpload = useCallback(
        (files: File[]) => {
            const file = files[0];
            if (!file || !id) return;
            const form = new FormData();
            form.append('file', file);
            fetch('/api/uploads/logo', {
                method: 'POST',
                body: form,
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data?.filename) {
                        updateProject({
                            logoFilename: data.filename,
                            logoUrl: `/api/uploads/${data.filename}`,
                        });
                    }
                })
                .catch(() => {});
        },
        [id, updateProject],
    );

    const setContentType = useCallback(
        (type: ContentType) => {
            if (!project) return;
            setContentTouched(false);
            try {
                const r = JSON.parse(project.recipeJson || '{}') as RecipeOptions;
                r.contentType = type;
                const patch: Partial<Project> = { recipeJson: JSON.stringify(r) };
                if (type !== 'url' && (project.shortenEnabled || project.shortUrl)) {
                    patch.shortenEnabled = false;
                    patch.shortUrl = null;
                    r.data = (project.originalUrl ?? '') || undefined;
                }
                updateProject(patch);
            } catch {
                updateProject({});
            }
        },
        [project, updateProject],
    );

    const setContent = useCallback(
        (value: string) => {
            if (!project) return;
            const content = project.originalUrl ?? '';
            let recipe: RecipeOptions = {};
            try {
                recipe = JSON.parse(project.recipeJson || '{}') as RecipeOptions;
            } catch {
                recipe = {};
            }
            const contentType = inferContentType(content, recipe.contentType);
            try {
                const r = JSON.parse(project.recipeJson || '{}') as RecipeOptions;
                r.contentType = contentType;
                if (contentType === 'url' && project.shortenEnabled && project.shortUrl) {
                    r.data = project.shortUrl;
                } else {
                    r.data = value || undefined;
                }
                const patch: Partial<Project> = {
                    originalUrl: value,
                    recipeJson: JSON.stringify(r),
                };
                if (contentType !== 'url' && (project.shortenEnabled || project.shortUrl)) {
                    patch.shortenEnabled = false;
                    patch.shortUrl = null;
                    r.data = value || undefined;
                }
                updateProject(patch);
            } catch {
                updateProject({
                    originalUrl: value,
                    ...(contentType !== 'url' && {
                        shortenEnabled: false,
                        shortUrl: null,
                    }),
                });
            }
        },
        [project, updateProject],
    );

    if (loading) {
        return (
            <Center className={classes.center}>
                <Loader size="sm" />
            </Center>
        );
    }
    if (error || !project) {
        return (
            <Alert color="red" title="Error">
                {error ?? 'Project not found'}
            </Alert>
        );
    }

    let recipe: RecipeOptions = {};
    try {
        recipe = JSON.parse(project.recipeJson || '{}') as RecipeOptions;
    } catch {
        recipe = {};
    }
    const content = project.originalUrl ?? '';
    const contentType = inferContentType(content, recipe.contentType);
    const typeConfig = CONTENT_TYPES.find((t) => t.value === contentType) ?? CONTENT_TYPES[0];
    const contentError = contentTouched ? typeConfig.validate(content) : null;
    const isUrl = contentType === 'url';
    const qrData =
        isUrl && project.shortenEnabled && project.shortUrl
            ? project.shortUrl
            : content || ' ';

    return (
        <div className={classes.root}>
            <div className={classes.editor}>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                            {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
                        </Text>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => setDeleteConfirmOpen(true)}
                            aria-label="Delete project"
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                    <TextInput
                        label="Project name"
                        placeholder="Untitled QR"
                        value={project.name}
                        onChange={(e) => updateProject({ name: e.target.value })}
                    />
                    <Text size="sm" fw={500}>
                        Content type
                    </Text>
                    <SegmentedControl
                        value={contentType}
                        onChange={(v) => setContentType(v as ContentType)}
                        data={CONTENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                        fullWidth
                    />
                    <TextInput
                        label={typeConfig.inputLabel}
                        placeholder={typeConfig.placeholder}
                        description={
                            contentType === 'url'
                                ? 'QR will open this link when scanned.'
                                : contentType === 'email'
                                  ? 'QR can open mailto: when scanned.'
                                  : contentType === 'phone'
                                    ? 'QR can start a call when scanned.'
                                    : undefined
                        }
                        value={project.originalUrl}
                        error={contentError}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={() => setContentTouched(true)}
                    />
                    {isUrl && (
                        <>
                            <Group>
                                <Switch
                                    label="Shorten with Kutt"
                                    checked={project.shortenEnabled}
                                    onChange={(e) => {
                                        const checked = e.currentTarget.checked;
                                        updateProject({ shortenEnabled: checked });
                                        if (checked && project.originalUrl) handleShorten();
                                    }}
                                />
                            </Group>
                            {project.shortenEnabled && project.shortUrl && (
                                <Text size="sm" c="dimmed">
                                    Short URL: {project.shortUrl}
                                </Text>
                            )}
                        </>
                    )}
                    <Divider label="Logo" />
                    <Dropzone
                        onDrop={handleLogoUpload}
                        accept={IMAGE_MIME_TYPE}
                        maxFiles={1}
                        maxSize={10 * 1024 * 1024}
                    >
                        <Text size="sm" c="dimmed" ta="center">
                            Drop logo image here (PNG, WebP, SVG, etc.)
                        </Text>
                    </Dropzone>
                    <Group grow>
                        <NumberInput
                            label="Logo size"
                            description="0.1–0.6"
                            min={0.1}
                            max={0.6}
                            step={0.05}
                            value={recipe.imageOptions?.imageSize ?? 0.4}
                            onChange={(n) => {
                                const r = { ...recipe };
                                const v = typeof n === 'string' ? parseFloat(n) : n;
                                r.imageOptions = {
                                    ...r.imageOptions,
                                    imageSize: Number.isFinite(v) ? Math.max(0.1, Math.min(0.6, v)) : 0.4,
                                };
                                updateProject({ recipeJson: JSON.stringify(r) });
                            }}
                        />
                        <Switch
                            label="Hide dots behind logo"
                            checked={recipe.imageOptions?.hideBackgroundDots ?? true}
                            onChange={(e) => {
                                const r = { ...recipe };
                                r.imageOptions = {
                                    ...r.imageOptions,
                                    hideBackgroundDots: e.currentTarget.checked,
                                };
                                updateProject({ recipeJson: JSON.stringify(r) });
                            }}
                        />
                    </Group>
                    <Divider label="QR style" />
                    <Text size="sm" fw={500}>
                        Foreground
                    </Text>
                    <SegmentedControl
                        value={recipe.dotsOptions?.gradient ? 'gradient' : 'solid'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            if (v === 'gradient') {
                                const g = makeGradient(
                                    'linear',
                                    recipe.dotsOptions?.color ?? '#000000',
                                    '#444444',
                                    0,
                                );
                                r.dotsOptions = { ...r.dotsOptions, gradient: g, color: undefined };
                                r.cornersSquareOptions = { ...r.cornersSquareOptions, gradient: g, color: undefined };
                                r.cornersDotOptions = { ...r.cornersDotOptions, gradient: g, color: undefined };
                            } else {
                                r.dotsOptions = { ...r.dotsOptions, gradient: undefined, color: recipe.dotsOptions?.color ?? '#000000' };
                                r.cornersSquareOptions = { ...r.cornersSquareOptions, gradient: undefined, color: recipe.cornersSquareOptions?.color ?? '#000000' };
                                r.cornersDotOptions = { ...r.cornersDotOptions, gradient: undefined, color: recipe.cornersSquareOptions?.color ?? '#000000' };
                            }
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                        data={[
                            { value: 'solid', label: 'Solid' },
                            { value: 'gradient', label: 'Gradient' },
                        ]}
                        fullWidth
                    />
                    {recipe.dotsOptions?.gradient ? (
                        <Stack gap="xs">
                            <Group grow>
                                <Select
                                    label="Gradient type"
                                    data={[
                                        { value: 'linear', label: 'Linear' },
                                        { value: 'radial', label: 'Radial' },
                                    ]}
                                    value={recipe.dotsOptions.gradient.type}
                                    onChange={(v) => {
                                        const r = { ...recipe };
                                        const g: QrGradient = {
                                            ...recipe.dotsOptions!.gradient!,
                                            type: (v as 'linear' | 'radial') ?? 'linear',
                                        };
                                        r.dotsOptions = { ...r.dotsOptions, gradient: g };
                                        r.cornersSquareOptions = { ...r.cornersSquareOptions, gradient: g };
                                        r.cornersDotOptions = { ...r.cornersDotOptions, gradient: g };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                                <NumberInput
                                    label="Rotation (°)"
                                    min={0}
                                    max={360}
                                    value={recipe.dotsOptions.gradient.rotation ?? 0}
                                    onChange={(n) => {
                                        const r = { ...recipe };
                                        const g: QrGradient = {
                                            ...recipe.dotsOptions!.gradient!,
                                            rotation: typeof n === 'string' ? parseInt(n, 10) || 0 : n ?? 0,
                                        };
                                        r.dotsOptions = { ...r.dotsOptions, gradient: g };
                                        r.cornersSquareOptions = { ...r.cornersSquareOptions, gradient: g };
                                        r.cornersDotOptions = { ...r.cornersDotOptions, gradient: g };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                            </Group>
                            <Group grow>
                                <ColorInput
                                    label="Start color"
                                    value={recipe.dotsOptions.gradient.colorStops[0]?.color ?? '#000000'}
                                    onChange={(c) => {
                                        const r = { ...recipe };
                                        const stops = [...(recipe.dotsOptions!.gradient!.colorStops || [])];
                                        if (stops[0]) stops[0] = { ...stops[0], color: c };
                                        else stops.unshift({ offset: 0, color: c });
                                        const g: QrGradient = { ...recipe.dotsOptions!.gradient!, colorStops: stops };
                                        r.dotsOptions = { ...r.dotsOptions, gradient: g };
                                        r.cornersSquareOptions = { ...r.cornersSquareOptions, gradient: g };
                                        r.cornersDotOptions = { ...r.cornersDotOptions, gradient: g };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                                <ColorInput
                                    label="End color"
                                    value={recipe.dotsOptions.gradient.colorStops[1]?.color ?? recipe.dotsOptions.gradient.colorStops[0]?.color ?? '#444444'}
                                    onChange={(c) => {
                                        const r = { ...recipe };
                                        const stops = [...(recipe.dotsOptions!.gradient!.colorStops || [])];
                                        if (stops[1]) stops[1] = { ...stops[1], color: c };
                                        else stops.push({ offset: 1, color: c });
                                        const g: QrGradient = { ...recipe.dotsOptions!.gradient!, colorStops: stops };
                                        r.dotsOptions = { ...r.dotsOptions, gradient: g };
                                        r.cornersSquareOptions = { ...r.cornersSquareOptions, gradient: g };
                                        r.cornersDotOptions = { ...r.cornersDotOptions, gradient: g };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                            </Group>
                        </Stack>
                    ) : (
                        <ColorInput
                            label="Foreground color"
                            value={recipe.dotsOptions?.color ?? '#000000'}
                            onChange={(c) => {
                                const r = { ...recipe };
                                r.dotsOptions = { ...r.dotsOptions, color: c };
                                r.cornersSquareOptions = { ...r.cornersSquareOptions, color: c };
                                r.cornersDotOptions = { ...r.cornersDotOptions, color: c };
                                updateProject({ recipeJson: JSON.stringify(r) });
                            }}
                        />
                    )}
                    <Text size="sm" fw={500}>
                        Background
                    </Text>
                    <SegmentedControl
                        value={recipe.backgroundOptions?.gradient ? 'gradient' : 'solid'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            if (v === 'gradient') {
                                r.backgroundOptions = {
                                    ...r.backgroundOptions,
                                    gradient: makeGradient(
                                        'linear',
                                        recipe.backgroundOptions?.color ?? '#ffffff',
                                        '#e0e0e0',
                                        0,
                                    ),
                                    color: undefined,
                                };
                            } else {
                                r.backgroundOptions = {
                                    ...r.backgroundOptions,
                                    gradient: undefined,
                                    color: recipe.backgroundOptions?.color ?? '#ffffff',
                                };
                            }
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                        data={[
                            { value: 'solid', label: 'Solid' },
                            { value: 'gradient', label: 'Gradient' },
                        ]}
                        fullWidth
                    />
                    {recipe.backgroundOptions?.gradient ? (
                        <Stack gap="xs">
                            <Group grow>
                                <Select
                                    label="Gradient type"
                                    data={[
                                        { value: 'linear', label: 'Linear' },
                                        { value: 'radial', label: 'Radial' },
                                    ]}
                                    value={recipe.backgroundOptions.gradient.type}
                                    onChange={(v) => {
                                        const r = { ...recipe };
                                        r.backgroundOptions = {
                                            ...r.backgroundOptions,
                                            gradient: {
                                                ...recipe.backgroundOptions!.gradient!,
                                                type: (v as 'linear' | 'radial') ?? 'linear',
                                            },
                                        };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                                <NumberInput
                                    label="Rotation (°)"
                                    min={0}
                                    max={360}
                                    value={recipe.backgroundOptions.gradient.rotation ?? 0}
                                    onChange={(n) => {
                                        const r = { ...recipe };
                                        r.backgroundOptions = {
                                            ...r.backgroundOptions,
                                            gradient: {
                                                ...recipe.backgroundOptions!.gradient!,
                                                rotation: typeof n === 'string' ? parseInt(n, 10) || 0 : n ?? 0,
                                            },
                                        };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                            </Group>
                            <Group grow>
                                <ColorInput
                                    label="Start color"
                                    value={recipe.backgroundOptions.gradient.colorStops[0]?.color ?? '#ffffff'}
                                    onChange={(c) => {
                                        const r = { ...recipe };
                                        const stops = [...(recipe.backgroundOptions!.gradient!.colorStops || [])];
                                        if (stops[0]) stops[0] = { ...stops[0], color: c };
                                        else stops.unshift({ offset: 0, color: c });
                                        r.backgroundOptions = {
                                            ...r.backgroundOptions,
                                            gradient: { ...recipe.backgroundOptions!.gradient!, colorStops: stops },
                                        };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                                <ColorInput
                                    label="End color"
                                    value={recipe.backgroundOptions.gradient.colorStops[1]?.color ?? recipe.backgroundOptions.gradient.colorStops[0]?.color ?? '#e0e0e0'}
                                    onChange={(c) => {
                                        const r = { ...recipe };
                                        const stops = [...(recipe.backgroundOptions!.gradient!.colorStops || [])];
                                        if (stops[1]) stops[1] = { ...stops[1], color: c };
                                        else stops.push({ offset: 1, color: c });
                                        r.backgroundOptions = {
                                            ...r.backgroundOptions,
                                            gradient: { ...recipe.backgroundOptions!.gradient!, colorStops: stops },
                                        };
                                        updateProject({ recipeJson: JSON.stringify(r) });
                                    }}
                                />
                            </Group>
                        </Stack>
                    ) : (
                        <ColorInput
                            label="Background color"
                            value={recipe.backgroundOptions?.color ?? '#ffffff'}
                            onChange={(c) => {
                                const r = { ...recipe };
                                r.backgroundOptions = { ...r.backgroundOptions, color: c };
                                updateProject({ recipeJson: JSON.stringify(r) });
                            }}
                        />
                    )}
                    <Select
                        label="Dot style"
                        data={DOT_TYPES}
                        value={recipe.dotsOptions?.type ?? 'square'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            r.dotsOptions = { ...r.dotsOptions, type: v ?? 'square' };
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                    />
                    <Switch
                        label="Round dot size"
                        checked={recipe.dotsOptions?.roundSize ?? false}
                        onChange={(e) => {
                            const r = { ...recipe };
                            r.dotsOptions = { ...r.dotsOptions, roundSize: e.currentTarget.checked };
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                    />
                    <Select
                        label="Corner style"
                        data={CORNER_TYPES}
                        value={recipe.cornersSquareOptions?.type ?? 'square'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            r.cornersSquareOptions = { ...r.cornersSquareOptions, type: v ?? 'square' };
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                    />
                    <Select
                        label="Corner dot style"
                        data={CORNER_TYPES}
                        value={recipe.cornersDotOptions?.type ?? recipe.cornersSquareOptions?.type ?? 'square'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            r.cornersDotOptions = { ...r.cornersDotOptions, type: v ?? 'square' };
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                    />
                    <Select
                        label="Shape"
                        data={[
                            { value: 'square', label: 'Square' },
                            { value: 'circle', label: 'Circle' },
                        ]}
                        value={recipe.shape ?? 'square'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            r.shape = (v as 'square' | 'circle') ?? 'square';
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                    />
                    <Group grow>
                        <NumberInput
                            label="Margin"
                            min={0}
                            max={50}
                            value={recipe.margin ?? 0}
                            onChange={(n) => {
                                const r = { ...recipe };
                                r.margin = typeof n === 'string' ? parseInt(n, 10) || 0 : n ?? 0;
                                updateProject({ recipeJson: JSON.stringify(r) });
                            }}
                        />
                        <NumberInput
                            label="Background round"
                            min={0}
                            max={100}
                            value={recipe.backgroundOptions?.round ?? 0}
                            onChange={(n) => {
                                const r = { ...recipe };
                                r.backgroundOptions = {
                                    ...r.backgroundOptions,
                                    round: typeof n === 'string' ? parseInt(n, 10) || 0 : n ?? 0,
                                };
                                updateProject({ recipeJson: JSON.stringify(r) });
                            }}
                        />
                    </Group>
                    <Select
                        label="Error correction"
                        data={ERROR_LEVELS}
                        value={recipe.qrOptions?.errorCorrectionLevel ?? 'M'}
                        onChange={(v) => {
                            const r = { ...recipe };
                            r.qrOptions = { ...r.qrOptions, errorCorrectionLevel: v ?? 'M' };
                            updateProject({ recipeJson: JSON.stringify(r) });
                        }}
                    />
                </Stack>
            </div>
            <div className={classes.preview}>
                <Paper p="md" withBorder className={classes.paper}>
                    <Text size="sm" fw={500} mb="sm">
                        Preview
                    </Text>
                    <QrPreview
                        data={qrData}
                        recipe={recipe}
                        logoUrl={project.logoUrl ?? undefined}
                    />
                </Paper>
                <ExportPanel
                    data={qrData}
                    recipe={recipe}
                    logoUrl={project.logoUrl}
                    projectName={project.name}
                />
            </div>
            <Modal
                opened={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                title="Delete project?"
                centered
            >
                <Text size="sm" c="dimmed" mb="md">
                    This cannot be undone. The project &quot;{project.name || 'Untitled QR'}&quot; will be
                    permanently deleted.
                </Text>
                <Group justify="flex-end" gap="xs">
                    <Button variant="subtle" onClick={() => setDeleteConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDeleteProject}>
                        Delete project
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}

