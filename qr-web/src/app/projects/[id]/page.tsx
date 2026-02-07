import { Editor } from '@/components/Editor';

export default async function ProjectEditorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <Editor id={id} />;
}
