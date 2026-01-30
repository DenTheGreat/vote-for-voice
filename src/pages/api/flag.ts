import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  try {
    const formData = await request.formData();
    const voiceId = formData.get('voice_id')?.toString();

    if (!voiceId) {
      return new Response('Missing voice_id', { status: 400 });
    }

    const userEmail = locals.user?.email || 'anonymous';

    // Flag the voice message for removal
    const { error } = await supabase
      .from('voice_messages')
      .update({
        flagged_for_removal: true,
        flagged_at: new Date().toISOString(),
        flagged_by: userEmail
      })
      .eq('id', voiceId);

    if (error) {
      console.error('Error flagging voice:', error);
      return new Response('Failed to flag voice', { status: 500 });
    }

    // Redirect back to vote page
    return redirect('/vote', 303);
  } catch (error) {
    console.error('Error processing flag:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
