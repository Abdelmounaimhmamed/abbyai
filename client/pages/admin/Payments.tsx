import { useState, useEffect } from "react";
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
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Download,
} from "lucide-react";
import { PaymentInfo } from "@shared/types";
import { adminApi } from "@/lib/api";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [exporting, setExporting] = useState(false);

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getPayments();
        setPayments(response.payments || []);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
        setError('Failed to load payments data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handlePaymentStatusUpdate = async (
    paymentId: string,
    verified: boolean,
    notes?: string,
  ) => {
    try {
      await adminApi.verifyPayment(paymentId, verified);

      // Update local state
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                status: verified ? "completed" : "pending",
                isVerified: verified,
                verifiedAt: verified ? new Date().toISOString() : null,
              }
            : payment,
        ),
      );
    } catch (error) {
      console.error('Failed to update payment status:', error);
      setError('Failed to update payment status. Please try again.');
    }
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      setError(null);

      const filters = {
        format: 'csv',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      await adminApi.exportPayments(filters);
    } catch (error) {
      console.error('Failed to export report:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (payment: any) => {
    const status = payment.isVerified ? "verified" : payment.status;
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      verified: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };

    const displayStatus = payment.isVerified ? "Verified" : payment.status;
    return <Badge className={`${colors[status]} border-0`}>{displayStatus}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      paypal: "bg-blue-100 text-blue-800",
      "bank_transfer": "bg-purple-100 text-purple-800",
    };

    return (
      <Badge variant="outline" className={`${colors[method]} border-0`}>
        {method === "bank_transfer" ? "Bank Transfer" : "PayPal"}
      </Badge>
    );
  };

  const filteredPayments = payments.filter((payment) => {
    const userName = `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim();
    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "verified") {
        matchesStatus = payment.isVerified;
      } else {
        matchesStatus = payment.status === statusFilter;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    verified: payments.filter((p) => p.isVerified).length,
    rejected: payments.filter((p) => p.status === "failed").length,
    totalAmount: payments
      .filter((p) => p.isVerified)
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && payments.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Payment Management
              </h1>
              <p className="text-muted-foreground">
                Verify and manage client payments and subscriptions
              </p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleExportReport}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export Report"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-abby-blue" />
                  <span className="text-sm font-medium">Total Payments</span>
                </div>
                <div className="text-2xl font-bold text-abby-blue mt-2">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {stats.verified}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  {stats.rejected}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  ${stats.totalAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                Review and verify client payment submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search payments..."
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
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const userName = `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim();
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {userName || 'Unknown User'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.user?.email || 'No email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${Number(payment.amount).toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.currency}
                          </div>
                        </TableCell>
                        <TableCell>{getMethodBadge(payment.paymentMethod)}</TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {payment.transactionId || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {payment.status === "pending" && !payment.isVerified && (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setAdminNotes("");
                                      }}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Verify Payment</DialogTitle>
                                      <DialogDescription>
                                        Confirm this payment has been received
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">
                                            Client Name
                                          </label>
                                          <p className="text-sm">
                                            {userName || 'Unknown User'}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">
                                            Amount
                                          </label>
                                          <p className="text-sm">
                                            ${Number(payment.amount).toFixed(2)} {payment.currency}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">
                                            Method
                                          </label>
                                          <p className="text-sm capitalize">
                                            {payment.paymentMethod.replace("_", " ")}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">
                                            Transaction ID
                                          </label>
                                          <p className="text-sm font-mono">
                                            {payment.transactionId || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Admin Notes
                                        </label>
                                        <Textarea
                                          value={adminNotes}
                                          onChange={(e) =>
                                            setAdminNotes(e.target.value)
                                          }
                                          placeholder="Add verification notes..."
                                          className="mt-2"
                                        />
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button
                                          onClick={() => {
                                            handlePaymentStatusUpdate(
                                              payment.id,
                                              true,
                                              adminNotes,
                                            );
                                            setSelectedPayment(null);
                                          }}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Verify Payment
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => {
                                            handlePaymentStatusUpdate(
                                              payment.id,
                                              false,
                                              adminNotes,
                                            );
                                            setSelectedPayment(null);
                                          }}
                                        >
                                          Reject Payment
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handlePaymentStatusUpdate(
                                      payment.id,
                                      false,
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
                                  <DialogDescription>
                                    Complete payment information
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPayment && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">
                                          Client Name
                                        </label>
                                        <p className="text-sm">
                                          {`${selectedPayment.user?.firstName || ''} ${selectedPayment.user?.lastName || ''}`.trim() || 'Unknown User'}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Amount
                                        </label>
                                        <p className="text-sm">
                                          ${Number(selectedPayment.amount).toFixed(2)}{" "}
                                          {selectedPayment.currency}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Method
                                        </label>
                                        <p className="text-sm">
                                          {getMethodBadge(selectedPayment.paymentMethod)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Status
                                        </label>
                                        <p className="text-sm">
                                          {getStatusBadge(selectedPayment)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Transaction ID
                                        </label>
                                        <p className="text-sm font-mono">
                                          {selectedPayment.transactionId || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          User ID
                                        </label>
                                        <p className="text-sm">
                                          {selectedPayment.userId}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Submitted
                                        </label>
                                        <p className="text-sm">
                                          {new Date(
                                            selectedPayment.createdAt,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      {selectedPayment.verifiedAt && (
                                        <div>
                                          <label className="text-sm font-medium">
                                            Verified
                                          </label>
                                          <p className="text-sm">
                                            {new Date(
                                              selectedPayment.verifiedAt,
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
