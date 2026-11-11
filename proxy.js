import { NextResponse } from 'next/server';

const PREFIX_ROLE = { '/admin': 'admin', '/kader': 'kader', '/kepala-divisi': 'kepala_divisi' };

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('si_session')?.value;
  const role = request.cookies.get('si_role')?.value;

  if (!session) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  for (const [prefix, need] of Object.entries(PREFIX_ROLE)) {
    if (pathname.startsWith(prefix) && role && role !== need) {
      const home = need === 'admin' ? '/admin' : role === 'admin' ? '/admin' : role === 'kepala_divisi' ? '/kepala-divisi' : '/kader';
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/kader/:path*', '/kepala-divisi/:path*'],
};
