const QR_API_URL = process.env.QR_API_URL || 'http://qr_api:8080';

function rewriteLogoUrl(items: Array<{ logoUrl?: string | null }>) {
    return items.map((item) => ({
        ...item,
        logoUrl: item.logoUrl?.replace(/^\/uploads\//, '/api/uploads/') ?? null,
    }));
}

export async function GET() {
    try {
        const res = await fetch(`${QR_API_URL}/projects`, {
            cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
            return Response.json(
                { error: data?.error ?? 'Failed' },
                { status: res.status },
            );
        }
        return Response.json(Array.isArray(data) ? rewriteLogoUrl(data) : data);
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 502 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const res = await fetch(`${QR_API_URL}/projects`, {
            method: 'POST',
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
