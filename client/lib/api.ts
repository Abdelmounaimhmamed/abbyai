import { User, TherapySession } from "@shared/types";

// Use relative URL to leverage Vite's proxy configuration
const API_BASE_URL = "/api";

// Auth token management
let authToken: string | null = null;

// Initialize auth token from localStorage (if available)
if (typeof window !== "undefined" && window.localStorage) {
  authToken = localStorage.getItem("auth_token");
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== "undefined" && window.localStorage) {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }
};

export const getAuthToken = () => authToken;

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log("API Request:", url, config);

  try {
    const response = await fetch(url, config);
    console.log("API Response status:", response.status);

    // Read response text only once to avoid "body already used" error
    const responseText = await response.text();
    console.log("API Response text:", responseText);

    if (!response.ok) {
      let errorData;
      try {
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch {
            // If JSON parsing fails, use the text as error message
            errorData = { error: responseText };
          }
        } else {
          errorData = { error: `Network error - HTTP ${response.status}` };
        }
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = { error: `Network error - HTTP ${response.status}` };
      }

      console.error("API Error:", JSON.stringify(errorData, null, 2));
      const errorMessage =
        errorData.error || errorData.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // For successful responses, parse the already-read text as JSON
    try {
      if (responseText) {
        const data = JSON.parse(responseText);
        console.log("API Response data:", data);
        return data;
      } else {
        return { message: "Success" };
      }
    } catch (parseError) {
      console.error("Failed to parse success response as JSON:", parseError);
      return { message: responseText || "Success" };
    }
  } catch (error) {
    console.error("API Request failed:", error);
    // If it's a network error (fetch failed), provide a more helpful message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network connection failed. Please check your internet connection and try again.",
      );
    }
    throw error;
  }
};

// Authentication API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    dateOfBirth?: string;
  }) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    setAuthToken(null);
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me");
  },

  updateProfile: async (profileData: any) => {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  completeOnboarding: async (onboardingData: any) => {
    return apiRequest("/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(onboardingData),
    });
  },
};

// Client API
export const clientApi = {
  getDashboard: async () => {
    return apiRequest("/client/dashboard");
  },

  getSessions: async (filters?: { status?: string; type?: string }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/client/sessions?${params}`);
  },

  getDoctors: async () => {
    return apiRequest("/client/doctors");
  },

  requestSession: async (sessionData: {
    preferredDate: string;
    preferredTime: string;
    reason: string;
    doctorId?: string;
    sessionType?: string;
  }) => {
    return apiRequest("/client/sessions/request", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
  },

  startAISession: async (topic?: string) => {
    return apiRequest("/client/sessions/ai", {
      method: "POST",
      body: JSON.stringify({ topic }),
    });
  },

  sendAIMessage: async (
    sessionId: string,
    content: string,
    type: string = "text",
  ) => {
    return apiRequest(`/client/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, type }),
    });
  },

  completeSession: async (
    sessionId: string,
    data: {
      quizAnswers?: any[];
      quizScore?: number;
      rating?: number | null;
      feedback?: string;
      skipped?: boolean;
    },
  ) => {
    return apiRequest(`/client/sessions/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getProgress: async () => {
    return apiRequest("/client/progress");
  },

  getCertifications: async () => {
    return apiRequest("/client/certifications");
  },
};

// Doctor API
export const doctorApi = {
  getDashboard: async () => {
    return apiRequest("/doctor/dashboard");
  },

  getSessions: async (filters?: { status?: string; date?: string }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/doctor/sessions?${params}`);
  },

  startSession: async (sessionId: string) => {
    return apiRequest(`/doctor/sessions/${sessionId}/start`, {
      method: "POST",
    });
  },

  completeSession: async (
    sessionId: string,
    data: {
      notes?: string;
      doctorRating?: number;
      summary?: string;
      meetingUrl?: string;
    },
  ) => {
    return apiRequest(`/doctor/sessions/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSessionMeetingUrl: async (sessionId: string, meetingUrl: string) => {
    return apiRequest(`/doctor/sessions/${sessionId}/meeting-url`, {
      method: "PUT",
      body: JSON.stringify({ meetingUrl }),
    });
  },

  getSchedule: async (week?: string) => {
    const params = week ? `?week=${week}` : "";
    return apiRequest(`/doctor/schedule${params}`);
  },

  updateSchedule: async (scheduleData: {
    workingHours: any;
    sessionDuration?: number;
    breakBetweenSessions?: number;
  }) => {
    return apiRequest("/doctor/schedule", {
      method: "PUT",
      body: JSON.stringify(scheduleData),
    });
  },

  getSessionNotes: async (filters?: { clientId?: string; search?: string }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/doctor/session-notes?${params}`);
  },

  createSessionNote: async (noteData: {
    sessionId: string;
    title: string;
    content: string;
    tags?: string[];
    diagnosis?: string;
    treatmentPlan?: string;
    nextSteps?: string;
  }) => {
    return apiRequest("/doctor/session-notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    });
  },

  updateSessionNote: async (noteId: string, noteData: any) => {
    return apiRequest(`/doctor/session-notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(noteData),
    });
  },

  submitSessionForReview: async (sessionId: string) => {
    return apiRequest(`/doctor/sessions/${sessionId}/submit-for-review`, {
      method: "POST",
    });
  },

  getSettings: async () => {
    return apiRequest("/doctor/settings");
  },

  updateSettings: async (settingsData: any) => {
    return apiRequest("/doctor/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
  },
};

// Admin API
export const adminApi = {
  getDashboard: async () => {
    return apiRequest("/admin/dashboard");
  },

  getUsers: async (filters?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams(
      Object.entries(filters || {}).map(([k, v]) => [k, String(v)]),
    );
    return apiRequest(`/admin/users?${params}`);
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    return apiRequest(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    });
  },

  getDoctors: async (filters?: { approved?: string; search?: string }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/admin/doctors?${params}`);
  },

  approveDcotor: async (doctorId: string, approved: boolean) => {
    return apiRequest(`/admin/doctors/${doctorId}/approval`, {
      method: "PUT",
      body: JSON.stringify({ approved }),
    });
  },

  createDoctor: async (doctorData: {
    email: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    specializations?: string[];
    education?: string[];
    experience?: number;
    bio?: string;
    phone?: string;
  }) => {
    return apiRequest("/admin/doctors", {
      method: "POST",
      body: JSON.stringify(doctorData),
    });
  },

  getSessions: async (filters?: {
    status?: string;
    needsAssignment?: string;
  }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/admin/sessions?${params}`);
  },

  assignDoctor: async (sessionId: string, doctorId: string) => {
    return apiRequest(`/admin/sessions/${sessionId}/assign`, {
      method: "PUT",
      body: JSON.stringify({ doctorId }),
    });
  },

  getPayments: async (filters?: {
    status?: string;
    method?: string;
    verified?: string;
  }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/admin/payments?${params}`);
  },

  verifyPayment: async (paymentId: string, verified: boolean) => {
    return apiRequest(`/admin/payments/${paymentId}/verify`, {
      method: "PUT",
      body: JSON.stringify({ verified }),
    });
  },

  exportPayments: async (filters?: {
    format?: string;
    status?: string;
    method?: string;
    verified?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams(filters || {});
    const url = `/admin/payments/export?${params}`;

    // For CSV downloads, we need to handle differently
    if (filters?.format === "csv") {
      const response = await fetch(`${window.location.origin}/api${url}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export payments");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `payments_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } else {
      return apiRequest(url);
    }
  },

  getAPIKeys: async () => {
    return apiRequest("/admin/api-keys");
  },

  createAPIKey: async (keyData: {
    name: string;
    permissions?: string[];
    expiresAt?: string;
  }) => {
    return apiRequest("/admin/api-keys", {
      method: "POST",
      body: JSON.stringify(keyData),
    });
  },

  updateAPIKey: async (keyId: string, keyData: any) => {
    return apiRequest(`/admin/api-keys/${keyId}`, {
      method: "PUT",
      body: JSON.stringify(keyData),
    });
  },

  deleteAPIKey: async (keyId: string) => {
    return apiRequest(`/admin/api-keys/${keyId}`, {
      method: "DELETE",
    });
  },

  getCertifications: async (filters?: {
    status?: string;
    pending?: string;
  }) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/admin/certifications?${params}`);
  },

  approveCertification: async (certificationId: string, approved: boolean) => {
    return apiRequest(`/admin/certifications/${certificationId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approved }),
    });
  },

  setupCertifications: async () => {
    return apiRequest("/admin/certifications/setup", {
      method: "POST",
    });
  },

  getSettings: async () => {
    return apiRequest("/admin/settings");
  },
};

export default {
  auth: authApi,
  client: clientApi,
  doctor: doctorApi,
  admin: adminApi,
};
