import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // Handle errors gracefully - invalid refresh tokens should not break the app
  let user = null;
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();
    
    // If refresh token is invalid, treat user as unauthenticated
    // Supabase will handle cookie cleanup automatically
    if (error && (error.message?.includes('refresh_token_not_found') || error.code === 'refresh_token_not_found')) {
      // Silently treat as unauthenticated - no need to log or handle further
      user = null;
    } else if (!error) {
      user = authUser;
    }
  } catch (error: any) {
    // Silently handle any auth errors - user will be treated as unauthenticated
    // Don't log refresh token errors as they're expected when sessions expire
    if (!error?.message?.includes('refresh_token_not_found') && error?.code !== 'refresh_token_not_found') {
      // Only log unexpected errors
      console.error('Unexpected auth error in middleware:', error);
    }
    user = null;
  }

  // Allow public routes (landing page, auth pages, OAuth callback)
  const publicPaths = ['/', '/login', '/signup', '/auth/callback'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname) || 
                      request.nextUrl.pathname.startsWith('/auth/callback');
  
  if (isPublicPath) {
    // Redirect authenticated users away from auth pages to home
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    // Allow unauthenticated users to access public paths (including landing page)
    return supabaseResponse
  }

  // Protect all other routes - redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

