import "./global.css";

import "./polyfills/resizeObserverPatch";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import DoctorOnboarding from "./pages/DoctorOnboarding";
import SessionSelect from "./pages/SessionSelect";
import AISession from "./pages/AISession";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import UserManagement from "./pages/admin/UserManagement";
import DoctorManagement from "./pages/admin/DoctorManagement";
import Payments from "./pages/admin/Payments";
import APIKeys from "./pages/admin/APIKeys";
import Progress from "./pages/client/Progress";
import Sessions from "./pages/client/Sessions";
import Certifications from "./pages/client/Certifications";
import DoctorSessions from "./pages/doctor/Sessions";
import DoctorSessionNotes from "./pages/doctor/SessionNotes";
import DoctorSettings from "./pages/doctor/Settings";
import AdminSettings from "./pages/admin/Settings";
import SessionManagement from "./pages/admin/SessionManagement";
import BookSession from "./pages/BookSession";
import Quiz from "./pages/Quiz";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ConditionalRoute from "./components/ConditionalRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Placeholder routes for future development */}
            <Route
              path="/forgot-password"
              element={
                <Placeholder
                  title="Password Reset"
                  description="Forgot your password? This feature will help you reset it securely."
                  suggestedPrompt="Please implement the forgot password flow with email verification"
                />
              }
            />
            <Route
              path="/terms"
              element={
                <Placeholder
                  title="Terms of Service"
                  description="Review our terms and conditions for using Abby AI."
                  suggestedPrompt="Please create comprehensive terms of service for a therapy platform"
                />
              }
            />
            <Route
              path="/privacy"
              element={
                <Placeholder
                  title="Privacy Policy"
                  description="Learn how we protect your data and privacy."
                  suggestedPrompt="Please create a privacy policy for a medical/therapy platform"
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ConditionalRoute
                  requireAuth={true}
                  requireOnboarding={true}
                  allowedRoles={["client"]}
                >
                  <ClientDashboard />
                </ConditionalRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["client"]}>
                  <Onboarding />
                </ConditionalRoute>
              }
            />
            <Route
              path="/doctor/onboarding"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["doctor"]}>
                  <DoctorOnboarding />
                </ConditionalRoute>
              }
            />
            <Route path="/session" element={<SessionSelect />} />
            <Route path="/ai-session" element={<AISession />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route
              path="/admin"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ConditionalRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <UserManagement />
                </ConditionalRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <DoctorManagement />
                </ConditionalRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <Payments />
                </ConditionalRoute>
              }
            />
            <Route
              path="/admin/api-keys"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <APIKeys />
                </ConditionalRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <AdminSettings />
                </ConditionalRoute>
              }
            />
            <Route
              path="/admin/sessions"
              element={
                <ConditionalRoute requireAuth={true} allowedRoles={["admin"]}>
                  <SessionManagement />
                </ConditionalRoute>
              }
            />
            <Route path="/book-session" element={<BookSession />} />
            <Route
              path="/doctor"
              element={
                <ConditionalRoute
                  requireAuth={true}
                  requireOnboarding={true}
                  allowedRoles={["doctor"]}
                >
                  <DoctorDashboard />
                </ConditionalRoute>
              }
            />
            <Route path="/doctor/sessions" element={<DoctorSessions />} />
            <Route
              path="/doctor/session-notes"
              element={<DoctorSessionNotes />}
            />
            <Route path="/doctor/settings" element={<DoctorSettings />} />

            {/* Client Pages */}
            <Route path="/progress" element={<Progress />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/certifications" element={<Certifications />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
