import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ success: true, message: "Admin user operation stub" });
}

export async function GET() {
    return NextResponse.json({ users: [] });
}
