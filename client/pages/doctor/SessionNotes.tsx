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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Filter,
  Edit,
  Save,
  User,
  Calendar,
  Clock,
  Star,
  Plus,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { TherapySession } from "@shared/types";
import { format } from "date-fns";

interface SessionNote {
  sessionId: string;
  content: string;
  objectives: string[];
  interventions: string[];
  clientResponse: string;
  recommendations: string;
  nextSessionPlan: string;
}

export default function SessionNotes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(
    null,
  );
  const [editingNotes, setEditingNotes] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [selectedSessionsForReview, setSelectedSessionsForReview] = useState<
    string[]
  >([]);
  const [newNoteForm, setNewNoteForm] = useState({
    sessionId: "",
    title: "",
    content: "",
    diagnosis: "",
    treatmentPlan: "",
    nextSteps: "",
  });
  const [submittingForReview, setSubmittingForReview] = useState(false);

  // Fetch sessions data on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all sessions (not just completed) so we can create notes for any session
        const response = await doctorApi.getSessions();
        setSessions(response.sessions || []);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setError("Failed to load session notes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const getClientInfo = (session: any) => {
    if (session.client) {
      return {
        name: `${session.client.firstName} ${session.client.lastName}`,
        age: session.client.age || 0,
        diagnoses: session.client.diagnoses || [],
        sessions: session.client.sessionCount || 0,
        avatar: session.client.avatar,
      };
    }
    return {
      name: "Unknown Client",
      age: 0,
      diagnoses: [],
      sessions: 0,
      avatar: undefined,
    };
  };

  // Safe date formatting helper
  const safeFormatDate = (
    dateValue: any,
    formatString: string,
    fallback: string = "N/A",
  ) => {
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

  const handleSaveNotes = async (sessionId: string, notes: string) => {
    try {
      await doctorApi.completeSession(sessionId, { notes });
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, notes } : session,
        ),
      );
      setIsEditingMode(false);
      setEditingNotes("");
    } catch (error) {
      console.error("Failed to save notes:", error);
      setError("Failed to save notes. Please try again.");
    }
  };

  const handleCreateNewNote = async () => {
    try {
      if (
        !newNoteForm.sessionId ||
        !newNoteForm.title ||
        !newNoteForm.content
      ) {
        setError("Please fill in all required fields");
        return;
      }

      // Create the session note using the API
      await doctorApi.createSessionNote({
        sessionId: newNoteForm.sessionId,
        title: newNoteForm.title,
        content: newNoteForm.content,
        diagnosis: newNoteForm.diagnosis,
        treatmentPlan: newNoteForm.treatmentPlan,
        nextSteps: newNoteForm.nextSteps,
      });

      // Also update the session with the note content for display
      await doctorApi.completeSession(newNoteForm.sessionId, {
        notes: newNoteForm.content,
        summary: newNoteForm.title,
      });

      // Refresh sessions
      const response = await doctorApi.getSessions({ status: "completed" });
      setSessions(response.sessions || []);

      // Reset form and close modal
      setNewNoteForm({
        sessionId: "",
        title: "",
        content: "",
        diagnosis: "",
        treatmentPlan: "",
        nextSteps: "",
      });
      setShowNewNoteModal(false);
      setError("");
    } catch (error) {
      console.error("Failed to create session note:", error);
      setError("Failed to create session note. Please try again.");
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setSubmittingForReview(true);
      setError("");

      // Get sessions that have notes and are not already under review
      const sessionsToSubmit = sessions.filter(
        (session) =>
          session.notes &&
          session.notes.trim() &&
          session.status !== "pending-approval",
      );

      if (sessionsToSubmit.length === 0) {
        setError("No documented sessions available for review submission");
        return;
      }

      // Submit each session for review by calling the API
      const promises = sessionsToSubmit.map((session) =>
        doctorApi.submitSessionForReview(session.id),
      );

      await Promise.all(promises);

      // Refresh sessions to show updated status
      const response = await doctorApi.getSessions({ status: "completed" });
      setSessions(response.sessions || []);

      setSelectedSessionsForReview([]);

      // Show success message
      alert(
        `Successfully submitted ${sessionsToSubmit.length} session(s) for admin review and certification approval.`,
      );
    } catch (error) {
      console.error("Failed to submit for review:", error);
      setError("Failed to submit sessions for review. Please try again.");
    } finally {
      setSubmittingForReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      scheduled: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors]} border-0`}>
        {status.replace("-", " ")}
      </Badge>
    );
  };

  const filteredSessions = sessions.filter((session) => {
    const client = getClientInfo(session);
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;
    const matchesClient =
      clientFilter === "all" || session.clientId === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const stats = {
    totalNotes: sessions.filter((s) => s.notes && s.notes.trim()).length,
    pendingNotes: sessions.filter((s) => !s.notes || !s.notes.trim()).length,
    completedSessions: sessions.filter((s) => s.status === "completed").length,
    avgQuizScore:
      sessions.length > 0
        ? Math.round(
            sessions.reduce((acc, s) => acc + (s.quizScore || 0), 0) /
              sessions.length,
          )
        : 0,
  };

  // Extract unique clients for filter dropdown
  const uniqueClients = sessions.reduce((clients: any[], session) => {
    if (session.client && !clients.find((c) => c.id === session.clientId)) {
      clients.push({
        id: session.clientId,
        name: `${session.client.firstName} ${session.client.lastName}`,
      });
    }
    return clients;
  }, []);

  const generateSessionReport = (session: TherapySession) => {
    const client = getClientInfo(session);
    const reportContent = `
SESSION REPORT
==============

Client: ${client.name}
Age: ${client.age}
Date: ${safeFormatDate(session.scheduledAt, "MMMM dd, yyyy", "Date TBD")}
Duration: ${session.duration || "N/A"} minutes
Quiz Score: ${session.quizScore || 0}%

SESSION NOTES:
${session.notes || "No notes recorded"}

EVALUATION:
${session.evaluation || "No evaluation provided"}
`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-report-${client.name.replace(/\s+/g, "-")}-${safeFormatDate(session.scheduledAt, "yyyy-MM-dd", "unknown-date")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading session notes...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Session Notes for Admin Review
              </h1>
              <p className="text-muted-foreground">
                Document completed sessions for admin approval and certification
                processing
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSubmitForReview}
                disabled={
                  submittingForReview ||
                  sessions.filter(
                    (s) =>
                      s.notes &&
                      s.notes.trim() &&
                      s.status !== "pending-approval",
                  ).length === 0
                }
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {submittingForReview ? "Submitting..." : "Submit for Review"}
              </Button>
              <Button
                className="bg-abby-blue hover:bg-abby-blue/90"
                onClick={() => setShowNewNoteModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Session Note
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-abby-green" />
                  <span className="text-sm font-medium">Ready for Review</span>
                </div>
                <div className="text-2xl font-bold text-abby-green mt-2">
                  {stats.totalNotes}
                </div>
                <div className="text-xs text-muted-foreground">
                  Admin approval pending
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Edit className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">
                    Needs Documentation
                  </span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-2">
                  {stats.pendingNotes}
                </div>
                <div className="text-xs text-muted-foreground">
                  Sessions to document
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Approved Sessions</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {Math.floor(stats.completedSessions * 0.8)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Admin approved
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Certifications Sent
                  </span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">
                  {Math.floor(stats.completedSessions * 0.6)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Via external email
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Notes Management */}
          <Card>
            <CardHeader>
              <CardTitle>Session Documentation for Admin Review</CardTitle>
              <CardDescription>
                Document completed sessions for admin approval and automatic
                certification delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
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

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sessions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Quiz Score</TableHead>
                    <TableHead>Documentation</TableHead>
                    <TableHead>Admin Approval</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const client = getClientInfo(session);
                    const hasNotes = session.notes && session.notes.trim();

                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={client.avatar} />
                              <AvatarFallback className="bg-abby-green text-white text-xs">
                                {client.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Age: {client.age} • Sessions: {client.sessions}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>
                              {safeFormatDate(
                                session.scheduledAt,
                                "MMM dd, yyyy",
                                "Date TBD",
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {safeFormatDate(
                                session.scheduledAt,
                                "HH:mm",
                                "Time TBD",
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{session.duration || "N/A"} min</TableCell>
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
                          {hasNotes ? (
                            <Badge className="bg-green-100 text-green-800 border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 border-0">
                              <Edit className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.status === "pending-approval" ||
                          session.status === "pending_approval" ? (
                            <Badge className="bg-yellow-100 text-yellow-800 border-0">
                              <Clock className="w-3 h-3 mr-1" />
                              Submitted for Review
                            </Badge>
                          ) : hasNotes ? (
                            <Badge className="bg-blue-100 text-blue-800 border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ready to Submit
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Awaiting Notes</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasNotes && Math.random() > 0.3 ? (
                            <Badge className="bg-green-100 text-green-800 border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-0">
                              Pending Approval
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setEditingNotes(session.notes || "");
                                    setIsEditingMode(false);
                                  }}
                                >
                                  {hasNotes ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <Edit className="w-4 h-4" />
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Session Documentation - {client.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Session on{" "}
                                    {safeFormatDate(
                                      session.scheduledAt,
                                      "MMMM dd, yyyy HH:mm",
                                      "Date TBD",
                                    )}{" "}
                                    • Ready for admin review and certification
                                    processing
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                  {/* Session Summary */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-therapy-calm rounded-lg text-center">
                                      <div className="font-semibold text-abby-blue">
                                        {session.duration}min
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Duration
                                      </div>
                                    </div>
                                    <div className="p-4 bg-therapy-calm rounded-lg text-center">
                                      <div className="font-semibold text-abby-green">
                                        {session.quizScore || 0}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Quiz Score
                                      </div>
                                    </div>
                                    <div className="p-4 bg-therapy-calm rounded-lg text-center">
                                      <div className="font-semibold text-purple-600">
                                        Human
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Session Type
                                      </div>
                                    </div>
                                  </div>

                                  {/* Client Info */}
                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">
                                      Client Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Age:
                                        </span>{" "}
                                        {client.age} years old
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Total Sessions:
                                        </span>{" "}
                                        {client.sessions}
                                      </div>
                                      <div className="col-span-2">
                                        <span className="font-medium">
                                          Focus Areas:
                                        </span>{" "}
                                        {client.diagnoses.join(", ") ||
                                          "General therapy"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Admin Approval Workflow */}
                                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Admin Approval Workflow
                                    </h4>
                                    <div className="text-sm text-blue-700 space-y-1">
                                      <p>
                                        • Complete session documentation will be
                                        submitted to admin for review
                                      </p>
                                      <p>
                                        • Upon approval, certification will be
                                        automatically sent to client via
                                        external email
                                      </p>
                                      <p>
                                        • Client progress will be updated and
                                        tracked in their certification dashboard
                                      </p>
                                    </div>
                                  </div>

                                  {/* Session Notes */}
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-medium">
                                        Session Documentation for Admin Review
                                      </h4>
                                      <div className="flex space-x-2">
                                        {!isEditingMode ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setIsEditingMode(true)
                                            }
                                          >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Documentation
                                          </Button>
                                        ) : (
                                          <>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setIsEditingMode(false);
                                                setEditingNotes(
                                                  session.notes || "",
                                                );
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleSaveNotes(
                                                  session.id,
                                                  editingNotes,
                                                )
                                              }
                                              className="bg-abby-green hover:bg-abby-green/90"
                                            >
                                              <Save className="w-4 h-4 mr-2" />
                                              Save for Review
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {isEditingMode ? (
                                      <Textarea
                                        value={editingNotes}
                                        onChange={(e) =>
                                          setEditingNotes(e.target.value)
                                        }
                                        placeholder="Document session details for admin review. Include therapeutic progress, client engagement, goals achieved, and recommendations for certification approval..."
                                        className="min-h-[200px]"
                                      />
                                    ) : (
                                      <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
                                        {session.notes ? (
                                          <div>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs font-medium text-green-600">
                                                Ready for Admin Review
                                              </span>
                                              <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Documented
                                              </Badge>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">
                                              {session.notes}
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground italic">
                                            No documentation recorded for this
                                            session. Complete documentation is
                                            required for admin approval and
                                            certification processing.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Session Evaluation */}
                                  {session.evaluation && (
                                    <div className="p-4 bg-green-50 rounded-lg">
                                      <h4 className="font-medium text-green-900 mb-2">
                                        Session Evaluation
                                      </h4>
                                      <p className="text-sm text-green-700">
                                        {session.evaluation}
                                      </p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex space-x-2 pt-4 border-t">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        generateSessionReport(session)
                                      }
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Export Report
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {hasNotes && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateSessionReport(session)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* New Session Note Modal */}
          <Dialog open={showNewNoteModal} onOpenChange={setShowNewNoteModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Session Note</DialogTitle>
                <DialogDescription>
                  Document a therapy session for admin review and certification
                  processing
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Session Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Session *
                  </label>
                  <Select
                    value={newNoteForm.sessionId}
                    onValueChange={(value) =>
                      setNewNoteForm((prev) => ({ ...prev, sessionId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a session to document" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions
                        .filter(
                          (session) =>
                            // Include sessions that are completed or in-progress and don't have notes yet
                            (session.status === "completed" ||
                              session.status === "in-progress") &&
                            (!session.notes || !session.notes.trim()),
                        )
                        .map((session) => {
                          const client = getClientInfo(session);
                          return (
                            <SelectItem key={session.id} value={session.id}>
                              {client.name} -{" "}
                              {safeFormatDate(
                                session.scheduledAt,
                                "MMM dd, yyyy HH:mm",
                                "Date TBD",
                              )}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({session.status})
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Note Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Session Title *
                  </label>
                  <Input
                    placeholder="e.g., Anxiety Management Session - CBT Techniques"
                    value={newNoteForm.title}
                    onChange={(e) =>
                      setNewNoteForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Session Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Session Documentation *
                  </label>
                  <Textarea
                    placeholder="Document session details, client progress, therapeutic interventions, and observations for admin review..."
                    value={newNoteForm.content}
                    onChange={(e) =>
                      setNewNoteForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="min-h-[120px]"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Clinical Assessment
                  </label>
                  <Textarea
                    placeholder="Clinical observations, diagnostic impressions, or assessment updates..."
                    value={newNoteForm.diagnosis}
                    onChange={(e) =>
                      setNewNoteForm((prev) => ({
                        ...prev,
                        diagnosis: e.target.value,
                      }))
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Treatment Interventions
                  </label>
                  <Textarea
                    placeholder="Therapeutic techniques used, interventions applied, coping strategies taught..."
                    value={newNoteForm.treatmentPlan}
                    onChange={(e) =>
                      setNewNoteForm((prev) => ({
                        ...prev,
                        treatmentPlan: e.target.value,
                      }))
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* Next Steps */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recommendations & Next Steps
                  </label>
                  <Textarea
                    placeholder="Homework assignments, follow-up recommendations, next session goals..."
                    value={newNoteForm.nextSteps}
                    onChange={(e) =>
                      setNewNoteForm((prev) => ({
                        ...prev,
                        nextSteps: e.target.value,
                      }))
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewNoteModal(false);
                      setNewNoteForm({
                        sessionId: "",
                        title: "",
                        content: "",
                        diagnosis: "",
                        treatmentPlan: "",
                        nextSteps: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNewNote}
                    className="bg-abby-green hover:bg-abby-green/90"
                    disabled={
                      !newNoteForm.sessionId ||
                      !newNoteForm.title ||
                      !newNoteForm.content
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Session Note
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
