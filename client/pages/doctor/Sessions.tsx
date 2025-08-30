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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  FileText,
  Search,
  Filter,
  MessageCircle,
  Video,
  Star,
  AlertCircle,
  Link,
  Save,
} from "lucide-react";
import { TherapySession } from "@shared/types";
import { format } from "date-fns";

export default function DoctorSessions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todaySessions, setTodaySessions] = useState<TherapySession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<TherapySession[]>(
    [],
  );
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  // Fetch sessions data on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await doctorApi.getSessions();
        const sessions = response.sessions || [];

        // Separate sessions by status and date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysSessions = sessions.filter((session: TherapySession) => {
          const sessionDate = new Date(session.scheduledAt!);
          return sessionDate >= today && sessionDate < tomorrow;
        });

        const completed = sessions.filter(
          (session: TherapySession) => session.status === "completed",
        );

        const pending = sessions.filter(
          (session: TherapySession) =>
            session.status === "pending" || !session.doctorId,
        );

        setTodaySessions(todaysSessions);
        setCompletedSessions(completed);
        setPendingRequests(pending);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setError("Failed to load sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const getClientInfo = (session: any) => {
    if (session && session.client) {
      return {
        name: `${session.client.firstName} ${session.client.lastName}`,
        age: (session.client as any).age || 0,
        sessions: (session.client as any).sessionCount || 0,
      };
    }
    return { name: "Unknown Client", age: 0, sessions: 0 };
  };

  const handleSessionAction = async (
    sessionId: string,
    action: "start" | "pause" | "complete",
  ) => {
    try {
      switch (action) {
        case "start":
          // Check if session has meeting URL, if not prompt for one
          const session = todaySessions.find((s) => s.id === sessionId);
          if (!session?.meetingUrl) {
            setSelectedSessionId(sessionId);
            setShowMeetingDialog(true);
            setError(""); // Clear any previous errors
            return;
          }

          await doctorApi.startSession(sessionId);
          setTodaySessions((prev) =>
            prev.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    status: "in-progress",
                    startedAt: new Date().toISOString(),
                  }
                : session,
            ),
          );
          break;
        case "complete":
          await doctorApi.completeSession(sessionId, {
            notes: "",
            summary: "Session completed successfully",
          });
          // Remove from today's sessions and add to completed
          const completedSession = todaySessions.find(
            (s) => s.id === sessionId,
          );
          if (completedSession) {
            setTodaySessions((prev) => prev.filter((s) => s.id !== sessionId));
            setCompletedSessions((prev) => [
              ...prev,
              {
                ...completedSession,
                status: "completed",
                endedAt: new Date().toISOString(),
                duration: completedSession.startedAt
                  ? Math.round(
                      (new Date().getTime() -
                        new Date(completedSession.startedAt).getTime()) /
                        1000 /
                        60,
                    )
                  : 50,
              },
            ]);
          }

          // Prompt to complete session notes
          const shouldGoToNotes = confirm(
            "Session completed successfully! Would you like to go to Session Notes to document this session for admin review and certification approval?",
          );
          if (shouldGoToNotes) {
            window.location.href = "/doctor/session-notes";
          }
          break;
        case "pause":
          // For pause, just update local state (no API endpoint for pause)
          setTodaySessions((prev) =>
            prev.map((session) =>
              session.id === sessionId
                ? { ...session, status: "scheduled" }
                : session,
            ),
          );
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} session:`, error);
      setError(`Failed to ${action} session. Please try again.`);
    }
  };

  const handleSetMeetingUrl = async () => {
    try {
      if (!meetingUrl.trim()) {
        setError("Please enter a valid meeting URL");
        return;
      }

      // Update session with meeting URL
      await doctorApi.updateSessionMeetingUrl(
        selectedSessionId,
        meetingUrl.trim(),
      );

      // Update local state
      setTodaySessions((prev) =>
        prev.map((session) =>
          session.id === selectedSessionId
            ? { ...session, meetingUrl: meetingUrl.trim() }
            : session,
        ),
      );

      // Close dialog and reset
      setShowMeetingDialog(false);
      setMeetingUrl("");

      // Now start the session
      await handleSessionAction(selectedSessionId, "start");
    } catch (error) {
      console.error("Failed to set meeting URL:", error);
      setError("Failed to set meeting URL. Please try again.");
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    try {
      // TODO: Add API endpoint for approving/rejecting session requests
      // For now, just update local state
      setPendingRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: action === "approve" ? "approved" : "rejected",
              }
            : request,
        ),
      );
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      setError(`Failed to ${action} request. Please try again.`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-orange-100 text-orange-800",
    };
    const key = status.replace("_", "-") as keyof typeof colors;
    return (
      <Badge
        className={`${colors[key] || "bg-gray-100 text-gray-800"} border-0`}
      >
        {status.replace(/[-_]/g, " ")}
      </Badge>
    );
  };

  const filteredCompletedSessions = completedSessions.filter((session) => {
    const client = getClientInfo(session);
    const matchesSearch = client.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    todayTotal: todaySessions.length,
    inProgress: todaySessions.filter((s) => s.status === "in-progress").length,
    completed: completedSessions.length,
    pending: pendingRequests.filter((r) => r.status === "pending").length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sessions...</p>
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
              Session Management
            </h1>
            <p className="text-muted-foreground">
              Manage your therapy sessions and client interactions
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-abby-blue" />
                  <span className="text-sm font-medium">Today's Sessions</span>
                </div>
                <div className="text-2xl font-bold text-abby-blue mt-2">
                  {stats.todayTotal}
                </div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">
                  {stats.inProgress}
                </div>
                <div className="text-xs text-muted-foreground">Active now</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {stats.completed}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total sessions
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-2">
                  {stats.pending}
                </div>
                <div className="text-xs text-muted-foreground">Requests</div>
              </CardContent>
            </Card>
          </div>

          {/* Session Management Tabs */}
          <Tabs defaultValue="today" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today's Sessions</TabsTrigger>
              <TabsTrigger value="completed">Session History</TabsTrigger>
              <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            </TabsList>

            {/* Today's Sessions */}
            <TabsContent value="today" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>
                    Your therapy sessions for today -{" "}
                    {format(new Date(), "MMMM dd, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todaySessions.length > 0 ? (
                    <div className="space-y-4">
                      {todaySessions.map((session) => {
                        const client = getClientInfo(session);

                        return (
                          <div
                            key={session.id}
                            className={`border rounded-lg p-6 ${
                              session.status === "in-progress"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={session.client?.avatar} />
                                  <AvatarFallback className="bg-abby-green text-white">
                                    <User className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {client.name}
                                  </h4>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>Age: {client.age}</span>
                                    <span>Sessions: {client.sessions}</span>
                                    <span className="flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {format(
                                        new Date(session.scheduledAt!),
                                        "HH:mm",
                                      )}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-2">
                                    {getStatusBadge(session.status)}
                                    {session.meetingUrl && (
                                      <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                                        <Video className="w-3 h-3 mr-1" />
                                        Meeting Ready
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                {session.status === "scheduled" && (
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handleSessionAction(session.id, "start")
                                    }
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Session
                                  </Button>
                                )}
                                {session.status === "in-progress" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        handleSessionAction(session.id, "pause")
                                      }
                                    >
                                      <Pause className="w-4 h-4 mr-2" />
                                      Pause
                                    </Button>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() =>
                                        handleSessionAction(
                                          session.id,
                                          "complete",
                                        )
                                      }
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Complete
                                    </Button>
                                  </>
                                )}
                                {session.meetingUrl ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(session.meetingUrl, "_blank")
                                    }
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  >
                                    <Video className="w-4 h-4 mr-2" />
                                    Join Meeting
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSessionId(session.id);
                                      setShowMeetingDialog(true);
                                    }}
                                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  >
                                    <Link className="w-4 h-4 mr-2" />
                                    Add Meeting Link
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
                        No Sessions Today
                      </h3>
                      <p className="text-muted-foreground">
                        You have no scheduled sessions for today
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Sessions */}
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                  <CardDescription>
                    Your completed therapy sessions with notes and outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1 max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search sessions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="all">All Sessions</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Quiz Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompletedSessions.map((session) => {
                        const client = getClientInfo(session);
                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={session.client?.avatar} />
                                  <AvatarFallback className="bg-abby-green text-white text-xs">
                                    <User className="w-4 h-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {client.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Age: {client.age}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(session.scheduledAt!),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </TableCell>
                            <TableCell>{session.duration} min</TableCell>
                            <TableCell>
                              {session.quizCompleted ? (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">
                                    {session.quizScore}%
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="secondary">Not completed</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(session.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <FileText className="w-4 h-4 mr-2" />
                                      View Notes
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Session Notes - {client.name}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Session on{" "}
                                        {format(
                                          new Date(session.scheduledAt!),
                                          "MMMM dd, yyyy",
                                        )}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-therapy-calm rounded-lg">
                                          <div className="font-semibold text-abby-blue">
                                            {session.duration}min
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Duration
                                          </div>
                                        </div>
                                        <div className="p-3 bg-therapy-calm rounded-lg">
                                          <div className="font-semibold text-abby-green">
                                            {session.quizScore}%
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Quiz Score
                                          </div>
                                        </div>
                                        <div className="p-3 bg-therapy-calm rounded-lg">
                                          <div className="font-semibold text-purple-600">
                                            Human
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Session Type
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-medium mb-2">
                                          Session Notes
                                        </h4>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                          <p className="text-sm">
                                            {session.notes}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Requests */}
            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Session Requests</CardTitle>
                  <CardDescription>
                    Client requests waiting for your approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingRequests.filter((r) => r.status === "pending")
                    .length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests
                        .filter((r) => r.status === "pending")
                        .map((request) => {
                          const client = getClientInfo(request);

                          return (
                            <div
                              key={request.id}
                              className="border rounded-lg p-6 bg-orange-50 border-orange-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={request.client?.avatar} />
                                    <AvatarFallback className="bg-orange-500 text-white">
                                      <User className="w-6 h-6" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold text-foreground">
                                      {client.name}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <span>Age: {client.age}</span>
                                      <span className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {format(
                                          new Date(
                                            request.scheduledAt ||
                                              request.preferredDate,
                                          ),
                                          "MMM dd, yyyy",
                                        )}
                                      </span>
                                      <span className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {request.scheduledAt
                                          ? format(
                                              new Date(request.scheduledAt),
                                              "HH:mm",
                                            )
                                          : request.preferredTime}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex space-x-2">
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handleRequestAction(request.id, "approve")
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleRequestAction(request.id, "reject")
                                    }
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-4 p-3 bg-white rounded-lg">
                                <h5 className="font-medium text-foreground mb-2">
                                  Session Request
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  {request.reason}
                                </p>
                              </div>

                              <div className="mt-2 text-xs text-muted-foreground">
                                Requested on{" "}
                                {format(
                                  new Date(request.createdAt),
                                  "MMM dd, yyyy HH:mm",
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">
                        No Pending Requests
                      </h3>
                      <p className="text-muted-foreground">
                        All session requests have been processed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Google Meet URL Dialog */}
          <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Add Meeting Link
                </DialogTitle>
                <DialogDescription>
                  Please provide a Google Meet link for this session. The client
                  will use this link to join the meeting.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Google Meet URL *
                  </label>
                  <Input
                    type="url"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a meeting at meet.google.com and paste the link here
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMeetingDialog(false);
                      setMeetingUrl("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSetMeetingUrl}
                    className="bg-abby-green hover:bg-abby-green/90"
                    disabled={!meetingUrl.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Start Session
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
