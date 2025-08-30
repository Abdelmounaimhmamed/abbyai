import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { clientApi } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Calendar,
  Clock,
  MessageCircle,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  FileText,
  Star,
  Plus,
  BarChart3,
  Award,
  AlertCircle,
  Video,
} from "lucide-react";
import { format } from "date-fns";

// Default doctor profile for display
const defaultDoctorProfile = {
  id: "unknown",
  name: "To be assigned",
  avatar: "",
  specialization: [],
  rating: 0,
};

export default function Sessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch real session data
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all sessions for the user
        const response = await clientApi.getSessions();
        const sessions = response.sessions || [];

        // Separate sessions by status
        const completed = sessions.filter((s: any) => s.status === 'completed');
        const upcoming = sessions.filter((s: any) =>
          (s.status === 'scheduled' || s.status === 'in_progress') &&
          new Date(s.scheduledAt) > new Date() &&
          s.status !== 'completed' &&
          s.status !== 'cancelled' &&
          s.status !== 'pending'
        );
        const pending = sessions.filter((s: any) =>
          s.status === 'pending' ||
          s.status === 'pending-approval' ||
          (s.type === 'human' && !s.doctorName)
        );

        setCompletedSessions(completed);
        setUpcomingSessions(upcoming);
        setPendingRequests(pending);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setError("Failed to load sessions");
        // Set empty arrays for new clients
        setCompletedSessions([]);
        setUpcomingSessions([]);
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Refresh data when user returns to this page (e.g., from quiz completion)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !loading) {
        // Refetch sessions when page gets focus (user returns from quiz)
        const refetchSessions = async () => {
          try {
            const response = await clientApi.getSessions();
            const sessions = response.sessions || [];

            const completed = sessions.filter((s: any) => s.status === 'completed');
            const upcoming = sessions.filter((s: any) =>
              (s.status === 'scheduled' || s.status === 'in_progress') &&
              new Date(s.scheduledAt) > new Date() &&
              s.status !== 'completed' &&
              s.status !== 'cancelled' &&
              s.status !== 'pending'
            );
            const pending = sessions.filter((s: any) =>
              s.status === 'pending' ||
              s.status === 'pending-approval' ||
              (s.type === 'human' && !s.doctorName)
            );

            setCompletedSessions(completed);
            setUpcomingSessions(upcoming);
            setPendingRequests(pending);
          } catch (error) {
            console.error("Failed to refresh sessions:", error);
          }
        };

        refetchSessions();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading]);

  // Handle navigation from quiz completion to force immediate refresh
  useEffect(() => {
    const navigationState = location.state as {
      refresh?: boolean;
      completedSessionId?: string;
      timestamp?: number
    } | null;

    if (navigationState?.refresh && user && !loading) {
      console.log('Refreshing sessions after quiz completion for session:', navigationState.completedSessionId);

      // Force immediate refresh of session data
      const forceRefresh = async () => {
        try {
          setLoading(true);
          const response = await clientApi.getSessions();
          const sessions = response.sessions || [];

          const completed = sessions.filter((s: any) => s.status === 'completed');
          const upcoming = sessions.filter((s: any) =>
            (s.status === 'scheduled' || s.status === 'in_progress') &&
            new Date(s.scheduledAt) > new Date() &&
            s.status !== 'completed' &&
            s.status !== 'cancelled' &&
            s.status !== 'pending'
          );
          const pending = sessions.filter((s: any) =>
            s.status === 'pending' ||
            s.status === 'pending-approval' ||
            (s.type === 'human' && !s.doctorName)
          );

          setCompletedSessions(completed);
          setUpcomingSessions(upcoming);
          setPendingRequests(pending);

          // Clear the navigation state to prevent infinite refreshes
          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error("Failed to force refresh sessions:", error);
          setError("Failed to load updated sessions");
        } finally {
          setLoading(false);
        }
      };

      forceRefresh();
    }
  }, [location.state, user, loading, navigate, location.pathname]);

  const handleJoinSession = (session: any) => {
    if (session.type === "ai") {
      // Navigate to AI session page with existing session data
      navigate("/ai-session", {
        state: {
          sessionId: session.id,
          topic: session.topic || "AI Therapy Session",
          existingSession: true
        }
      });
    } else if (session.meetingUrl) {
      // Open Google Meet link in new tab
      window.open(session.meetingUrl, '_blank');
    } else {
      alert("Meeting link not yet available. Your therapist will provide the link soon.");
    }
  };

  const getDoctorInfo = (doctorName?: string) => {
    return doctorName ? {
      name: doctorName,
      specialization: [],
      rating: 5.0
    } : defaultDoctorProfile;
  };

  const getSessionTypeIcon = (type: string) => {
    return type === "ai" ? Brain : Users;
  };

  const getSessionTypeBadge = (type: string) => {
    return type === "ai" ? (
      <Badge className="bg-blue-100 text-blue-800 border-0">
        <Brain className="w-3 h-3 mr-1" />
        AI Therapy
      </Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800 border-0">
        <Users className="w-3 h-3 mr-1" />
        Human Therapist
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors]} border-0`}>
        {status}
      </Badge>
    );
  };

  const totalSessions = completedSessions.length;
  const avgQuizScore = totalSessions > 0
    ? completedSessions.reduce((acc, s) => acc + (s.quizScore || 0), 0) / totalSessions
    : 0;
  const totalHours = totalSessions > 0
    ? completedSessions.reduce((acc, s) => acc + (120), 0) / 60  // Assume 2 hours per session
    : 0;
  const nextCertificationProgress = (totalSessions / 2) * 100; // Need 2 sessions for certification

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abby-blue mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your sessions...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Your Sessions
              </h1>
              <p className="text-muted-foreground">
                Manage your therapy sessions and track your progress
              </p>
            </div>
            <Link to="/book-session">
              <Button className="bg-abby-blue hover:bg-abby-blue/90">
                <Plus className="w-4 h-4 mr-2" />
                Book Session
              </Button>
            </Link>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-abby-blue" />
                  <span className="text-sm font-medium">Total Sessions</span>
                </div>
                <div className="text-2xl font-bold text-abby-blue mt-2">
                  {totalSessions}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Total Hours</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {Math.round(totalHours * 10) / 10}
                </div>
                <div className="text-xs text-muted-foreground">
                  Therapy time
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Avg Quiz Score</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">
                  {Math.round(avgQuizScore)}%
                </div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Certification</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">
                  {Math.min(100, Math.round(nextCertificationProgress))}%
                </div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </CardContent>
            </Card>
          </div>

          {/* Certification Progress */}
          {nextCertificationProgress < 100 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>Next Certification Progress</span>
                </CardTitle>
                <CardDescription>
                  Complete 2 therapy sessions with passing quiz scores to unlock
                  your first certificate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Sessions Completed</span>
                      <span>{totalSessions}/2</span>
                    </div>
                    <Progress
                      value={nextCertificationProgress}
                      className="h-3"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {totalSessions < 2
                        ? `${2 - totalSessions} more session${2 - totalSessions !== 1 ? "s" : ""} needed`
                        : "Ready for certification! Check your certificates page."}
                    </span>
                    <Link to="/certifications">
                      <Button variant="outline" size="sm">
                        View Certificates
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sessions Management */}
          <Tabs defaultValue="completed" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            </TabsList>

            {/* Completed Sessions */}
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Sessions</CardTitle>
                  <CardDescription>
                    Your therapy session history with results and evaluations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedSessions.length > 0 ? (
                    <div className="space-y-4">
                      {completedSessions.map((session) => {
                        const doctor = getDoctorInfo(session.doctorName);
                        const Icon = getSessionTypeIcon(session.type);

                        return (
                          <div
                            key={session.id}
                            className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-abby-blue to-abby-green rounded-xl flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    {getSessionTypeBadge(session.type)}
                                    {getStatusBadge(session.status)}
                                  </div>
                                  <h4 className="font-semibold text-foreground">
                                    {session.type === "ai"
                                      ? "AI Therapy Session"
                                      : `Session with ${doctor?.name}`}
                                  </h4>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {session.startedAt ? format(
                                        new Date(session.startedAt),
                                        "MMM dd, yyyy",
                                      ) : format(
                                        new Date(session.scheduledAt),
                                        "MMM dd, yyyy",
                                      )}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      120 minutes
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-center">
                                <div className={`text-2xl font-bold ${session.quizScore >= 70 ? 'text-green-600' : session.quizScore ? 'text-orange-600' : 'text-gray-400'}`}>
                                  {session.quizScore ? `${session.quizScore}%` : 'N/A'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Quiz Score
                                </div>
                                {session.quizScore >= 70 && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    ✓ Counts toward progress
                                  </div>
                                )}
                              </div>
                            </div>

                            {session.summary && (
                              <div className="bg-therapy-calm p-4 rounded-lg mb-4">
                                <h5 className="font-medium text-foreground mb-2">
                                  Session Summary
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  {session.summary}
                                </p>
                              </div>
                            )}

                            {session.clientFeedback && (
                              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <h5 className="font-medium text-blue-900 mb-2">
                                  Your Feedback
                                </h5>
                                <p className="text-sm text-blue-700">
                                  {session.clientFeedback}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center space-x-2">
                                {session.status === 'completed' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm text-muted-foreground">
                                  Session {session.status === 'completed' ? "Completed" : "In Progress"}
                                </span>
                                {session.clientRating && (
                                  <div className="flex items-center space-x-1 ml-4">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm text-muted-foreground">
                                      {session.clientRating}/5
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                                <Button variant="outline" size="sm">
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Progress
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">
                        No Sessions Yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Start your therapy journey by booking your first session
                      </p>
                      <Link to="/book-session">
                        <Button className="bg-abby-blue hover:bg-abby-blue/90">
                          Book Your First Session
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upcoming Sessions */}
            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled therapy appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => {
                        const doctor = getDoctorInfo(session.doctorName);
                        const Icon = getSessionTypeIcon(session.type);

                        return (
                          <div
                            key={session.id}
                            className="border rounded-lg p-6 bg-blue-50 border-blue-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-abby-blue to-blue-600 rounded-xl flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    {getSessionTypeBadge(session.type)}
                                    {getStatusBadge(session.status)}
                                  </div>
                                  <h4 className="font-semibold text-foreground">
                                    {session.type === "ai"
                                      ? "AI Therapy Session"
                                      : `Session with ${doctor?.name}`}
                                  </h4>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {format(
                                        new Date(session.scheduledAt),
                                        "MMM dd, yyyy",
                                      )}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {format(
                                        new Date(session.scheduledAt),
                                        "HH:mm",
                                      )}
                                    </span>
                                  </div>
                                  {session.topic && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      Topic: {session.topic}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                {session.type === "human" && session.meetingUrl ? (
                                  <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    size="sm"
                                    onClick={() => handleJoinSession(session)}
                                  >
                                    <Video className="w-4 h-4 mr-2" />
                                    Join Meeting
                                  </Button>
                                ) : session.type === "ai" ? (
                                  <Button
                                    className="bg-abby-blue hover:bg-abby-blue/90"
                                    size="sm"
                                    onClick={() => handleJoinSession(session)}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start AI Session
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                  >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Awaiting Meeting Link
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">
                        No Upcoming Sessions
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Schedule your next therapy session
                      </p>
                      <Link to="/book-session">
                        <Button className="bg-abby-blue hover:bg-abby-blue/90">
                          Schedule Session
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Requests */}
            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>
                    Human therapist session requests awaiting admin approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.map((session) => (
                        <div
                          key={session.id}
                          className="border rounded-lg p-6 bg-orange-50 border-orange-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge className="bg-orange-100 text-orange-800 border-0">
                                    {session.status === 'pending' ? 'Pending Approval' : session.status}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-foreground">
                                  {session.type === 'human' ? 'Human Therapist Request' : 'Session Request'}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {format(
                                      new Date(session.scheduledAt),
                                      "MMM dd, yyyy",
                                    )}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {format(
                                      new Date(session.scheduledAt),
                                      "HH:mm",
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button variant="outline" size="sm" disabled>
                              Awaiting Approval
                            </Button>
                          </div>

                          {session.topic && (
                            <div className="mt-4 p-3 bg-white rounded-lg">
                              <h5 className="font-medium text-foreground mb-2">
                                Session Request
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {session.topic}
                              </p>
                            </div>
                          )}

                          <div className="mt-4 text-xs text-muted-foreground">
                            Requested on{" "}
                            {format(
                              new Date(session.createdAt),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">
                        No Pending Requests
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        All your session requests have been processed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
