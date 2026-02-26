import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ 
    result: "This is a mock AI response. The backend logic for AI chat has been removed and needs to be reimplemented with your new backend." 
  });
}
