import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('AI chat proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to AI service' },
      { status: 500 }
    );
  }
}
