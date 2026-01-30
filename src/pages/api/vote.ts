import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const winnerId = formData.get('winner_id')?.toString();
    const loserId = formData.get('loser_id')?.toString();

    if (!winnerId || !loserId) {
      return new Response('Missing winner_id or loser_id', { status: 400 });
    }

    if (winnerId === loserId) {
      return new Response('Winner and loser cannot be the same', { status: 400 });
    }

    // Increment winner's vote count
    const { error: rpcError } = await supabase.rpc('increment_votes', {
      message_id: winnerId
    });

    // If the RPC doesn't exist, use update instead
    if (rpcError) {
      // Fallback: Fetch current votes and increment
      const { data: winnerMessage } = await supabase
        .from('voice_messages')
        .select('votes')
        .eq('id', winnerId)
        .single();

      if (winnerMessage) {
        await supabase
          .from('voice_messages')
          .update({ votes: winnerMessage.votes + 1 })
          .eq('id', winnerId);
      }
    }

    // Record the vote (for analytics)
    const voterEmail = locals.user?.email || null;
    await supabase.from('vote_records').insert({
      winner_id: winnerId,
      loser_id: loserId,
      voter_email: voterEmail
    });

    // Redirect back to vote page
    return redirect('/vote', 303);
  } catch (error) {
    console.error('Error processing vote:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
