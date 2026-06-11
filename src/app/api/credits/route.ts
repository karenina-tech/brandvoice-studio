import { NextRequest, NextResponse } from 'next/server';
import { checkUserCredits } from '@/services/db-service';
import { isErr } from '@/lib/result';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const result = await checkUserCredits(ip);
  if (isErr(result)) {
    return NextResponse.json({ credits: 0 }, { status: 200 });
  }
  return NextResponse.json({ credits: result[1].credits }, { status: 200 });
}
