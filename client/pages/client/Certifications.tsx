import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { clientApi } from "@/lib/api";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Award,
  Lock,
  Download,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  Target,
  Brain,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

export default function Certifications() {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch certifications data
        const response = await clientApi.getCertifications();
        setCertifications(response.certifications || []);

        // Fetch dashboard for user progress stats
        const dashboardResponse = await clientApi.getDashboard();
        setUserProgress(dashboardResponse.stats || {
          totalSessions: 0,
          averageQuizScore: 0,
          completedSessions: 0,
          progressLevel: 1,
        });
      } catch (error) {
        console.error("Failed to fetch certifications:", error);
        setError("Failed to load certifications");
        setCertifications([]);
        setUserProgress({
          totalSessions: 0,
          averageQuizScore: 0,
          completedSessions: 0,
          progressLevel: 1,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCertifications();
    }
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abby-blue mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your certifications...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const getCertificationProgress = (cert: any) => {
    return cert.progressPercentage || 0;
  };

  const getCertificationIcon = (index: number) => {
    const icons = [Award, Brain, Trophy, Shield, Heart, Star];
    const IconComponent = icons[index % icons.length];
    return IconComponent;
  };

  const getCertificationColor = (index: number) => {
    const colors = [
      "from-purple-500 to-purple-600",
      "from-blue-500 to-blue-600",
      "from-yellow-500 to-yellow-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
    ];
    return colors[index % colors.length];
  };

  const unlockedCertifications = certifications.filter((c) =>
    c.status === 'completed' || c.status === 'approved' || c.isUnlocked
  );
  const lockedCertifications = certifications.filter((c) =>
    c.status !== 'completed' && c.status !== 'approved' && !c.isUnlocked
  );

  // Calculate progress metrics
  const progressMetrics = userProgress ? {
    totalSessions: userProgress.totalSessions || 0,
    averageQuizScore: userProgress.averageQuizScore || 0,
    completedSessions: userProgress.completedSessions || 0,
    currentLevel: userProgress.totalSessions < 3 ? "Beginner" :
                  userProgress.totalSessions < 8 ? "Intermediate" : "Advanced",
    nextLevel: userProgress.totalSessions < 3 ? "Intermediate" :
               userProgress.totalSessions < 8 ? "Advanced" : "Expert",
    overallProgress: Math.min(100, (userProgress.totalSessions / 10) * 100),
  } : {
    totalSessions: 0,
    averageQuizScore: 0,
    completedSessions: 0,
    currentLevel: "Beginner",
    nextLevel: "Intermediate",
    overallProgress: 0,
  };

  const handleDownloadCertificate = (cert: Certification) => {
    // TODO: Implement actual certificate download
    console.log("Downloading certificate:", cert.title);
    // Simulate download
    const link = document.createElement("a");
    link.href = cert.certificateUrl || "#";
    link.download = `${cert.title.replace(/\s+/g, "-").toLowerCase()}-certificate.pdf`;
    link.click();
  };

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Your Certifications
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your therapy achievements and unlock new certificates as you
              progress
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="border-gradient-to-r from-purple-200 to-blue-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span>Your Journey Progress</span>
              </CardTitle>
              <CardDescription>
                Each certification requires 2 completed therapy sessions with passing quiz scores!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {unlockedCertifications.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Certificates Earned
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {progressMetrics.totalSessions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sessions Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(progressMetrics.averageQuizScore)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Quiz Score
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.floor(progressMetrics.totalSessions / 2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Certificates Available
                  </div>
                </div>
              </div>

              {/* Certification Requirements */}
              <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg mb-6">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Certification Requirements
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Complete 2 therapy sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Pass quiz with 70%+ score</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Show active engagement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Demonstrate progress</span>
                  </div>
                </div>
              </div>

              {/* Next Certification Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress to Next Certification</span>
                  <span>{Math.round((progressMetrics.totalSessions % 2) * 50)}%</span>
                </div>
                <Progress
                  value={(progressMetrics.totalSessions % 2) * 50}
                  className="h-3"
                />
                <div className="text-center text-xs text-muted-foreground">
                  {progressMetrics.totalSessions % 2 === 0 && progressMetrics.totalSessions > 0
                    ? "You've earned a new certification! Check below to claim it."
                    : `Complete ${2 - (progressMetrics.totalSessions % 2)} more session${2 - (progressMetrics.totalSessions % 2) !== 1 ? "s" : ""} to unlock your next certificate`
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earned Certificates */}
          {unlockedCertifications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <span>Earned Certificates</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {unlockedCertifications.map((cert, index) => {
                  const IconComponent = getCertificationIcon(index);
                  const colorClass = getCertificationColor(index);

                  return (
                    <Card
                      key={cert.id}
                      className="border-2 border-green-200 bg-green-50 hover:shadow-lg transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center`}
                            >
                              <IconComponent className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {cert.title}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">
                                  Earned
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-600 text-white">
                            <Trophy className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                        <CardDescription className="mt-2">
                          {cert.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Certificate Details:
                            </h4>
                            <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-green-700">All requirements completed</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-green-700">Progress verified</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-green-700">Certificate issued</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Earned on{" "}
                              {cert.earnedAt ? format(
                                new Date(cert.earnedAt),
                                "MMM dd, yyyy",
                              ) : "Recently"}
                            </div>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCertificate(cert)}
                                  >
                                    View Details
                                  </Button>
                                </DialogTrigger>
                              </Dialog>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleDownloadCertificate(cert)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Certificates or Empty State */}
          {certifications.length > 0 ? (
            lockedCertifications.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  <span>Available Certificates</span>
                </h2>
                <p className="text-muted-foreground">
                  Continue your therapy journey to unlock these achievements
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {lockedCertifications.map((cert, index) => {
                    const IconComponent = getCertificationIcon(
                      index + unlockedCertifications.length,
                    );
                    const colorClass = getCertificationColor(
                      index + unlockedCertifications.length,
                    );
                    const progress = getCertificationProgress(cert);

                    return (
                      <Card
                        key={cert.id}
                        className="border-gray-200 hover:shadow-md transition-all duration-300"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-14 h-14 bg-gradient-to-br ${colorClass} opacity-50 rounded-xl flex items-center justify-center`}
                              >
                                <Lock className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg text-muted-foreground">
                                  {cert.title || cert.certification?.name}
                                </CardTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Clock className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm text-orange-700 font-medium">
                                    In Progress
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-200"
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          </div>
                          <CardDescription className="mt-2">
                            {cert.description || cert.certification?.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Requirements:</h4>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className={`w-4 h-4 rounded-full border-2 ${progressMetrics.totalSessions >= 2 ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex-shrink-0`} />
                                  <span className={progressMetrics.totalSessions >= 2 ? 'text-green-700' : 'text-muted-foreground'}>
                                    Complete 2 therapy sessions
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className={`w-4 h-4 rounded-full border-2 ${progressMetrics.averageQuizScore >= 70 ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex-shrink-0`} />
                                  <span className={progressMetrics.averageQuizScore >= 70 ? 'text-green-700' : 'text-muted-foreground'}>
                                    Achieve 70%+ average quiz score
                                  </span>
                                </div>
                              </div>
                              {progressMetrics.totalSessions < 2 && (
                                <p className="text-xs text-orange-600 mt-2">
                                  {2 - progressMetrics.totalSessions} more session{2 - progressMetrics.totalSessions !== 1 ? 's' : ''} needed
                                </p>
                              )}
                            </div>

                            <div className="pt-4 border-t">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setSelectedCertificate(cert)}
                                  >
                                    View Details
                                  </Button>
                                </DialogTrigger>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">Start Your Certification Journey</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Complete therapy sessions to unlock certificates and track your mental wellness achievements.
              </p>
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 max-w-md mx-auto">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center justify-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    How to Earn Certificates
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span>Complete 2 therapy sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                      <span>Pass quizzes with 70%+ score</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">⭐</div>
                      <span>Show active engagement</span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-700 mt-4 font-medium">
                    Each pair of completed sessions earns you a new certificate!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Certificate Detail Modal */}
          <Dialog
            open={!!selectedCertificate}
            onOpenChange={() => setSelectedCertificate(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Award className="w-6 h-6 text-purple-600" />
                  <span>{selectedCertificate?.title}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedCertificate?.description}
                </DialogDescription>
              </DialogHeader>

              {selectedCertificate && (
                <div className="space-y-6">
                  <div className="p-4 bg-therapy-calm rounded-lg">
                    <h4 className="font-semibold mb-3">
                      Certificate Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        <span>Complete therapy sessions regularly</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        <span>Demonstrate understanding of concepts</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        <span>Show measurable progress</span>
                      </div>
                    </div>
                  </div>

                  {selectedCertificate.status === 'completed' || selectedCertificate.isUnlocked ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">
                          Certificate Earned!
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mb-4">
                        Congratulations! You've successfully completed all
                        requirements for this certificate.
                        {selectedCertificate.earnedAt && (
                          <> Earned on{" "}
                          {format(
                            new Date(selectedCertificate.earnedAt),
                            "MMMM dd, yyyy",
                          )}.</>
                        )}
                      </p>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleDownloadCertificate(selectedCertificate)
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">
                          Keep Going!
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        You're{" "}
                        {Math.round(
                          getCertificationProgress(selectedCertificate),
                        )}
                        % complete. Continue your therapy sessions to unlock
                        this certificate.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
