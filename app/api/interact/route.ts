import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    const { user_id, target_id, target_type, interaction_type } = await req.json();

    // Idempotency check handled by unique constraint in DB (user_id, target_id, target_type).
    // However, we want to toggle or update. 
    // If exists:
    //   If same type: remove (toggle off) -> decrement score
    //   If diff type: update -> apply diff to score (e.g. up to down = -2)

    // Custom logic needed. 
    // Simplified for this phase: Try insert, if conflict do nothing or handle error.
    // Requirement: "Ensure a user can toggle votes".

    // 1. Check existing interaction
    const { data: existing } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', user_id)
        .eq('target_id', target_id)
        .eq('target_type', target_type)
        .single();

    let scoreDelta = 0;
    if (interaction_type === 'VOTE_UP') scoreDelta = 1;
    if (interaction_type === 'VOTE_DOWN') scoreDelta = -1;
    // HEART doesn't affect score? Constraint says "Topic.score... VOTE_UP, VOTE_DOWN, HEART". 
    // Maybe HEART is just a like. Let's assume HEART = 0 score change or handled separately.
    // Plan says "Weighted Ranking... V_net". So UP/DOWN affects it.

    if (existing) {
        if (existing.interaction_type === interaction_type) {
            // Toggle off
            await supabase.from('interactions').delete().eq('id', existing.id);
            scoreDelta = -scoreDelta; // Reverse the effect
        } else {
            // Switch vote (e.g. UP to DOWN)
            // If old was UP (+1), new is DOWN (-1), delta is -2.
            // If old was DOWN (-1), new is UP (+1), delta is +2.
            await supabase
                .from('interactions')
                .update({ interaction_type })
                .eq('id', existing.id);

            if (existing.interaction_type === 'VOTE_UP' && interaction_type === 'VOTE_DOWN') scoreDelta = -2;
            if (existing.interaction_type === 'VOTE_DOWN' && interaction_type === 'VOTE_UP') scoreDelta = 2;
        }
    } else {
        // New vote
        await supabase.from('interactions').insert({
            user_id,
            target_id,
            target_type,
            interaction_type
        });
    }

    // Atomic update using RPC
    if (scoreDelta !== 0) {
        const rpcName = target_type === 'TOPIC' ? 'update_topic_score' : 'update_comment_score';
        const paramName = target_type === 'TOPIC' ? 'topic_id' : 'comment_id';

        await supabase.rpc(rpcName, {
            [paramName]: target_id,
            score_delta: scoreDelta
        });
    }

    return NextResponse.json({ success: true, delta: scoreDelta });
}
