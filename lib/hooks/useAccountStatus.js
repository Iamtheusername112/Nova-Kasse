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
          // If column doesn't exist, treat as not blocked
          if (
            error.code === "42703" ||
            error.message?.includes("column") ||
            error.message?.includes("does not exist")
          ) {
            setIsBlocked(false);
          } else {
            console.error("Error checking blocked status:", error);
            setIsBlocked(false); // Default to not blocked on error
          }
        } else {
          setIsBlocked(profile?.is_blocked === true);
        }
      } catch (error) {
        console.error("Unexpected error checking blocked status:", error);
        setIsBlocked(false);
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
          setIsBlocked(payload.new.is_blocked === true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { isBlocked, loading };
}

