import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle, Users, Filter } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Session {
  id: string;
  type: string;
  status: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  topic: string;
  summary?: string;
  clientName: string;
  clientEmail: string;
  doctorName?: string;
  doctorEmail?: string;
  needsAssignment: boolean;
  createdAt: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  experience: number;
  workingHours: any;
}

export default function SessionManagement() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningLoading, setAssigningLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  useEffect(() => {
    loadData();
  }, [filterStatus, filterAssignment]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load sessions with filters
      const filters: any = {};
      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterAssignment === "unassigned") filters.needsAssignment = "true";

      const [sessionsResponse, doctorsResponse] = await Promise.all([
        adminApi.getSessions(filters),
        adminApi.getDoctors()
      ]);

      setSessions(sessionsResponse.sessions || []);
      setDoctors(doctorsResponse.doctors || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load sessions and doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedSession || !selectedDoctor) return;

    try {
      setAssigningLoading(selectedSession.id);
      setError("");

      await adminApi.assignDoctor(selectedSession.id, selectedDoctor);

      setSuccess(`Doctor assigned successfully to session with ${selectedSession.clientName}`);
      setSelectedSession(null);
      setSelectedDoctor("");
      
      // Reload sessions
      await loadData();
    } catch (error) {
      console.error("Failed to assign doctor:", error);
      setError("Failed to assign doctor to session");
    } finally {
      setAssigningLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "human" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  const unassignedSessions = sessions.filter(s => s.needsAssignment);
  const assignedSessions = sessions.filter(s => !s.needsAssignment);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Only administrators can access session management.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login">
              <Button className="bg-abby-blue hover:bg-abby-blue/90">
                Sign In as Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Session Management
              </span>
              <Button variant="ghost" size="sm" onClick={loadData}>
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Session Management
            </h1>
            <p className="text-lg text-muted-foreground">
              Review and assign therapists to client session requests
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

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignment</label>
                  <Select value={filterAssignment} onValueChange={setFilterAssignment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="unassigned">Needs Assignment</SelectItem>
                      <SelectItem value="assigned">Already Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={loadData} variant="outline" className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-abby-blue">{sessions.length}</div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{unassignedSessions.length}</div>
                <div className="text-sm text-muted-foreground">Need Assignment</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{assignedSessions.length}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{doctors.length}</div>
                <div className="text-sm text-muted-foreground">Available Doctors</div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Sessions
              </CardTitle>
              <CardDescription>
                Manage client session requests and therapist assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading sessions...</div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No sessions found with current filters</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id} className={`${session.needsAssignment ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge className={getTypeColor(session.type)}>
                                {session.type === 'human' ? 'Human Therapist' : 'AI Therapy'}
                              </Badge>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status.replace('_', ' ')}
                              </Badge>
                              {session.needsAssignment && (
                                <Badge variant="destructive">
                                  Needs Assignment
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  Client
                                </div>
                                <div className="text-muted-foreground">{session.clientName}</div>
                                <div className="text-xs text-muted-foreground">{session.clientEmail}</div>
                              </div>

                              <div>
                                <div className="font-medium flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Scheduled
                                </div>
                                <div className="text-muted-foreground">
                                  {new Date(session.scheduledAt).toLocaleString()}
                                </div>
                              </div>

                              <div>
                                <div className="font-medium flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  Therapist
                                </div>
                                <div className="text-muted-foreground">
                                  {session.doctorName || (
                                    <span className="text-orange-600 font-medium">Not Assigned</span>
                                  )}
                                </div>
                                {session.doctorEmail && (
                                  <div className="text-xs text-muted-foreground">{session.doctorEmail}</div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="font-medium text-sm">Session Topic:</div>
                              <div className="text-muted-foreground text-sm">{session.topic}</div>
                            </div>
                          </div>

                          {session.needsAssignment && session.type === 'human' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="ml-4 bg-orange-600 hover:bg-orange-700"
                                  onClick={() => setSelectedSession(session)}
                                >
                                  Assign Therapist
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Therapist</DialogTitle>
                                  <DialogDescription>
                                    Select a therapist for {session.clientName}'s session on {new Date(session.scheduledAt).toLocaleString()}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Session Topic:</label>
                                    <p className="text-muted-foreground">{session.topic}</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Therapist:</label>
                                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a therapist" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {doctors.map((doctor) => (
                                          <SelectItem key={doctor.id} value={doctor.id}>
                                            <div className="flex flex-col">
                                              <span className="font-medium">{doctor.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {doctor.specializations.slice(0, 2).join(", ")} • {doctor.experience} years
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={handleAssignDoctor}
                                      disabled={!selectedDoctor || assigningLoading === session.id}
                                      className="flex-1 bg-abby-blue hover:bg-abby-blue/90"
                                    >
                                      {assigningLoading === session.id ? "Assigning..." : "Assign Therapist"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedSession(null);
                                        setSelectedDoctor("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
