import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient, isUserWhitelisted, isUserAdmin } from './lib/supabase';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];

// Routes that require admin access
const adminRoutes = ['/admin', '/api/admin'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return next();
  }

  // Check authentication
  const supabase = createSupabaseServerClient({ cookies: context.cookies, request: context.request });
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    return context.redirect('/login');
  }

  // Check whitelist for protected routes
  if (user.email) {
    const whitelisted = await isUserWhitelisted(user.email);
    if (!whitelisted) {
      await supabase.auth.signOut();
      return context.redirect('/login?error=not_whitelisted');
    }

    // Check admin access for admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!isUserAdmin(user.email)) {
        return new Response('Unauthorized', { status: 403 });
      }
    }
  }

  // Store user in locals for use in pages
  context.locals.user = user;

  return next();
});
