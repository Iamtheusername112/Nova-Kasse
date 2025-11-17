import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to check if user account is blocked
 * Returns blocked status and loading state
 */
export function useAccountStatus() {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBlocked(false);
      setLoading(false);
      return;
    }

    const checkBlockedStatus = async () => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_blocked")
          .eq("id", user.id)
          .single();

        if (error) {
          // Handle different error cases gracefully
          const errorCode = error.code || error.statusCode;
          const errorMessage = error.message || String(error);
          
          // PGRST116 = No rows found (profile doesn't exist yet)
          if (errorCode === "PGRST116" || errorMessage?.includes("No rows")) {
            // Profile doesn't exist yet, default to not blocked
            setIsBlocked(false);
            return;
          }
          
          // Column doesn't exist (migration not run)
          if (
            errorCode === "42703" ||
            errorMessage?.includes("column") ||
            errorMessage?.includes("does not exist")
          ) {
            console.warn("is_blocked column may not exist. Run migration: lib/supabase/add-user-blocked-column.sql");
            setIsBlocked(false);
            return;
          }
          
          // Other errors - log with full details but default to not blocked
          console.warn("Error checking blocked status:", {
            code: errorCode,
            message: errorMessage,
            details: error.details,
            hint: error.hint,
            fullError: error
          });
          setIsBlocked(false); // Default to not blocked on error
        } else {
          // Successfully fetched profile
          setIsBlocked(profile?.is_blocked === true);
        }
      } catch (error) {
        // Unexpected error - log with full details
        console.warn("Unexpected error checking blocked status:", {
          message: error?.message || String(error),
          name: error?.name,
          stack: error?.stack,
          fullError: error
        });
        setIsBlocked(false); // Default to not blocked on unexpected error
      } finally {
        setLoading(false);
      }
    };

    checkBlockedStatus();

    // Subscribe to profile changes for real-time updates
    const subscription = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          try {
            // Safely check if is_blocked exists in the payload
            if (payload?.new && typeof payload.new.is_blocked === 'boolean') {
              setIsBlocked(payload.new.is_blocked === true);
            } else if (payload?.new) {
              // is_blocked might not exist in the column yet
              setIsBlocked(false);
            }
          } catch (err) {
            console.warn("Error processing real-time update:", err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed
        } else if (status === 'CHANNEL_ERROR') {
          console.warn("Error subscribing to profile changes");
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { isBlocked, loading };
}

