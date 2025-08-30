import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, GraduationCap, Award, Clock, User } from "lucide-react";

export default function DoctorOnboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    licenseNumber: "",
    specializations: [] as string[],
    education: [] as string[],
    experience: "",
    bio: "",
    workingHours: {
      monday: { start: "09:00", end: "17:00", isAvailable: true },
      tuesday: { start: "09:00", end: "17:00", isAvailable: true },
      wednesday: { start: "09:00", end: "17:00", isAvailable: true },
      thursday: { start: "09:00", end: "17:00", isAvailable: true },
      friday: { start: "09:00", end: "15:00", isAvailable: true },
      saturday: { start: "10:00", end: "14:00", isAvailable: false },
      sunday: { start: "10:00", end: "14:00", isAvailable: false },
    },
    sessionDuration: 120,
    breakBetweenSessions: 15,
  });

  const [newSpecialization, setNewSpecialization] = useState("");
  const [newEducation, setNewEducation] = useState("");

  const addSpecialization = () => {
    if (
      newSpecialization.trim() &&
      !formData.specializations.includes(newSpecialization.trim())
    ) {
      setFormData({
        ...formData,
        specializations: [
          ...formData.specializations,
          newSpecialization.trim(),
        ],
      });
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((s) => s !== spec),
    });
  };

  const addEducation = () => {
    if (
      newEducation.trim() &&
      !formData.education.includes(newEducation.trim())
    ) {
      setFormData({
        ...formData,
        education: [...formData.education, newEducation.trim()],
      });
      setNewEducation("");
    }
  };

  const removeEducation = (edu: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter((e) => e !== edu),
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      // Validate required fields
      if (!formData.licenseNumber?.trim()) {
        setSubmitError("License number is required");
        return;
      }

      if (!formData.experience) {
        setSubmitError("Years of experience is required");
        return;
      }

      // Save doctor profile data to the backend
      const onboardingData = {
        doctorProfile: {
          licenseNumber: formData.licenseNumber.trim(),
          specializations: formData.specializations,
          education: formData.education,
          experience: parseInt(formData.experience) || 0,
          bio: formData.bio?.trim() || null,
          workingHours: formData.workingHours,
          sessionDuration: formData.sessionDuration,
          breakBetweenSessions: formData.breakBetweenSessions,
        },
        completedAt: new Date().toISOString()
      };

      console.log("Submitting onboarding data:", onboardingData);

      // Call the complete onboarding API
      await authApi.completeOnboarding(onboardingData);

      // Update local user state to reflect completion
      await updateUser({
        hasCompletedOnboarding: true
      });

      // Mark onboarding as completed locally as well
      localStorage.setItem(`doctor_onboarding_${user?.id}`, "completed");

      navigate("/doctor");
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      const errorMessage = error?.message || "Failed to complete onboarding. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Professional Information
        </h2>
        <p className="text-muted-foreground">
          Let's set up your professional profile to help clients find you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="licenseNumber">Medical License Number *</Label>
          <Input
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) =>
              setFormData({ ...formData, licenseNumber: e.target.value })
            }
            placeholder="Enter your medical license number"
            required
          />
        </div>

        <div>
          <Label htmlFor="experience">Years of Experience *</Label>
          <Input
            id="experience"
            type="number"
            value={formData.experience}
            onChange={(e) =>
              setFormData({ ...formData, experience: e.target.value })
            }
            placeholder="e.g., 5"
            required
          />
        </div>

        <div>
          <Label htmlFor="bio">Professional Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell clients about your approach to therapy and experience..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/login")}>
          Back to Login
        </Button>
        <Button
          onClick={() => setStep(2)}
          disabled={!formData.licenseNumber || !formData.experience}
        >
          Next Step
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Specializations & Education
        </h2>
        <p className="text-muted-foreground">
          Add your areas of expertise and educational background.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="specializations">Specializations</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="e.g., Anxiety Disorders, CBT, PTSD"
              onKeyPress={(e) => e.key === "Enter" && addSpecialization()}
            />
            <Button type="button" onClick={addSpecialization}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specializations.map((spec) => (
              <Badge
                key={spec}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeSpecialization(spec)}
              >
                {spec} ×
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="education">Education & Certifications</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newEducation}
              onChange={(e) => setNewEducation(e.target.value)}
              placeholder="e.g., PhD Psychology - Harvard University"
              onKeyPress={(e) => e.key === "Enter" && addEducation()}
            />
            <Button type="button" onClick={addEducation}>
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {formData.education.map((edu) => (
              <div
                key={edu}
                className="flex items-center justify-between bg-muted p-2 rounded"
              >
                <span className="text-sm">{edu}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(edu)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          Previous
        </Button>
        <Button onClick={() => setStep(3)}>Next Step</Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Availability & Scheduling
        </h2>
        <p className="text-muted-foreground">
          Set your working hours and session preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
            <Input
              id="sessionDuration"
              type="number"
              value={formData.sessionDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sessionDuration: parseInt(e.target.value),
                })
              }
              placeholder="120"
            />
          </div>
          <div>
            <Label htmlFor="breakBetweenSessions">
              Break Between Sessions (minutes)
            </Label>
            <Input
              id="breakBetweenSessions"
              type="number"
              value={formData.breakBetweenSessions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  breakBetweenSessions: parseInt(e.target.value),
                })
              }
              placeholder="15"
            />
          </div>
        </div>

        <div>
          <Label>Working Hours</Label>
          <div className="space-y-2 mt-2">
            {Object.entries(formData.workingHours).map(([day, hours]) => (
              <div
                key={day}
                className="flex items-center gap-4 p-3 border rounded"
              >
                <div className="w-20 text-sm font-medium capitalize">{day}</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hours.isAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workingHours: {
                          ...formData.workingHours,
                          [day]: { ...hours, isAvailable: e.target.checked },
                        },
                      })
                    }
                  />
                  Available
                </label>
                {hours.isAvailable && (
                  <>
                    <Input
                      type="time"
                      value={hours.start}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: {
                            ...formData.workingHours,
                            [day]: { ...hours, start: e.target.value },
                          },
                        })
                      }
                      className="w-24"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.end}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: {
                            ...formData.workingHours,
                            [day]: { ...hours, end: e.target.value },
                          },
                        })
                      }
                      className="w-24"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
          Previous
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Setting up..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Doctor Profile Setup
                  </CardTitle>
                  <CardDescription>
                    Welcome, Dr. {user?.firstName}! Let's complete your profile.
                  </CardDescription>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {step} of 3
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 mt-4">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
