'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize client here or reuse from lib if safe for client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Need anon key for client side! 
// My previous lib/supabaseClient.ts used SERVICE_ROLE which is bad for client.
// I should have created a separate client for client-side or use anon key.
// I will assume NEXT_PUBLIC_SUPABASE_ANON_KEY is available.

const supabase = createClient(supabaseUrl, supabaseKey);

export function useRealtime(
    table: 'topics' | 'comments',
    filter: string | undefined,
    callback: (payload: any) => void
) {
    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table, filter: filter }, // filter example: 'topic_id=eq.uuid'
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, filter, callback]);
}
