const QR_API_URL = process.env.QR_API_URL || 'http://qr_api:8080';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const res = await fetch(`${QR_API_URL}/folders/${id}`, {
            cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
            return Response.json(
                { error: data?.error ?? 'Not found' },
                { status: res.status },
            );
        }
        return Response.json(data);
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 502 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const res = await fetch(`${QR_API_URL}/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
            return Response.json(
                { error: data?.error ?? 'Failed' },
                { status: res.status },
            );
        }
        return Response.json(data);
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 502 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const res = await fetch(`${QR_API_URL}/folders/${id}`, {
            method: 'DELETE',
        });
        if (res.status === 204) {
            return new Response(null, { status: 204 });
        }
        const data = await res.json();
        return Response.json(
            { error: data?.error ?? 'Failed' },
            { status: res.status },
        );
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 502 });
    }
}
