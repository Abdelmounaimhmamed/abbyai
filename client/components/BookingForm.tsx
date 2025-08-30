import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, User, AlertCircle, CheckCircle, Brain } from "lucide-react";
import { clientApi } from "@/lib/api";

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  specializations: string[];
  experience: number;
  bio: string;
  workingHours: any;
  sessionDuration: number;
}

interface BookingFormProps {
  onSuccess?: (session: any) => void;
  onCancel?: () => void;
}

export default function BookingForm({ onSuccess, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    preferredDate: "",
    preferredTime: "",
    reason: "",
    doctorId: "auto-assign",
    sessionType: "human"
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load available doctors only when human therapy is selected
  useEffect(() => {
    if (formData.sessionType === "human") {
      const loadDoctors = async () => {
        try {
          setLoadingDoctors(true);
          setError("");
          const response = await clientApi.getDoctors();
          setDoctors(response.doctors || []);
        } catch (error) {
          console.error("Failed to load doctors:", error);
          setError("Failed to load available doctors");
        } finally {
          setLoadingDoctors(false);
        }
      };

      loadDoctors();
    } else {
      // Reset doctors when not using human therapy
      setDoctors([]);
      setLoadingDoctors(false);
      setFormData(prev => ({ ...prev, doctorId: "auto-assign" }));
    }
  }, [formData.sessionType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate form
      if (!formData.preferredDate || !formData.preferredTime || !formData.reason) {
        setError("Please fill in all required fields");
        return;
      }

      // Check if the selected date is in the future (allow at least 30 minutes from now)
      // Use ISO string format for consistent timezone handling
      const selectedDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime}:00`);
      const now = new Date();
      const minimumFutureTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

      // Log for debugging
      console.log('Date validation:', {
        selectedDate: formData.preferredDate,
        selectedTime: formData.preferredTime,
        selectedDateTime: selectedDateTime.toISOString(),
        now: now.toISOString(),
        minimumFutureTime: minimumFutureTime.toISOString(),
        isValid: selectedDateTime >= minimumFutureTime
      });

      if (isNaN(selectedDateTime.getTime())) {
        setError("Please select a valid date and time");
        return;
      }

      if (selectedDateTime < minimumFutureTime) {
        const diffMinutes = Math.ceil((minimumFutureTime.getTime() - selectedDateTime.getTime()) / (60 * 1000));
        setError(`Please select a date and time at least 30 minutes in the future. Selected time is ${diffMinutes} minutes too early.`);
        return;
      }

      // Additional validation for business hours if human therapist selected
      if (formData.sessionType === "human") {
        const [hour, minute] = formData.preferredTime.split(':').map(Number);
        const timeInMinutes = hour * 60 + minute;
        const startTime = 9 * 60; // 9:00 AM
        const endTime = 17 * 60; // 5:00 PM

        if (timeInMinutes < startTime || timeInMinutes >= endTime) {
          setError("Please select a time between 9:00 AM and 5:00 PM for human therapist sessions");
          return;
        }

        // Check if it's a weekend
        const selectedDay = selectedDateTime.getDay(); // 0 = Sunday, 6 = Saturday
        if (selectedDay === 0 || selectedDay === 6) {
          setError("Human therapist sessions are only available Monday through Friday");
          return;
        }
      }

      const response = await clientApi.requestSession({
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        reason: formData.reason,
        doctorId: formData.doctorId === "auto-assign" ? undefined : formData.doctorId || undefined,
        sessionType: formData.sessionType
      });

      setSuccess("Session request submitted successfully!");
      
      if (onSuccess) {
        onSuccess(response.session);
      }

      // Reset form
      setFormData({
        preferredDate: "",
        preferredTime: "",
        reason: "",
        doctorId: "auto-assign",
        sessionType: "human"
      });

    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit booking request";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = formData.doctorId !== "auto-assign" ? doctors.find(d => d.id === formData.doctorId) : null;

  // Generate time slots based on session type
  const timeSlots = [];
  if (formData.sessionType === "human") {
    // Business hours only for human therapists (9 AM to 5 PM)
    for (let hour = 9; hour < 17; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  } else {
    // 24/7 availability for AI sessions
    for (let hour = 0; hour < 24; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-abby-blue to-abby-green rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Book Therapy Session</CardTitle>
            <CardDescription>
              Schedule a session with a human therapist or request AI therapy
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="sessionType">Session Type</Label>
            <Select
              value={formData.sessionType}
              onValueChange={(value) => handleInputChange("sessionType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="human">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Human Therapist</span>
                  </div>
                </SelectItem>
                <SelectItem value="ai">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Therapy (Abby)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Doctor Selection (only for human sessions) */}
          {formData.sessionType === "human" && (
            <div className="space-y-2">
              <Label htmlFor="doctorId">Preferred Therapist (Optional)</Label>
              {loadingDoctors ? (
                <div className="p-4 text-center text-muted-foreground border rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-abby-blue mx-auto mb-2"></div>
                  Loading available therapists...
                </div>
              ) : doctors.length > 0 ? (
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) => handleInputChange("doctorId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a therapist or leave blank for admin assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-assign">
                      <span className="text-muted-foreground">Let admin assign therapist</span>
                    </SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {doctor.specializations.slice(0, 2).join(", ")} • {doctor.experience} years
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 text-center text-muted-foreground border rounded-lg bg-gray-50">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No therapists available at the moment</p>
                  <p className="text-xs mt-1">Your session will be assigned by our admin team</p>
                </div>
              )}

              {/* Doctor Details */}
              {selectedDoctor && (
                <Card className="bg-therapy-calm/30 border-abby-blue/20">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{selectedDoctor.name}</h4>
                        <Badge variant="secondary">{selectedDoctor.experience} years experience</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {selectedDoctor.specializations.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>

                      {selectedDoctor.bio && (
                        <p className="text-sm text-muted-foreground">{selectedDoctor.bio}</p>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        Session duration: {selectedDoctor.sessionDuration} minutes
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="preferredDate">Preferred Date</Label>
            <div className="relative">
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Today or future dates only
                required
                className="w-full px-3 py-2 text-sm"
                placeholder="Select a date"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground">
              Select a date from today onwards
            </p>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Preferred Time</Label>
            <div className="relative">
              <Select
                value={formData.preferredTime}
                onValueChange={(value) => handleInputChange("preferredTime", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time} className="cursor-pointer">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{time}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Clock className="absolute right-8 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.sessionType === "human"
                ? "Available time slots: 9:00 AM to 5:00 PM (Monday-Friday)"
                : "AI therapy is available 24/7"
              }
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Session</Label>
            <Textarea
              id="reason"
              placeholder="Please describe what you'd like to work on in this session..."
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-abby-blue hover:bg-abby-blue/90"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Request Session"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {formData.sessionType === "human" && !formData.doctorId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Admin Assignment</p>
                <p className="text-blue-700">
                  If you don't select a specific therapist, an admin will review your request and assign 
                  the most suitable therapist based on your needs and their availability.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
