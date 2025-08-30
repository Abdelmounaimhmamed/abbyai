// User roles and authentication
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export type UserRole = "client" | "doctor" | "admin";
export type UserStatus = "pending" | "active" | "suspended" | "deactivated";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Client specific types
export interface ClientProfile extends User {
  role: "client";
  age?: number;
  onboardingCompleted: boolean;
  personalizedResponses: OnboardingResponse[];
  sessionsCompleted: number;
  quizzesPassed: number;
  certificationsEarned: string[];
  mentalHealthInsights?: MentalHealthInsight[];
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: "text" | "multiple-choice" | "scale" | "boolean";
  options?: string[];
  required: boolean;
  category: "personality" | "preferences" | "background" | "goals";
}

export interface OnboardingResponse {
  questionId: string;
  answer: string | number | boolean;
  timestamp: string;
}

// Session types
export interface TherapySession {
  id: string;
  clientId: string;
  type: SessionType;
  status: SessionStatus;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // in minutes
  doctorId?: string;
  transcript?: ChatMessage[];
  notes?: string;
  quizCompleted: boolean;
  quizScore?: number;
  evaluation?: string;
  meetingUrl?: string; // Google Meet or other video call URL
}

export type SessionType = "ai" | "human";
export type SessionStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "pending-approval";

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "user" | "ai" | "doctor";
  content: string;
  timestamp: string;
  type: "text" | "voice";
  voiceUrl?: string;
}

// Doctor specific types
export interface DoctorProfile extends User {
  role: "doctor";
  license: string;
  specializations: string[];
  experience: string;
  expertise: string;
  availability: DoctorAvailability[];
  assignedSessions: string[];
  completedSessions: number;
  rating?: number;
}

export interface DoctorAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export interface SessionRequest {
  id: string;
  clientId: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  assignedDoctorId?: string;
  createdAt: string;
  adminNotes?: string;
  meetingUrl?: string; // Google Meet or other video call URL
}

// Admin types
export interface AdminDashboardStats {
  totalClients: number;
  totalDoctors: number;
  activeSessions: number;
  pendingPayments: number;
  completedSessions: number;
  pendingApprovals: number;
  revenue: number;
  certificationsIssued: number;
}

export interface PaymentInfo {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: "paypal" | "bank-transfer";
  status: "pending" | "verified" | "rejected";
  transactionId?: string;
  accountName?: string;
  submittedAt: string;
  verifiedAt?: string;
  adminNotes?: string;
}

// AI and Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface Quiz {
  id: string;
  sessionId: string;
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface MentalHealthInsight {
  id: string;
  clientId: string;
  type: "mood" | "progress" | "recommendation" | "milestone";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
  generatedAt: string;
  sessionId?: string;
}

export interface Certification {
  id: string;
  clientId: string;
  title: string;
  description: string;
  requirements: string[];
  completedRequirements: string[];
  isUnlocked: boolean;
  unlockedAt?: string;
  certificateUrl?: string;
}

// API Keys and Configuration
export interface APIKeyConfig {
  id: string;
  name: string;
  provider: "cohere";
  keyPreview: string; // Only first/last few characters shown
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type:
    | "session-reminder"
    | "session-approved"
    | "payment-verified"
    | "certification-earned"
    | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Voice message types
export interface VoiceMessage {
  id: string;
  messageId: string;
  audioUrl: string;
  duration: number; // in seconds
  transcript?: string;
  processed: boolean;
}
