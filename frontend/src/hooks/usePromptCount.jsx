import { useState, useEffect } from 'react';
import { Supabase } from '../lib/Supabase';

/**
 * Custom hook to fetch prompt count from Supabase
 * - For guests: fetches from guest_tracking table by fingerprint
 * - For logged-in users: fetches from user_stats table by user_id
 */
export const usePromptCount = (fingerprint, userId, session, manualEmail) => {
  const [promptCount, setPromptCount] = useState(0);
  const [maxPrompts, setMaxPrompts] = useState(5); // Default for guests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrievedUserId, setRetrievedUserId] = useState(null);

  const fetchPromptCount = async () => {
    if (!fingerprint && !userId && !manualEmail) {
      console.log('[usePromptCount] No identity found yet, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Logged-in user: fetch from user_stats (Highest Priority)
      if (session && userId) {
        console.log('[usePromptCount] Fetching for logged-in user:', userId);
        setMaxPrompts(8);
        setRetrievedUserId(userId);

        const { data, error: supabaseError } = await Supabase
          .from('user_stats')
          .select('prompt_count')
          .eq('user_id', userId)
          .maybeSingle();

        if (supabaseError) throw supabaseError;
        setPromptCount(data?.prompt_count || 0);
      } 
      // 2. Manual Email user: fetch from user_stats by email (Medium Priority)
      else if (manualEmail) {
         console.log('[usePromptCount] Fetching for manual email:', manualEmail);
         setMaxPrompts(8); // Upgrade limit for email users
         
         const { data, error: supabaseError } = await Supabase
          .from('user_stats')
          .select('prompt_count, user_id')
          .eq('email', manualEmail)
          .maybeSingle();
         
         if (supabaseError) throw supabaseError;
         
         if (data) {
             setPromptCount(data.prompt_count || 0);
             if (data.user_id) setRetrievedUserId(data.user_id);
         } else {
             // If manual email provided but not in DB yet (edge case, usually N8N creates it, but maybe latency)
             // We might want to default to 0.
             setPromptCount(0);
         }
      }
      // 3. Guest user: fetch from guest_tracking (Lowest Priority)
      else if (fingerprint) {
        console.log('[usePromptCount] Fetching for guest with fingerprint:', fingerprint);
        setMaxPrompts(5);
        setRetrievedUserId(null);

        const { data, error: supabaseError } = await Supabase
          .from('guest_tracking')
          .select('prompt_count')
          .eq('fingerprint_id', fingerprint)
          .maybeSingle();

        if (supabaseError) throw supabaseError;
        setPromptCount(data?.prompt_count || 0);
      }
    } catch (err) {
      console.error('[usePromptCount] Error fetching prompt count:', err);
      setError(err.message);
      setPromptCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchPromptCount();

    // Set up real-time subscription
    let subscription = null;

    const targetUserId = userId || retrievedUserId;

    if ((session && targetUserId) || (manualEmail && targetUserId)) {
      // Subscribe to user_stats changes for established users
      console.log('[usePromptCount] Setting up real-time subscription for user:', targetUserId);
      subscription = Supabase
        .channel(`user_stats_${targetUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_stats',
            filter: `user_id=eq.${targetUserId}`
          },
          (payload) => {
            console.log('[usePromptCount] Real-time update received:', payload);
            if (payload.new?.prompt_count !== undefined) {
              setPromptCount(payload.new.prompt_count);
            }
          }
        )
        .subscribe();
    } else if (manualEmail && !targetUserId) {
        // Subscribe to user_stats creation for this email (Race condition handling)
        console.log('[usePromptCount] Watching for user creation via email:', manualEmail);
        subscription = Supabase
        .channel(`user_stats_creation_${manualEmail}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_stats',
            filter: `email=eq.${manualEmail}`
          },
          (payload) => {
            console.log('[usePromptCount] User created/found via Real-time:', payload);
            if (payload.new) {
                if (payload.new.prompt_count !== undefined) setPromptCount(payload.new.prompt_count);
                if (payload.new.user_id) setRetrievedUserId(payload.new.user_id);
            }
          }
        )
        .subscribe();
    } else if (fingerprint && !manualEmail) {
      // Subscribe to guest_tracking changes
      console.log('[usePromptCount] Setting up real-time subscription for fingerprint:', fingerprint);
      subscription = Supabase
        .channel(`guest_tracking_${fingerprint}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'guest_tracking',
            filter: `fingerprint_id=eq.${fingerprint}`
          },
          (payload) => {
            console.log('[usePromptCount] Real-time update received:', payload);
            if (payload.new?.prompt_count !== undefined) {
              setPromptCount(payload.new.prompt_count);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) Supabase.removeChannel(subscription);
    };
  }, [fingerprint, userId, session, manualEmail, retrievedUserId]); // Added retrievedUserId to dependencies

  return {
    promptCount,
    maxPrompts,
    loading,
    error,
    userId: retrievedUserId, // Return the resolve User ID
    refetchPromptCount: fetchPromptCount
  };
};
