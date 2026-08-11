import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfigEdge } from '@/lib/auth/edge';

const { auth } = NextAuth(authConfigEdge);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const isPublic =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/files') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/manifest.json') ||
    nextUrl.pathname.startsWith('/favicon');

  if (isPublic) {
    if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const url = new URL('/login', nextUrl);
    url.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
};
