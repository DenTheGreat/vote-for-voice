import type { APIRoute } from 'astro';
import { createSupabaseServerClient, isUserAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect, locals, cookies }) => {
  try {
    // Check if user is admin
    const userEmail = locals.user?.email;
    if (!userEmail || !isUserAdmin(userEmail)) {
      return new Response('Unauthorized', { status: 403 });
    }

    const formData = await request.formData();
    const voiceId = formData.get('voice_id')?.toString();

    if (!voiceId) {
      return new Response('Missing voice_id', { status: 400 });
    }

    const supabase = createSupabaseServerClient({ cookies, request });

    // Unflag the voice message
    const { error } = await supabase
      .from('voice_messages')
      .update({
        flagged_for_removal: false,
        flagged_at: null,
        flagged_by: null
      })
      .eq('id', voiceId);

    if (error) {
      console.error('Error unflagging voice:', error);
      return new Response('Failed to unflag voice', { status: 500 });
    }

    // Redirect back to review page
    return redirect('/admin/review', 303);
  } catch (error) {
    console.error('Error processing unflag:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
