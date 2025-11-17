import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to fetch and manage user notifications
 */
export function useNotifications(limit = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (fetchError) {
          console.error("Error fetching notifications:", fetchError);
          setError(fetchError.message);
        } else {
          setNotifications(data || []);
          const unread = (data || []).filter((n) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Notification fetch exception:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Notification change detected:", payload);
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new, ...prev].slice(0, limit));
            setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            );
            if (payload.new.read !== payload.old.read) {
              setUnreadCount((prev) => (payload.new.read ? prev - 1 : prev + 1));
            }
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
            if (!payload.old.read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error marking notification as read:", updateError);
      }
    } catch (err) {
      console.error("Mark as read exception:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (updateError) {
        console.error("Error marking all as read:", updateError);
      }
    } catch (err) {
      console.error("Mark all as read exception:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting notification:", deleteError);
      }
    } catch (err) {
      console.error("Delete notification exception:", err);
    }
  };

  const refetch = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setNotifications(data || []);
        const unread = (data || []).filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Notification refetch exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}

