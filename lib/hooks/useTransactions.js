import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to fetch and manage user transactions
 */
export function useTransactions(limit = 10) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (fetchError) {
          console.error("Error fetching transactions:", fetchError);
          setError(fetchError.message);
        } else {
          setTransactions(data || []);
        }
      } catch (err) {
        console.error("Transaction fetch exception:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Set up real-time subscription for new transactions
    const channel = supabase
      .channel(`transactions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Transaction change detected:", payload);
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => [payload.new, ...prev].slice(0, limit));
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  const refetch = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error("Transaction refetch exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, error, refetch };
}

