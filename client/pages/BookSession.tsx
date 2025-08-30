import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import BookingForm from "@/components/BookingForm";
import { useAuth } from "@/contexts/AuthContext";

export default function BookSession() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const handleBookingSuccess = (session: any) => {
    setBookingSuccess(session);
  };

  const handleViewSessions = () => {
    navigate("/sessions");
  };

  const handleBookAnother = () => {
    setBookingSuccess(null);
  };

  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Only clients can access the booking system.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login">
              <Button className="bg-abby-blue hover:bg-abby-blue/90">
                Sign In
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
            <Link to="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.firstName}
              </span>
              <Link to="/sessions">
                <Button variant="ghost" size="sm">
                  My Sessions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {bookingSuccess ? (
          /* Success State */
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">
                  Session Request Submitted!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your therapy session has been successfully requested
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Session Details:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {bookingSuccess.type === 'human' ? 'Human Therapist' : 'AI Therapy'}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {bookingSuccess.status}
                    </div>
                    <div>
                      <span className="font-medium">Scheduled:</span> {new Date(bookingSuccess.scheduledAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Therapist:</span> {bookingSuccess.doctorName}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Topic:</span> {bookingSuccess.topic}
                  </div>
                </div>

                {bookingSuccess.needsApproval && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
                    <p className="text-blue-700 text-sm">
                      Your session request will be reviewed by our admin team who will assign an appropriate 
                      therapist based on your needs and availability. You'll receive a confirmation once 
                      a therapist has been assigned.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleViewSessions}
                    className="flex-1 bg-abby-blue hover:bg-abby-blue/90"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View My Sessions
                  </Button>
                  <Button
                    onClick={handleBookAnother}
                    variant="outline"
                    className="flex-1"
                  >
                    Book Another Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Booking Form */
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Book Your Therapy Session
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose between AI-powered therapy with Abby or schedule a session with one of our 
                licensed human therapists. Your mental health journey starts here.
              </p>
            </div>

            <BookingForm onSuccess={handleBookingSuccess} />

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
              <Card className="border-abby-blue/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-abby-blue" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-abby-blue text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Submit Request</p>
                      <p className="text-muted-foreground">Fill out the form with your preferred date, time, and reason</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-abby-blue text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">Admin Review</p>
                      <p className="text-muted-foreground">Our team reviews and assigns the best therapist for your needs</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-abby-blue text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">Confirmation</p>
                      <p className="text-muted-foreground">Receive confirmation with your therapist and session details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-abby-green/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-abby-green" />
                    What to Expect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Professional Support</p>
                    <p className="text-muted-foreground">Licensed therapists with specialized training in various areas</p>
                  </div>
                  <div>
                    <p className="font-medium">Safe Environment</p>
                    <p className="text-muted-foreground">Confidential, judgment-free space to explore your thoughts and feelings</p>
                  </div>
                  <div>
                    <p className="font-medium">Personalized Care</p>
                    <p className="text-muted-foreground">Therapy approach tailored to your specific needs and goals</p>
                  </div>
                  <div>
                    <p className="font-medium">Flexible Scheduling</p>
                    <p className="text-muted-foreground">Sessions available throughout the week to fit your schedule</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
