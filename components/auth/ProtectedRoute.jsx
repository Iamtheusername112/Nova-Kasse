"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/ui/loading-screen";
import { useMinimumLoadingTime } from "@/lib/hooks/useMinimumLoadingTime";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const displayLoading = useMinimumLoadingTime(loading, 3000);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (displayLoading) {
    return <LoadingScreen message="Authenticating..." subMessage="Please wait while we verify your session" />;
  }

  if (!user) {
    return null;
  }

  return children;
}

