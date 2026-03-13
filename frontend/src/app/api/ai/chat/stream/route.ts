import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${BACKEND_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (networkError: any) {
      console.error('Cannot reach backend at', BACKEND_URL, networkError.message);
      return NextResponse.json(
        { error: `Cannot reach AI backend at ${BACKEND_URL}. Is the backend running?` },
        { status: 503 }
      );
    }

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: errorText || 'AI service error' },
        { status: backendResponse.status }
      );
    }

    // Proxy the SSE stream directly to the client
    return new Response(backendResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('AI chat stream proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to AI service' },
      { status: 500 }
    );
  }
}
