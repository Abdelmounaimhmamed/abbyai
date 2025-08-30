import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import {
  Users,
  DollarSign,
  Activity,
  Award,
  UserCheck,
  UserX,
  CreditCard,
  Stethoscope,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  AdminDashboardStats,
  User,
  PaymentInfo,
  APIKeyConfig,
} from "@shared/types";
import { adminApi } from "@/lib/api";

// Interface for admin dashboard data
interface DashboardData {
  stats: AdminDashboardStats;
  clients: User[];
  doctors: User[];
  payments: PaymentInfo[];
  apiKeys: APIKeyConfig[];
  sessions: any[];
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentInfo | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all required data in parallel
        const [usersResponse, doctorsResponse, sessionsResponse] = await Promise.all([
          adminApi.getUsers({ role: 'client' }),
          adminApi.getDoctors(),
          adminApi.getSessions()
        ]);

        const clients = usersResponse.users || [];
        const doctors = doctorsResponse.doctors || [];
        const sessions = sessionsResponse.sessions || [];

        // Calculate stats from real data
        const stats: AdminDashboardStats = {
          totalClients: clients.length,
          totalDoctors: doctors.length,
          activeSessions: sessions.filter(s => s.status === 'active').length,
          pendingPayments: 0, // Will be updated when payments API is implemented
          completedSessions: sessions.filter(s => s.status === 'completed').length,
          pendingApprovals: clients.filter(c => c.status === 'pending').length + doctors.filter(d => d.status === 'pending').length,
          revenue: 0, // Will be calculated from payments
          certificationsIssued: 0 // Will be updated when certifications API is implemented
        };

        setDashboardData({
          stats,
          clients,
          doctors,
          payments: [], // Will be populated when payments API is ready
          apiKeys: [], // Will be populated when API keys are implemented
          sessions
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !dashboardData) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error || 'Failed to load dashboard data'}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const { stats, clients, doctors, payments, apiKeys } = dashboardData;

  const handleUserStatusUpdate = async (
    userId: string,
    newStatus: User["status"],
  ) => {
    try {
      const isActive = newStatus === 'active';
      await adminApi.updateUserStatus(userId, isActive);

      // Update local state
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          clients: prev.clients.map((client) =>
            client.id === userId ? { ...client, status: newStatus } : client,
          ),
          doctors: prev.doctors.map((doctor) =>
            doctor.id === userId ? { ...doctor, status: newStatus } : doctor,
          )
        };
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
      setError('Failed to update user status. Please try again.');
    }
  };

  const handlePaymentStatusUpdate = async (
    paymentId: string,
    newStatus: PaymentInfo["status"],
    notes?: string,
  ) => {
    try {
      const verified = newStatus === 'verified';
      await adminApi.verifyPayment(paymentId, verified);

      // Update local state
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          payments: prev.payments.map((payment) =>
            payment.id === paymentId
              ? {
                  ...payment,
                  status: newStatus,
                  adminNotes: notes,
                  verifiedAt:
                    newStatus === "verified" ? new Date().toISOString() : undefined,
                }
              : payment,
          )
        };
      });
    } catch (error) {
      console.error('Failed to update payment status:', error);
      setError('Failed to update payment status. Please try again.');
    }
  };

  const handleApiKeyToggle = async (keyId: string) => {
    try {
      const currentKey = apiKeys.find(k => k.id === keyId);
      if (!currentKey) return;

      await adminApi.updateAPIKey(keyId, { isActive: !currentKey.isActive });

      // Update local state
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          apiKeys: prev.apiKeys.map((key) => {
            if (key.id === keyId) {
              return { ...key, isActive: !key.isActive };
            } else if (!key.isActive) {
              return key;
            } else {
              return { ...key, isActive: false };
            }
          })
        };
      });
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      setError('Failed to update API key. Please try again.');
    }
  };

  const getStatusBadge = (status: User["status"] | PaymentInfo["status"]) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
      deactivated: "bg-gray-100 text-gray-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const displayText = {
      active: "Active",
      pending: "Pending Payment",
      suspended: "Suspended (Payment)",
      deactivated: "Deactivated",
      verified: "Verified",
      rejected: "Rejected",
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors]} border-0`}>
        {displayText[status as keyof typeof displayText] || status}
      </Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage users, payments, and platform configuration
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/sessions">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Sessions
                </Button>
              </Link>
              <Link to="/admin/doctors">
                <Button variant="outline">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Doctors
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abby-blue">
                  {stats.totalClients}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abby-green">
                  {stats.activeSessions}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedSessions} total completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingPayments} pending payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Certifications
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.certificationsIssued}
                </div>
                <p className="text-xs text-muted-foreground">
                  Issued this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="approvals" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="approvals">Session Requests</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="doctors">Doctors</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            </TabsList>

            {/* Session Approval Requests Tab */}
            <TabsContent value="approvals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Approval Requests</CardTitle>
                  <CardDescription>
                    Client requests for human therapy sessions waiting for admin approval and doctor assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Session Type</TableHead>
                        <TableHead>Preferred Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.sessions
                        .filter(session => session.status === 'scheduled' && !session.doctorId)
                        .map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={session.client?.avatar} />
                                <AvatarFallback className="bg-abby-blue text-white text-xs">
                                  {session.client?.firstName?.[0]}
                                  {session.client?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {session.client?.firstName} {session.client?.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {session.client?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {session.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">
                                {new Date(session.scheduledAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.scheduledAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={session.topic}>
                              {session.topic || 'General consultation'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800 border-0">
                              Awaiting Assignment
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  navigate('/admin/sessions');
                                }}
                              >
                                Assign Doctor
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  // TODO: Implement session rejection
                                  alert('Session rejection feature coming soon!');
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {dashboardData.sessions.filter(session => session.status === 'scheduled' && !session.doctorId).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="text-muted-foreground">
                              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p>No session approval requests at this time</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Management</CardTitle>
                  <CardDescription>
                    Manage client accounts, payment status, and access control. Deactivate accounts for payment issues.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={client.avatar} />
                                <AvatarFallback className="bg-abby-blue text-white text-xs">
                                  {client.firstName[0]}
                                  {client.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {client.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{getStatusBadge(client.status)}</TableCell>
                          <TableCell>
                            {new Date(client.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {client.status === "pending" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleUserStatusUpdate(client.id, "active")
                                  }
                                  title="Activate Account (Payment Received)"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                              {client.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleUserStatusUpdate(
                                      client.id,
                                      "suspended",
                                    )
                                  }
                                  title="Deactivate Account (Payment Issue)"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              )}
                              {client.status === "suspended" && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() =>
                                    handleUserStatusUpdate(client.id, "active")
                                  }
                                  title="Reactivate Account (Payment Received)"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedUser(client)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Client Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedUser && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Name</Label>
                                          <p className="text-sm">
                                            {selectedUser.firstName}{" "}
                                            {selectedUser.lastName}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Email</Label>
                                          <p className="text-sm">
                                            {selectedUser.email}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Account Status</Label>
                                          <div className="flex items-center space-x-2">
                                            {getStatusBadge(
                                              selectedUser.status,
                                            )}
                                            {selectedUser.status === "suspended" && (
                                              <span className="text-xs text-red-600">
                                                (Payment Required)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Last Login</Label>
                                          <p className="text-sm">
                                            {selectedUser.lastLogin
                                              ? new Date(
                                                  selectedUser.lastLogin,
                                                ).toLocaleString()
                                              : "Never"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Doctors Tab */}
            <TabsContent value="doctors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Management</CardTitle>
                  <CardDescription>
                    Manage therapist accounts and approvals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={doctor.avatar} />
                                <AvatarFallback className="bg-abby-green text-white text-xs">
                                  <Stethoscope className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {doctor.firstName} {doctor.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {doctor.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{getStatusBadge(doctor.status)}</TableCell>
                          <TableCell>
                            {new Date(doctor.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {doctor.status === "pending" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleUserStatusUpdate(doctor.id, "active")
                                  }
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Management</CardTitle>
                  <CardDescription>
                    Verify and manage client payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.accountName}</TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.method.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {payment.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handlePaymentStatusUpdate(
                                        payment.id,
                                        "verified",
                                      )
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handlePaymentStatusUpdate(
                                        payment.id,
                                        "rejected",
                                      )
                                    }
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Payment Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedPayment && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Account Name</Label>
                                          <p className="text-sm">
                                            {selectedPayment.accountName}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Amount</Label>
                                          <p className="text-sm">
                                            ${selectedPayment.amount}{" "}
                                            {selectedPayment.currency}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Method</Label>
                                          <p className="text-sm capitalize">
                                            {selectedPayment.method.replace(
                                              "-",
                                              " ",
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Transaction ID</Label>
                                          <p className="text-sm">
                                            {selectedPayment.transactionId ||
                                              "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                      {selectedPayment.adminNotes && (
                                        <div>
                                          <Label>Admin Notes</Label>
                                          <p className="text-sm">
                                            {selectedPayment.adminNotes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Key Management</CardTitle>
                  <CardDescription>
                    Manage Cohere AI API keys for the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-3 h-3 rounded-full ${key.isActive ? "bg-green-500" : "bg-gray-400"}`}
                          />
                          <div>
                            <div className="font-medium">{key.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {key.keyPreview} • {key.usageCount} uses
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created:{" "}
                              {new Date(key.createdAt).toLocaleDateString()}
                              {key.lastUsed &&
                                ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={key.isActive ? "default" : "secondary"}
                          >
                            {key.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant={key.isActive ? "destructive" : "default"}
                            onClick={() => handleApiKeyToggle(key.id)}
                          >
                            {key.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button className="w-full" variant="outline">
                      <Key className="w-4 h-4 mr-2" />
                      Add New API Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
