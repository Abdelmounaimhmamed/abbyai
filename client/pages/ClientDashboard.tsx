import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Brain,
  MessageCircle,
  Award,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Target,
  Heart,
  Zap,
  Lock,
  CheckCircle,
  Plus,
} from "lucide-react";
import {
  TherapySession,
  Certification,
  MentalHealthInsight,
} from "@shared/types";

// Helper function to generate dynamic insights based on user data
const generateDynamicInsights = (sessions: any[], stats: any): MentalHealthInsight[] => {
  const insights: MentalHealthInsight[] = [];

  if (stats.completedSessions > 0) {
    insights.push({
      id: "progress-milestone",
      clientId: "current-user",
      type: "milestone",
      title: `${stats.completedSessions} Session${stats.completedSessions !== 1 ? 's' : ''} Completed!`,
      description: `Congratulations! You've completed ${stats.completedSessions} therapy session${stats.completedSessions !== 1 ? 's' : ''}. Every session brings you closer to your mental wellness goals.`,
      generatedAt: new Date().toISOString(),
    });
  }

  if (stats.averageQuizScore >= 80) {
    insights.push({
      id: "performance-insight",
      clientId: "current-user",
      type: "progress",
      title: "Excellent Understanding!",
      description: `Your average quiz score of ${stats.averageQuizScore}% shows great comprehension of therapy concepts. Keep up the fantastic work!`,
      generatedAt: new Date().toISOString(),
    });
  }

  if (stats.completedSessions >= 2) {
    insights.push({
      id: "recommendation-breathing",
      clientId: "current-user",
      type: "recommendation",
      title: "Practice Mindfulness Daily",
      description: "Based on your progress, consider incorporating 5-10 minutes of mindfulness or deep breathing into your daily routine for continued growth.",
      generatedAt: new Date().toISOString(),
    });
  }

  // If no sessions yet, provide motivational insight
  if (stats.completedSessions === 0) {
    insights.push({
      id: "welcome-insight",
      clientId: "current-user",
      type: "recommendation",
      title: "Ready to Begin Your Journey? 🌟",
      description: "Starting therapy is a brave step! Your first session will help establish your goals and begin building healthy coping strategies.",
      generatedAt: new Date().toISOString(),
    });
  }

  return insights;
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [insights, setInsights] = useState<MentalHealthInsight[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    completedQuizzes: 0,
    averageQuizScore: 0,
    progressLevel: 1,
    totalQuizzesCompleted: 0,
    totalSessionsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await clientApi.getDashboard();

        // Use real data from API, with proper empty states for new clients
        setSessions(response.sessions || []);
        setCertifications(response.certifications || []);
        const statsData = response.stats || {
          totalSessions: 0,
          completedSessions: 0,
          completedQuizzes: 0,
          averageQuizScore: 0,
          progressLevel: 1,
          totalQuizzesCompleted: 0,
          totalSessionsCompleted: 0,
        };
        setStats(statsData);

        // Generate dynamic insights based on real user data
        const dynamicInsights = generateDynamicInsights(response.sessions || [], statsData);
        setInsights(dynamicInsights);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // For new clients or API errors, start with empty states
        setSessions([]);
        setCertifications([]);
        const emptyStats = {
          totalSessions: 0,
          completedSessions: 0,
          completedQuizzes: 0,
          averageQuizScore: 0,
          progressLevel: 1,
          totalQuizzesCompleted: 0,
          totalSessionsCompleted: 0,
        };
        setStats(emptyStats);

        // Generate welcome insights for new users
        const welcomeInsights = generateDynamicInsights([], emptyStats);
        setInsights(welcomeInsights);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const completedSessions = stats.completedSessions || 0;
  const averageQuizScore = stats.averageQuizScore || 0;
  const unlockedCertifications = certifications.filter(
    (c) => c.status === "completed" || c.isUnlocked,
  ).length;
  const totalHours = Math.round(completedSessions * 2 * 10) / 10; // Assume 2 hours per session

  // Generate empty state data for new clients
  const hasAnyData = sessions.length > 0 || certifications.length > 0;

  // Generate completely dynamic chart data based on real session data
  const sessionTypeData = sessions.length > 0
    ? [
        { name: "AI Sessions", value: sessions.filter(s => s.type === 'ai').length, color: "#2563eb" },
        { name: "Human Sessions", value: sessions.filter(s => s.type === 'human').length, color: "#16a34a" },
      ].filter(item => item.value > 0)
    : [
        { name: "No Sessions Yet", value: 1, color: "#e5e7eb" }
      ];

  // Generate weekly progress data based on completed sessions with quiz scores
  const completedSessionsWithQuiz = sessions.filter(s => s.status === 'completed' && s.quizScore);
  const weeklyProgressData = completedSessionsWithQuiz.length > 0
    ? completedSessionsWithQuiz.slice(-7).map((session, index) => ({
        day: `S${index + 1}`, // Session 1, Session 2, etc.
        mood: Math.min(10, Math.max(1, session.quizScore / 10)), // Convert score to mood scale
        anxiety: Math.max(1, Math.min(10, 10 - (session.quizScore / 10))), // Inverse for anxiety
        confidence: Math.min(10, Math.max(1, (session.quizScore / 15) + 3)), // Derived confidence metric
      }))
    : [
        { day: "Mon", mood: 0, anxiety: 0, confidence: 0 },
        { day: "Tue", mood: 0, anxiety: 0, confidence: 0 },
        { day: "Wed", mood: 0, anxiety: 0, confidence: 0 },
        { day: "Thu", mood: 0, anxiety: 0, confidence: 0 },
        { day: "Fri", mood: 0, anxiety: 0, confidence: 0 },
        { day: "Sat", mood: 0, anxiety: 0, confidence: 0 },
        { day: "Sun", mood: 0, anxiety: 0, confidence: 0 },
      ];

  const getInsightIcon = (type: MentalHealthInsight["type"]) => {
    switch (type) {
      case "progress":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "recommendation":
        return <Heart className="w-4 h-4 text-blue-600" />;
      case "milestone":
        return <Star className="w-4 h-4 text-yellow-600" />;
      default:
        return <Brain className="w-4 h-4 text-purple-600" />;
    }
  };

  const getCertificationProgress = (cert: Certification) => {
    return (cert.completedRequirements.length / cert.requirements.length) * 100;
  };

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Let's continue your mental wellness journey
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/book-session">
                <Button className="bg-abby-blue hover:bg-abby-blue/90">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Session
                </Button>
              </Link>
              <Link to="/sessions">
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  My Sessions
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sessions Completed
                </CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abby-blue">
                  {completedSessions}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(totalHours * 10) / 10} hours total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quiz Average
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abby-green">
                  {Math.round(averageQuizScore)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Excellent progress!
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
                  {unlockedCertifications}/{certifications.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {certifications.length === 0 ? "No certificates yet" : "Earned certificates"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mood Today
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600">
                  {hasAnyData ? "8/10" : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasAnyData ? "Feeling great! 😊" : "Track your mood"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Progress */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>
                  Your mood and anxiety levels this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedSessionsWithQuiz.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#16a34a"
                        strokeWidth={2}
                        name="Mood"
                      />
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        stroke="#dc2626"
                        strokeWidth={2}
                        name="Anxiety"
                      />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#2563eb"
                        strokeWidth={2}
                        name="Confidence"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-center">
                    <div>
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Progress Data Yet</h3>
                      <p className="text-muted-foreground text-sm">
                        Complete your first therapy session to start tracking your progress
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Types */}
            <Card>
              <CardHeader>
                <CardTitle>Session Distribution</CardTitle>
                <CardDescription>Your therapy session types</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sessionTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {sessionTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-center">
                    <div>
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Sessions Yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Start your mental health journey by booking your first session
                      </p>
                      <Link to="/book-session">
                        <Button className="bg-abby-blue hover:bg-abby-blue/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Book First Session
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>Certifications</span>
              </CardTitle>
              <CardDescription>
                Track your progress and unlock achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certifications.map((cert) => {
                  const progress = getCertificationProgress(cert);
                  return (
                    <Card
                      key={cert.id}
                      className={`relative ${cert.isUnlocked ? "border-purple-200 bg-purple-50" : "border-gray-200"}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {cert.isUnlocked ? (
                              <Award className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Lock className="w-5 h-5 text-gray-400" />
                            )}
                            <CardTitle className="text-sm">
                              {cert.title}
                            </CardTitle>
                          </div>
                          {cert.isUnlocked && (
                            <Badge className="bg-purple-100 text-purple-800 border-0">
                              Earned
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {cert.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="space-y-1">
                            {cert.requirements.map((req, index) => {
                              const isCompleted =
                                cert.completedRequirements.includes(req);
                              return (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 text-xs"
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full border border-gray-300" />
                                  )}
                                  <span
                                    className={
                                      isCompleted
                                        ? "line-through text-gray-500"
                                        : ""
                                    }
                                  >
                                    {req}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Certifications Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete therapy sessions and quizzes to unlock certificates
                  </p>
                  <Link to="/book-session">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Start Your Journey
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mental Health Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-abby-blue" />
                <span>Mental Health Insights</span>
              </CardTitle>
              <CardDescription>
                Personalized insights based on your therapy sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-start space-x-3 p-4 bg-therapy-calm rounded-lg"
                    >
                      <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(insight.generatedAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Insights Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete therapy sessions to receive personalized mental health insights
                  </p>
                  <Link to="/session">
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start AI Session
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/book-session">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="w-12 h-12 bg-abby-blue/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-abby-blue" />
                </div>
                <div>
                  <h3 className="font-semibold">Book New Session</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule therapy with Abby AI or book human therapist
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

            <Link to="/progress">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="w-12 h-12 bg-abby-green/10 rounded-lg flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-abby-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics and mood tracking
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/certifications">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Certifications</h3>
                    <p className="text-sm text-muted-foreground">
                      View achievements and download certificates
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
