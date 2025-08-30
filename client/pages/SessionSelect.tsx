import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  MessageCircle,
  Users,
  Clock,
  Calendar as CalendarIcon,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Heart,
} from "lucide-react";
import { format } from "date-fns";

interface Doctor {
  id: string;
  name: string;
  specialization: string[];
  rating: number;
  experience: string;
  availability: string;
  avatar?: string;
}

const availableDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialization: ["Child Psychology", "Anxiety", "Depression"],
    rating: 4.9,
    experience: "8 years",
    availability: "Available today",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialization: ["Teen Therapy", "ADHD", "Social Skills"],
    rating: 4.8,
    experience: "6 years",
    availability: "Available tomorrow",
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialization: ["Family Therapy", "Trauma", "Behavioral Issues"],
    rating: 4.9,
    experience: "10 years",
    availability: "Available this week",
  },
];

export default function SessionSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSessionType, setSelectedSessionType] = useState<
    "ai" | "human" | null
  >(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionReason, setSessionReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const handleStartAISession = () => {
    navigate("/ai-session");
  };

  const handleBookHumanSession = async () => {
    if (
      !selectedDoctor ||
      !selectedDate ||
      !selectedTime ||
      !sessionReason.trim()
    ) {
      return;
    }

    setIsBooking(true);
    try {
      // TODO: Submit session request to backend
      const sessionRequest = {
        clientId: user?.id,
        doctorId: selectedDoctor.id,
        preferredDate: format(selectedDate, "yyyy-MM-dd"),
        preferredTime: selectedTime,
        reason: sessionReason,
        status: "pending",
      };

      console.log("Session request:", sessionRequest);

      // Navigate to pending sessions or dashboard
      navigate("/sessions?tab=pending");
    } catch (error) {
      console.error("Failed to book session:", error);
    } finally {
      setIsBooking(false);
    }
  };

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Choose Your Session Type
            </h1>
            <p className="text-lg text-muted-foreground">
              Select between AI therapy with Abby or a session with a human
              therapist
            </p>
          </div>

          {/* Session Type Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Session Card */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedSessionType === "ai"
                  ? "border-abby-blue bg-abby-blue/5"
                  : "border-border hover:border-abby-blue/50"
              }`}
              onClick={() => setSelectedSessionType("ai")}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-abby-blue to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-abby-blue" />
                  AI Therapy with Abby
                </CardTitle>
                <CardDescription className="text-base">
                  Instant support with our advanced AI therapist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Available 24/7</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">2-hour session duration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Voice & text support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Personalized responses</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Post-session quiz included</span>
                  </div>
                </div>

                {selectedSessionType === "ai" && (
                  <Button
                    className="w-full bg-abby-blue hover:bg-abby-blue/90 mt-6"
                    onClick={handleStartAISession}
                  >
                    Start Session Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Human Session Card */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedSessionType === "human"
                  ? "border-abby-green bg-abby-green/5"
                  : "border-border hover:border-abby-green/50"
              }`}
              onClick={() => setSelectedSessionType("human")}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-abby-green to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 text-abby-green" />
                  Human Therapist
                </CardTitle>
                <CardDescription className="text-base">
                  Professional guidance from licensed therapists
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Licensed professionals</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Specialized expertise</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Flexible scheduling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Personal connection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Admin approval required</span>
                  </div>
                </div>

                {selectedSessionType === "human" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-abby-green hover:bg-abby-green/90 mt-6">
                        Book Session
                        <CalendarIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Book a Human Therapist Session
                        </DialogTitle>
                        <DialogDescription>
                          Choose a therapist and schedule your session. Admin
                          approval is required.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Doctor Selection */}
                        <div>
                          <Label className="text-base font-medium mb-4 block">
                            Choose Your Therapist
                          </Label>
                          <div className="space-y-3">
                            {availableDoctors.map((doctor) => (
                              <Card
                                key={doctor.id}
                                className={`cursor-pointer transition-all hover:shadow-md border ${
                                  selectedDoctor?.id === doctor.id
                                    ? "border-abby-green bg-abby-green/5"
                                    : "border-border"
                                }`}
                                onClick={() => setSelectedDoctor(doctor)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <Avatar className="w-12 h-12">
                                      <AvatarImage src={doctor.avatar} />
                                      <AvatarFallback className="bg-abby-green text-white">
                                        {doctor.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-semibold">
                                          {doctor.name}
                                        </h4>
                                        <div className="flex items-center space-x-1">
                                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                          <span className="text-sm font-medium">
                                            {doctor.rating}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {doctor.specialization
                                          .slice(0, 2)
                                          .map((spec) => (
                                            <Badge
                                              key={spec}
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {spec}
                                            </Badge>
                                          ))}
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <span>
                                          {doctor.experience} experience
                                        </span>
                                        <span>{doctor.availability}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Date and Time Selection */}
                        {selectedDoctor && (
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-base font-medium mb-4 block">
                                Preferred Date
                              </Label>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                className="rounded-md border"
                              />
                            </div>

                            <div>
                              <Label className="text-base font-medium mb-4 block">
                                Preferred Time
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {timeSlots.map((time) => (
                                  <Button
                                    key={time}
                                    variant={
                                      selectedTime === time
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setSelectedTime(time)}
                                    className={
                                      selectedTime === time
                                        ? "bg-abby-green hover:bg-abby-green/90"
                                        : ""
                                    }
                                  >
                                    {time}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Session Reason */}
                        {selectedDate && selectedTime && (
                          <div>
                            <Label
                              htmlFor="reason"
                              className="text-base font-medium mb-2 block"
                            >
                              Reason for Session
                            </Label>
                            <Textarea
                              id="reason"
                              placeholder="Please describe what you'd like to discuss or work on during this session..."
                              value={sessionReason}
                              onChange={(e) => setSessionReason(e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                        )}

                        {/* Submit Button */}
                        {selectedDoctor &&
                          selectedDate &&
                          selectedTime &&
                          sessionReason.trim() && (
                            <Button
                              onClick={handleBookHumanSession}
                              disabled={isBooking}
                              className="w-full bg-abby-green hover:bg-abby-green/90"
                            >
                              {isBooking
                                ? "Submitting Request..."
                                : "Submit Session Request"}
                            </Button>
                          )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-abby-blue">0</div>
                <div className="text-sm text-muted-foreground">
                  Sessions Completed
                </div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-abby-green">0</div>
                <div className="text-sm text-muted-foreground">
                  Quizzes Passed
                </div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-muted-foreground">
                  Certifications
                </div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">0%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
