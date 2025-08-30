import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ConditionalRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  allowedRoles?: string[];
}

export default function ConditionalRoute({ 
  children, 
  requireAuth = false,
  requireOnboarding = false,
  allowedRoles = []
}: ConditionalRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, check role-based access
  if (isAuthenticated && user && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      const roleRedirects = {
        admin: "/admin",
        doctor: "/doctor",
        client: "/dashboard"
      };
      return <Navigate to={roleRedirects[user.role] || "/dashboard"} replace />;
    }
  }

  // If user is authenticated and onboarding is required, check completion status
  if (isAuthenticated && user && requireOnboarding) {
    if (!user.hasCompletedOnboarding) {
      // Redirect to appropriate onboarding based on role
      const onboardingRedirects = {
        client: "/onboarding",
        doctor: "/doctor/onboarding"
      };
      return <Navigate to={onboardingRedirects[user.role] || "/onboarding"} replace />;
    }
  }

  // If user is authenticated and has completed onboarding but accessing onboarding page, redirect to dashboard
  if (isAuthenticated && user && user.hasCompletedOnboarding) {
    const currentPath = window.location.pathname;
    if (currentPath === "/onboarding" || currentPath === "/doctor/onboarding") {
      const dashboardRedirects = {
        admin: "/admin",
        doctor: "/doctor",
        client: "/dashboard"
      };
      return <Navigate to={dashboardRedirects[user.role] || "/dashboard"} replace />;
    }
  }

  return <>{children}</>;
}
