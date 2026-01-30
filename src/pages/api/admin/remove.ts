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

    // Delete the voice message and get the audio filename
    const { data: audioFilename, error: deleteError } = await supabase.rpc(
      'delete_voice_message',
      { message_id: voiceId }
    );

    if (deleteError) {
      console.error('Error deleting voice from database:', deleteError);
      return new Response('Failed to delete voice from database', { status: 500 });
    }

    // If we got an audio filename, try to delete it from storage
    if (audioFilename) {
      const { error: storageError } = await supabase.storage
        .from('voices')
        .remove([audioFilename]);

      if (storageError) {
        // Log but don't fail - the DB record is already deleted
        console.error('Error deleting audio file from storage:', storageError);
      }
    }

    // Redirect back to review page
    return redirect('/admin/review', 303);
  } catch (error) {
    console.error('Error processing removal:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
