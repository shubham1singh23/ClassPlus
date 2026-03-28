import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_key"
);

/**
 * Subscribe to a session's realtime broadcast channel.
 *
 * @param {string} sessionId
 * @param {{
 *   onSignalUpdate?: (payload: any) => void,
 *   onQuestionClusters?: (payload: any) => void,
 *   onQuizPush?: (payload: any) => void,
 *   onQuizResponse?: (payload: any) => void,
 * }} handlers
 * @returns {() => void} cleanup function
 */
export function subscribeToSession(sessionId, handlers = {}) {
  const {
    onSignalUpdate,
    onQuestionClusters,
    onQuizPush,
    onQuizResponse,
  } = handlers;

  const channel = supabase
    .channel(`session:${sessionId}`)
    .on("broadcast", { event: "signal_update" }, ({ payload }) => {
      onSignalUpdate?.(payload);
    })
    .on("broadcast", { event: "question_clusters" }, ({ payload }) => {
      onQuestionClusters?.(payload);
    })
    .on("broadcast", { event: "quiz_pushed" }, ({ payload }) => {
      onQuizPush?.(payload);
    })
    .on("broadcast", { event: "quiz_response" }, ({ payload }) => {
      onQuizResponse?.(payload);
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[Realtime] Subscribed to session:${sessionId}`);
      }
      if (status === "CHANNEL_ERROR") {
        console.error(`[Realtime] Channel error for session:${sessionId}`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export default supabase;