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
          console.log("Transaction change detected:", {
            eventType: payload.eventType,
            transactionId: payload.new?.id || payload.old?.id,
            created_at: payload.new?.created_at || payload.old?.created_at,
            user_id: payload.new?.user_id || payload.old?.user_id
          });
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => {
              // Check if transaction already exists (avoid duplicates)
              const exists = prev.some(t => t.id === payload.new.id);
              if (exists) {
                console.log("Transaction already in list, skipping insert");
                return prev;
              }
              
              // Insert transaction in correct chronological order (newest first)
              const newTransactions = [...prev, payload.new];
              // Sort by created_at descending (newest first)
              newTransactions.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA; // Descending order
              });
              console.log("Transactions after insert and sort:", {
                total: newTransactions.length,
                limit,
                firstTransaction: newTransactions[0]?.created_at,
                lastTransaction: newTransactions[newTransactions.length - 1]?.created_at
              });
              // Keep only the limit
              return newTransactions.slice(0, limit);
            });
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) => {
              const updated = prev.map((t) => (t.id === payload.new.id ? payload.new : t));
              // Re-sort after update in case created_at changed
              updated.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA; // Descending order
              });
              return updated;
            });
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

