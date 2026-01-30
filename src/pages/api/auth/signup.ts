import type { APIRoute } from 'astro';
import { createSupabaseServerClient, isUserWhitelisted } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return redirect('/signup?error=Email and password required');
  }

  // Check whitelist first
  const whitelisted = await isUserWhitelisted(email);
  if (!whitelisted) {
    return redirect('/signup?error=This email is not authorized. Contact the administrator.');
  }

  const supabase = createSupabaseServerClient({ cookies, request });

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return redirect('/signup?error=' + encodeURIComponent(error.message));
  }

  // Redirect to login with success message
  return redirect('/login?message=Account created! You can now sign in.');
};
