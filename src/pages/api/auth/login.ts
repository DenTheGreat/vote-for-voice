import type { APIRoute } from 'astro';
import { createSupabaseServerClient, isUserWhitelisted } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return redirect('/login?error=Email and password required');
  }

  const supabase = createSupabaseServerClient({ cookies, request });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message));
  }

  // Check whitelist
  const whitelisted = await isUserWhitelisted(email);
  if (!whitelisted) {
    await supabase.auth.signOut();
    return redirect('/login?error=not_whitelisted');
  }

  return redirect('/vote');
};
