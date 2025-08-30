import { useState, useEffect } from "react";
import { doctorApi } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  FileText,
  MessageCircle,
  AlertCircle,
  Send,
  Users,
  Activity,
  Star,
  Video,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import {
  SessionRequest,
  TherapySession,
  User as UserType,
} from "@shared/types";
import { format } from "date-fns";

export default function DoctorDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [completedSessions, setCompletedSessions] = useState<TherapySession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TherapySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(
    null,
  );
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isUpdatingMeeting, setIsUpdatingMeeting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardResponse, sessionsResponse] = await Promise.all([
          doctorApi.getDashboard(),
          doctorApi.getSessions()
        ]);

        setDashboardData(dashboardResponse);

        const sessions = sessionsResponse.sessions || [];

        // Separate sessions by status and type
        const requests = sessions.filter((s: any) =>
          s.status === 'pending' || (s.status === 'scheduled' && !s.doctorId)
        );
        const completed = sessions.filter((s: any) => s.status === 'completed');
        const upcoming = sessions.filter((s: any) => {
          if (s.status !== 'scheduled' || !s.doctorId) return false;
          if (!s.scheduledAt) return false;

          try {
            const sessionDate = new Date(s.scheduledAt);
            if (isNaN(sessionDate.getTime())) return false;
            return sessionDate > new Date();
          } catch (error) {
            console.warn("Date filtering error:", error, "for session:", s.id);
            return false;
          }
        });

        setSessionRequests(requests);
        setCompletedSessions(completed);
        setUpcomingSessions(upcoming);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApproveRequest = async (requestId: string) => {
    if (!meetingUrl.trim()) {
      setError("Please provide a Google Meet URL before approving the session");
      return;
    }

    try {
      setIsUpdatingMeeting(true);
      setError("");

      // TODO: Update session with meeting URL in backend
      console.log("Approving session with meeting URL:", {
        sessionId: requestId,
        meetingUrl: meetingUrl.trim(),
      });

      setSessionRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "approved",
                assignedDoctorId: "doctor1",
                meetingUrl: meetingUrl.trim()
              }
            : request,
        ),
      );

      // Add to upcoming sessions
      const request = sessionRequests.find(r => r.id === requestId);
      if (request) {
        const newSession: TherapySession = {
          id: `session_${requestId}`,
          clientId: request.clientId,
          type: "human",
          status: "scheduled",
          scheduledAt: `${request.preferredDate}T${request.preferredTime}:00Z`,
          doctorId: "doctor1",
          quizCompleted: false,
          meetingUrl: meetingUrl.trim(),
        };
        setUpcomingSessions(prev => [...prev, newSession]);
      }

      setSuccess("Session approved successfully! Client will receive the meeting link.");
      setMeetingUrl("");
      setSelectedRequest(null);
    } catch (error) {
      console.error("Failed to approve session:", error);
      setError("Failed to approve session. Please try again.");
    } finally {
      setIsUpdatingMeeting(false);
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setSessionRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: "rejected" } : request,
      ),
    );
    setSuccess("Session request rejected.");
  };

  const handleSubmitNotes = async () => {
    if (!selectedSession || !sessionNotes.trim()) return;

    setIsSubmittingNotes(true);
    try {
      // TODO: Submit notes to backend
      console.log("Submitting session notes:", {
        sessionId: selectedSession.id,
        notes: sessionNotes,
      });

      // Update the session with notes
      setCompletedSessions((prev) =>
        prev.map((session) =>
          session.id === selectedSession.id
            ? { ...session, notes: sessionNotes }
            : session,
        ),
      );

      setSessionNotes("");
      setSelectedSession(null);
    } catch (error) {
      console.error("Failed to submit notes:", error);
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const getClientName = (session: any) => {
    if (session.client) {
      return `${session.client.firstName} ${session.client.lastName}`;
    }
    return "Unknown Client";
  };

  // Safe date formatting helper
  const safeFormatDate = (dateValue: any, formatString: string, fallback: string = "N/A") => {
    if (!dateValue) return fallback;

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return fallback;
      }
      return format(date, formatString);
    } catch (error) {
      console.warn("Date formatting error:", error, "for value:", dateValue);
      return fallback;
    }
  };

  const getStatusBadge = (
    status: SessionRequest["status"] | TherapySession["status"],
  ) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      scheduled: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors]} border-0`}>
        {status.replace("-", " ")}
      </Badge>
    );
  };

  const stats = dashboardData ? {
    totalSessions: dashboardData.stats?.totalSessions || 0,
    upcomingCount: upcomingSessions.length,
    pendingRequests: sessionRequests.length,
    averageRating: 4.8, // TODO: Calculate from real ratings
  } : {
    totalSessions: 0,
    upcomingCount: 0,
    pendingRequests: 0,
    averageRating: 0,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Doctor Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your therapy sessions and client interactions
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sessions
                </CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abby-blue">
                  {stats.totalSessions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abby-green">
                  {stats.upcomingCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scheduled sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Requests
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingRequests}
                </div>
                <p className="text-xs text-muted-foreground">Need approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.averageRating}
                </div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requests">Session Requests</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
              <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
            </TabsList>

            {/* Session Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Requests</CardTitle>
                  <CardDescription>
                    Review and approve client session requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionRequests.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Preferred Date/Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={request.client?.avatar} />
                                <AvatarFallback className="bg-abby-blue text-white text-xs">
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {getClientName(request)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {request.clientId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                            <TableCell>
                            <div>
                              <div className="font-medium">
                                {safeFormatDate(
                                  request.scheduledAt || request.preferredDate,
                                  "MMM dd, yyyy",
                                  "Date TBD"
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {request.scheduledAt ?
                                  safeFormatDate(request.scheduledAt, "HH:mm", "Time TBD") :
                                  request.preferredTime || "Time TBD"
                                }
                              </div>
                            </div>
                          </TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                            <TableCell>
                              {safeFormatDate(
                                request.createdAt,
                                "MMM dd, HH:mm",
                                "Unknown"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {request.status === "pending" && (
                                  <>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            setSelectedRequest(request);
                                            setMeetingUrl("");
                                            setError("");
                                            setSuccess("");
                                          }}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Approve
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center space-x-2">
                                            <Video className="w-5 h-5 text-green-600" />
                                            <span>Approve Session & Add Meeting Link</span>
                                          </DialogTitle>
                                          <DialogDescription>
                                            Approve {getClientName(request)}'s session and provide a Google Meet link
                                          </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-6">
                                          {/* Session Details */}
                                          <div className="p-4 bg-therapy-calm rounded-lg">
                                            <h4 className="font-medium mb-3">Session Details</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <span className="font-medium">Date:</span>
                                                <p>{safeFormatDate(request.preferredDate, "MMMM dd, yyyy", "Date TBD")}</p>
                                              </div>
                                              <div>
                                                <span className="font-medium">Time:</span>
                                                <p>{request.preferredTime}</p>
                                              </div>
                                            </div>
                                            <div className="mt-3">
                                              <span className="font-medium">Reason:</span>
                                              <p className="text-sm mt-1">{request.reason}</p>
                                            </div>
                                          </div>

                                          {/* Google Meet URL */}
                                          <div className="space-y-2">
                                            <Label htmlFor="meetingUrl" className="flex items-center space-x-2">
                                              <Video className="w-4 h-4 text-blue-600" />
                                              <span>Google Meet URL *</span>
                                            </Label>
                                            <Input
                                              id="meetingUrl"
                                              type="url"
                                              placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                              value={meetingUrl}
                                              onChange={(e) => setMeetingUrl(e.target.value)}
                                              className="w-full"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                              Create a Google Meet room and paste the link here. The client will receive this link to join the session.
                                            </p>
                                          </div>

                                          {/* Instructions */}
                                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                                              <LinkIcon className="w-4 h-4 mr-1" />
                                              How to create a Google Meet link:
                                            </h5>
                                            <div className="text-sm text-blue-700 space-y-1">
                                              <p>1. Go to meet.google.com</p>
                                              <p>2. Click "New meeting" → "Start an instant meeting"</p>
                                              <p>3. Copy the meeting link from the browser or invite section</p>
                                            </div>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex gap-3 pt-4">
                                            <Button
                                              onClick={() => handleApproveRequest(request.id)}
                                              disabled={!meetingUrl.trim() || isUpdatingMeeting}
                                              className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                              {isUpdatingMeeting ? (
                                                "Approving..."
                                              ) : (
                                                <>
                                                  <CheckCircle className="w-4 h-4 mr-2" />
                                                  Approve Session
                                                </>
                                              )}
                                            </Button>
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setSelectedRequest(null);
                                                setMeetingUrl("");
                                                setError("");
                                              }}
                                              disabled={isUpdatingMeeting}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleRejectRequest(request.id)
                                      }
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Session Request Details
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium mb-2">
                                          Client Request:
                                        </h4>
                                        <div className="p-3 bg-therapy-calm rounded-lg">
                                          <p className="text-sm">
                                            {request.reason}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">
                                            Preferred Date
                                          </label>
                                          <p className="text-sm">
                                            {safeFormatDate(
                                              request.preferredDate,
                                              "MMMM dd, yyyy",
                                              "Date TBD"
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">
                                            Preferred Time
                                          </label>
                                          <p className="text-sm">
                                            {request.preferredTime}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">
                        No session requests
                      </h3>
                      <p className="text-muted-foreground">
                        New session requests from clients will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upcoming Sessions Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled therapy sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarImage src={session.client?.avatar} />
                                <AvatarFallback className="bg-abby-blue text-white">
                                  <User className="w-5 h-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">
                                  {getClientName(session)}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {safeFormatDate(
                                      session.scheduledAt,
                                      "MMM dd, yyyy",
                                      "Date TBD"
                                    )}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {safeFormatDate(
                                      session.scheduledAt,
                                      "HH:mm",
                                      "Time TBD"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(session.status)}
                              {session.meetingUrl ? (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => window.open(session.meetingUrl, '_blank')}
                                  >
                                    <Video className="w-4 h-4 mr-1" />
                                    Join Meeting
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(session.meetingUrl);
                                      setSuccess("Meeting link copied to clipboard!");
                                      setTimeout(() => setSuccess(""), 3000);
                                    }}
                                  >
                                    <LinkIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" disabled>
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  No Meeting Link
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">
                        No upcoming sessions
                      </h3>
                      <p className="text-muted-foreground">
                        Your scheduled sessions will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Sessions Tab */}
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Sessions</CardTitle>
                  <CardDescription>
                    Session history and notes management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Quiz Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={session.client?.avatar} />
                                <AvatarFallback className="bg-abby-blue text-white text-xs">
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {getClientName(session)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {session.clientId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {safeFormatDate(
                              session.scheduledAt,
                              "MMM dd, yyyy HH:mm",
                              "Date TBD"
                            )}
                          </TableCell>
                          <TableCell>{session.duration} min</TableCell>
                          <TableCell>
                            {session.quizCompleted ? (
                              <Badge className="bg-green-100 text-green-800 border-0">
                                {session.quizScore}%
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not completed</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setSessionNotes(session.notes || "");
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  {session.notes ? "Edit Notes" : "Add Notes"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Session Notes</DialogTitle>
                                  <DialogDescription>
                                    Session with{" "}
                                    {getClientName(session)} on{" "}
                                    {safeFormatDate(
                                      session.scheduledAt,
                                      "MMMM dd, yyyy",
                                      "Date TBD"
                                    )}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center p-3 bg-therapy-calm rounded-lg">
                                      <div className="font-semibold text-abby-blue">
                                        {session.duration}min
                                      </div>
                                      <div className="text-muted-foreground">
                                        Duration
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-therapy-calm rounded-lg">
                                      <div className="font-semibold text-abby-green">
                                        {session.quizScore || 0}%
                                      </div>
                                      <div className="text-muted-foreground">
                                        Quiz Score
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-therapy-calm rounded-lg">
                                      <div className="font-semibold text-purple-600">
                                        Human
                                      </div>
                                      <div className="text-muted-foreground">
                                        Session Type
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Session Notes (shared with admin)
                                    </label>
                                    <Textarea
                                      value={sessionNotes}
                                      onChange={(e) =>
                                        setSessionNotes(e.target.value)
                                      }
                                      placeholder="Enter your notes about this session..."
                                      className="min-h-[150px]"
                                    />
                                  </div>

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedSession(null);
                                        setSessionNotes("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleSubmitNotes}
                                      disabled={
                                        isSubmittingNotes ||
                                        !sessionNotes.trim()
                                      }
                                      className="bg-abby-blue hover:bg-abby-blue/90"
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      {isSubmittingNotes
                                        ? "Saving..."
                                        : "Save Notes"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
