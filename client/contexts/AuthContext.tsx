import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole, AuthState } from "@shared/types";
import { authApi, getAuthToken } from "@/lib/api";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Real login function using API
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("AuthContext: Starting login for", email);
      const response = await authApi.login(email, password);
      console.log("AuthContext: Login response received", response);

      if (response.user && response.token) {
        console.log("AuthContext: Valid response, creating user object");
        // Transform API user to match frontend User type
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          role: response.user.role as UserRole,
          status: response.user.isActive ? "active" : "pending",
          createdAt: response.user.createdAt,
          lastLogin: new Date().toISOString(),
          avatar: response.user.avatar || undefined,
          hasCompletedOnboarding: response.user.hasCompletedOnboarding || false,
        };

        console.log("AuthContext: Setting auth state");
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Store user data for routing decisions
        localStorage.setItem("auth_user", JSON.stringify(user));

        return true;
      }
      console.log("AuthContext: Invalid response structure");
      return false;
    } catch (error) {
      console.error("AuthContext Login error:", error);
      console.error("AuthContext Error type:", typeof error);
      console.error(
        "AuthContext Error message:",
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  };

  const logout = () => {
    authApi.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (authState.user) {
        const response = await authApi.updateProfile(userData);

        if (response.user) {
          const updatedUser: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            role: response.user.role as UserRole,
            status: response.user.isActive ? "active" : "pending",
            createdAt: response.user.createdAt,
            lastLogin: authState.user.lastLogin,
            avatar: response.user.avatar || undefined,
            hasCompletedOnboarding: response.user.hasCompletedOnboarding || false,
          };

          setAuthState((prev) => ({
            ...prev,
            user: updatedUser,
          }));
        }
      }
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  // Initialize auth state - check for stored token and get current user
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();

      if (token) {
        try {
          const response = await authApi.getCurrentUser();

          if (response.user) {
            const user: User = {
              id: response.user.id,
              email: response.user.email,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              role: response.user.role as UserRole,
              status: response.user.isActive ? "active" : "pending",
              createdAt: response.user.createdAt,
              lastLogin: new Date().toISOString(),
              avatar: response.user.avatar || undefined,
              hasCompletedOnboarding: response.user.hasCompletedOnboarding || false,
            };

            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Invalid token, clear it
            authApi.logout();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Invalid token, clear it
          authApi.logout();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
