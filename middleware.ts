import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from './lib/auth';

const publicPrefixes = ['/api/auth', '/api/templates/compile-preview'];
const publicRegexes = [/^\/api\/documents\/[^/]+\/pdf$/];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === '/') {
    return NextResponse.next();
  }

  for (const prefix of publicPrefixes) {
    if (path.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  for (const regex of publicRegexes) {
    if (regex.test(path)) {
      return NextResponse.next();
    }
  }

  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    if (path.startsWith('/api')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
