import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Client-side Supabase client (for simple queries)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with cookie handling for auth
export function createSupabaseServerClient(context: {
  cookies: AstroCookies;
  request?: Request;
}) {
  const { cookies, request } = context;

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Parse cookies from request header
        const cookieHeader = request?.headers.get('cookie') || '';
        const allCookies: { name: string; value: string }[] = [];

        if (cookieHeader) {
          const pairs = cookieHeader.split(';');
          for (const pair of pairs) {
            const [name, ...valueParts] = pair.trim().split('=');
            if (name && valueParts.length > 0) {
              allCookies.push({
                name: name.trim(),
                value: valueParts.join('='),
              });
            }
          }
        }

        return allCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            path: options?.path || '/',
            maxAge: options?.maxAge,
            domain: options?.domain,
            secure: options?.secure,
            httpOnly: options?.httpOnly,
            sameSite: options?.sameSite as 'strict' | 'lax' | 'none' | undefined,
          });
        });
      },
    },
  });
}

// Check if user is whitelisted
export async function isUserWhitelisted(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_user_whitelisted', {
    user_email: email,
  });

  if (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }

  return data === true;
}

// Check if user is admin
export function isUserAdmin(email: string): boolean {
  const adminEmails = import.meta.env.ADMIN_EMAILS || '';
  const admins = adminEmails.split(',').map((e: string) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}
