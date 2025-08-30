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
import { Label } from "@/components/ui/label";
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
  Stethoscope,
  UserCheck,
  UserX,
  Eye,
  Search,
  Filter,
  Plus,
  Star,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { User } from "@shared/types";
import { adminApi } from "@/lib/api";

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Add Doctor Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [addDoctorForm, setAddDoctorForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    licenseNumber: "",
    specializations: "",
    education: "",
    experience: "",
    bio: "",
    phone: ""
  });

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getDoctors();
        setDoctors(response.doctors || []);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        setError('Failed to load doctors data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDoctorStatusUpdate = async (
    doctorId: string,
    approved: boolean,
  ) => {
    try {
      await adminApi.approveDcotor(doctorId, approved);

      // Update local state
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === doctorId
            ? {
                ...doctor,
                isActive: approved,
                doctorProfile: {
                  ...doctor.doctorProfile,
                  isApproved: approved
                }
              }
            : doctor,
        ),
      );
    } catch (error) {
      console.error('Failed to update doctor status:', error);
      setError('Failed to update doctor status. Please try again.');
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingDoctor) return;

    try {
      setAddingDoctor(true);
      setError(null);

      const doctorData = {
        email: addDoctorForm.email,
        firstName: addDoctorForm.firstName,
        lastName: addDoctorForm.lastName,
        licenseNumber: addDoctorForm.licenseNumber,
        specializations: addDoctorForm.specializations
          ? addDoctorForm.specializations.split(',').map(s => s.trim())
          : [],
        education: addDoctorForm.education
          ? addDoctorForm.education.split(',').map(s => s.trim())
          : [],
        experience: parseInt(addDoctorForm.experience) || 0,
        bio: addDoctorForm.bio || undefined,
        phone: addDoctorForm.phone || undefined
      };

      const response = await adminApi.createDoctor(doctorData);

      // Add new doctor to list
      setDoctors(prev => [response.doctor, ...prev]);

      // Reset form and close dialog
      setAddDoctorForm({
        email: "",
        firstName: "",
        lastName: "",
        licenseNumber: "",
        specializations: "",
        education: "",
        experience: "",
        bio: "",
        phone: ""
      });
      setShowAddDialog(false);

      // Show success message (you could implement a toast here)
      alert(`Doctor created successfully! Temporary password: ${response.tempPassword}`);
    } catch (error: any) {
      console.error('Failed to create doctor:', error);
      setError(error.message || 'Failed to create doctor. Please try again.');
    } finally {
      setAddingDoctor(false);
    }
  };

  const getStatusBadge = (doctor: any) => {
    const isApproved = doctor.doctorProfile?.isApproved;
    const isActive = doctor.isActive;

    let status, color;
    if (isApproved && isActive) {
      status = "Active";
      color = "bg-green-100 text-green-800";
    } else if (!isApproved) {
      status = "Pending";
      color = "bg-yellow-100 text-yellow-800";
    } else {
      status = "Inactive";
      color = "bg-red-100 text-red-800";
    }

    return <Badge className={`${color} border-0`}>{status}</Badge>;
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== "all") {
      const isApproved = doctor.doctorProfile?.isApproved;
      const isActive = doctor.isActive;

      if (statusFilter === "active") {
        matchesStatus = isApproved && isActive;
      } else if (statusFilter === "pending") {
        matchesStatus = !isApproved;
      } else if (statusFilter === "suspended") {
        matchesStatus = isApproved && !isActive;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: doctors.length,
    active: doctors.filter((d) => d.doctorProfile?.isApproved && d.isActive).length,
    pending: doctors.filter((d) => !d.doctorProfile?.isApproved).length,
    suspended: doctors.filter((d) => d.doctorProfile?.isApproved && !d.isActive).length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-green mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading doctors...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && doctors.length === 0) {
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
                Doctor Management
              </h1>
              <p className="text-muted-foreground">
                Manage therapist accounts and professional credentials
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-abby-green hover:bg-abby-green/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Create a new doctor account. A temporary password will be generated.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddDoctor} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={addDoctorForm.firstName}
                        onChange={(e) => setAddDoctorForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={addDoctorForm.lastName}
                        onChange={(e) => setAddDoctorForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={addDoctorForm.email}
                      onChange={(e) => setAddDoctorForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="doctor@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber">License Number *</Label>
                      <Input
                        id="licenseNumber"
                        value={addDoctorForm.licenseNumber}
                        onChange={(e) => setAddDoctorForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        placeholder="LIC-123456"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={addDoctorForm.phone}
                        onChange={(e) => setAddDoctorForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specializations">Specializations</Label>
                    <Input
                      id="specializations"
                      value={addDoctorForm.specializations}
                      onChange={(e) => setAddDoctorForm(prev => ({ ...prev, specializations: e.target.value }))}
                      placeholder="Anxiety, Depression, PTSD (comma-separated)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      value={addDoctorForm.education}
                      onChange={(e) => setAddDoctorForm(prev => ({ ...prev, education: e.target.value }))}
                      placeholder="PhD Psychology, MD (comma-separated)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={addDoctorForm.experience}
                      onChange={(e) => setAddDoctorForm(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="5"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={addDoctorForm.bio}
                      onChange={(e) => setAddDoctorForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief professional bio..."
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-4">
                    <Button
                      type="submit"
                      disabled={addingDoctor}
                      className="bg-abby-green hover:bg-abby-green/90"
                    >
                      {addingDoctor ? "Creating..." : "Create Doctor"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      disabled={addingDoctor}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-abby-green" />
                  <span className="text-sm font-medium">Total Doctors</span>
                </div>
                <div className="text-2xl font-bold text-abby-green mt-2">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {stats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-yellow-600" />
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
                  <UserX className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Suspended</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  {stats.suspended}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctors List */}
          <Card>
            <CardHeader>
              <CardTitle>Licensed Therapists</CardTitle>
              <CardDescription>
                View and manage all therapist accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search doctors..."
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
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => {
                    const profile = doctor.doctorProfile;
                    const isApproved = profile?.isApproved;
                    const sessionsCount = doctor._count?.sessionsAsDoctor || 0;

                    return (
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
                                Dr. {doctor.firstName} {doctor.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {profile?.licenseNumber || "Pending verification"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {profile?.specializations
                              ?.slice(0, 2)
                              .map((spec) => (
                                <Badge
                                  key={spec}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {spec}
                                </Badge>
                              )) || (
                              <span className="text-sm text-muted-foreground">Not specified</span>
                            )}
                            {profile?.specializations && profile.specializations.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{profile.specializations.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              N/A
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(doctor)}</TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {sessionsCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!isApproved && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  handleDoctorStatusUpdate(doctor.id, true)
                                }
                                title="Approve Doctor"
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}
                            {isApproved && doctor.isActive && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDoctorStatusUpdate(doctor.id, false)
                                }
                                title="Suspend Doctor"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedDoctor(doctor)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Doctor Profile</DialogTitle>
                                  <DialogDescription>
                                    Professional information and credentials
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedDoctor && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">
                                          Name
                                        </label>
                                        <p className="text-sm">
                                          Dr. {selectedDoctor.firstName}{" "}
                                          {selectedDoctor.lastName}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Email
                                        </label>
                                        <p className="text-sm">
                                          {selectedDoctor.email}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          License Number
                                        </label>
                                        <p className="text-sm">
                                          {selectedDoctor.doctorProfile?.licenseNumber || "Pending"}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Experience
                                        </label>
                                        <p className="text-sm">
                                          {selectedDoctor.doctorProfile?.experience || 0} years
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Phone
                                        </label>
                                        <p className="text-sm">
                                          {selectedDoctor.phone || "Not provided"}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">
                                          Sessions Completed
                                        </label>
                                        <p className="text-sm">
                                          {selectedDoctor._count?.sessionsAsDoctor || 0}
                                        </p>
                                      </div>
                                    </div>

                                    {selectedDoctor.doctorProfile?.specializations && (
                                      <div>
                                        <label className="text-sm font-medium">
                                          Specializations
                                        </label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {selectedDoctor.doctorProfile.specializations.map((spec) => (
                                            <Badge key={spec} variant="secondary">
                                              {spec}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {selectedDoctor.doctorProfile?.education && (
                                      <div>
                                        <label className="text-sm font-medium">
                                          Education
                                        </label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {selectedDoctor.doctorProfile.education.map((edu) => (
                                            <Badge key={edu} variant="outline">
                                              {edu}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {selectedDoctor.doctorProfile?.bio && (
                                      <div>
                                        <label className="text-sm font-medium">
                                          Bio
                                        </label>
                                        <p className="text-sm mt-1">
                                          {selectedDoctor.doctorProfile.bio}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex space-x-2 pt-4 border-t">
                                      {!selectedDoctor.doctorProfile?.isApproved && (
                                        <Button
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() =>
                                            handleDoctorStatusUpdate(
                                              selectedDoctor.id,
                                              true,
                                            )
                                          }
                                        >
                                          Approve Doctor
                                        </Button>
                                      )}
                                      {selectedDoctor.doctorProfile?.isApproved && selectedDoctor.isActive && (
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleDoctorStatusUpdate(
                                              selectedDoctor.id,
                                              false,
                                            )
                                          }
                                        >
                                          Suspend Doctor
                                        </Button>
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
