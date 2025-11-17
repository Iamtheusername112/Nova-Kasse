"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  CheckCircle2,
  X,
  Trash2,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Shield,
  Info,
  Gift,
  CheckCheck
} from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/loading-screen";

function NotificationsPageContent() {
  const router = useRouter();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'transaction':
      case 'transfer':
        return DollarSign;
      case 'deposit':
        return ArrowRight;
      case 'payment':
        return CreditCard;
      case 'security':
        return Shield;
      case 'promotion':
        return Gift;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'transaction':
      case 'transfer':
        return 'bg-blue-100 text-blue-600';
      case 'deposit':
        return 'bg-green-100 text-green-600';
      case 'payment':
        return 'bg-purple-100 text-purple-600';
      case 'security':
        return 'bg-red-100 text-red-600';
      case 'promotion':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
    toast.success("Notification marked as read");
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
    toast.success("Notification deleted");
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="Notifications" rightIcon={null} />
      
      <div className="px-4 py-6">
        {/* Header Actions */}
        {unreadCount > 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}

        {loading ? (
          <LoadingScreen message="Loading Notifications..." subMessage="Fetching your activity updates" />
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">No notifications</p>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">New</h3>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <Card
                        key={notification.id}
                        className="border-2 border-blue-200 bg-blue-50/50 shadow-md rounded-xl"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                                  <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                                  <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(notification.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Read Notifications */}
            {readNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">Earlier</h3>
                <div className="space-y-3">
                  {readNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <Card
                        key={notification.id}
                        className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl opacity-75"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0 opacity-60`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-700 mb-1">{notification.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                  <p className="text-xs text-gray-400">{formatDate(notification.created_at)}</p>
                                </div>
                                <button
                                  onClick={() => handleDelete(notification.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
}

