import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next 16 file convention: `src/proxy.ts` (the old root `middleware.ts` was never picked up in a `src/` project).
export async function proxy(request: NextRequest) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Fail closed: an auth error must not open the app or the /api proxies.
  }
  if (session) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // Public: login, the dev showcase, Auth.js callbacks, Next assets and any file with an extension (sw.js, icons, manifest).
  matcher: ['/((?!login|dev/ui|api/auth|_next/static|_next/image|.*\\..*).*)'],
};
