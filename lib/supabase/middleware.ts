import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canManageOrders } from '@/lib/auth/roles';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes that require authentication
  const protectedRoutes = ['/profile', '/orders', '/my-orders', '/checkout'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Admin pages: require sign-in, and show the admin-only page to everyone else
  const isAdminRoute =
    request.nextUrl.pathname === '/admin' ||
    request.nextUrl.pathname.startsWith('/admin/');

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.search = '';
      url.searchParams.set('returnUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (!canManageOrders(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin-only';
      url.search = '';
      const response = NextResponse.rewrite(url, { status: 403 });
      supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
      return response;
    }
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/auth/signin', '/auth/signup'];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
