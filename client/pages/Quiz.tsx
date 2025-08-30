import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Target,
} from "lucide-react";
import { QuizQuestion } from "@shared/types";

const mockQuizQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "How did you feel during today's therapy session?",
    options: [
      "Very uncomfortable",
      "Uncomfortable",
      "Neutral",
      "Comfortable",
      "Very comfortable",
    ],
    correctAnswer: 3, // There's no "correct" answer for feelings, but for demo purposes
    category: "Session Experience",
  },
  {
    id: "2",
    question: "Which coping strategy was discussed in your session?",
    options: [
      "Deep breathing exercises",
      "Positive self-talk",
      "Progressive muscle relaxation",
      "All of the above",
    ],
    correctAnswer: 3,
    category: "Content Understanding",
  },
  {
    id: "3",
    question: "How likely are you to practice the techniques discussed today?",
    options: ["Very unlikely", "Unlikely", "Neutral", "Likely", "Very likely"],
    correctAnswer: 3,
    category: "Application Intent",
  },
  {
    id: "4",
    question:
      "What is the first step in managing anxiety according to your session?",
    options: [
      "Ignore the feeling",
      "Recognize the physical symptoms",
      "Distract yourself",
      "Avoid triggers",
    ],
    correctAnswer: 1,
    category: "Knowledge Check",
  },
  {
    id: "5",
    question:
      "How would you rate your understanding of today's session content?",
    options: ["Poor", "Fair", "Good", "Very good", "Excellent"],
    correctAnswer: 2,
    category: "Self-Assessment",
  },
];

export default function Quiz() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionData = location.state as {
    sessionId: string;
    sessionDuration: number;
    messagesCount: number;
  } | null;

  const questions = mockQuizQuestions;
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (isLastQuestion) {
      handleSubmitQuiz(newAnswers);
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    }
  };

  const handleSubmitQuiz = async (finalAnswers: number[]) => {
    setIsSubmitting(true);
    try {
      // Calculate score with improved logic
      const score = finalAnswers.reduce((acc, answer, index) => {
        const question = questions[index];

        // For subjective questions, give partial points based on response quality
        if (
          question.category === "Session Experience" ||
          question.category === "Application Intent" ||
          question.category === "Self-Assessment"
        ) {
          // Give points based on how positive/constructive the answer is
          // Scale: 0-4 answer options map to 0.5-1.0 points
          const subjectiveScore = Math.max(0.5, (answer + 1) / question.options.length);
          return acc + subjectiveScore;
        }

        // For knowledge questions, check if correct (full points or zero)
        return acc + (answer === question.correctAnswer ? 1 : 0);
      }, 0);

      const percentage = Math.round((score / questions.length) * 100);

      // Submit quiz results to backend
      if (sessionData?.sessionId) {
        try {
          await clientApi.completeSession(sessionData.sessionId, {
            quizAnswers: finalAnswers,
            quizScore: percentage,
            rating: percentage >= 70 ? 5 : 3,
            feedback: `Quiz completed with ${percentage}% score`
          });
          console.log("Quiz results saved to backend");
        } catch (error) {
          console.error("Failed to save quiz results:", error);
        }
      } else {
        console.log("No session ID available for quiz submission");
      }

      setShowResults(true);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFinalScore = () => {
    const score = answers.reduce((acc, answer, index) => {
      const question = questions[index];

      // For subjective questions, give partial points based on response quality
      if (
        question.category === "Session Experience" ||
        question.category === "Application Intent" ||
        question.category === "Self-Assessment"
      ) {
        // Give points based on how positive/constructive the answer is
        // Scale: 0-4 answer options map to 0.5-1.0 points
        const subjectiveScore = Math.max(0.5, (answer + 1) / question.options.length);
        return acc + subjectiveScore;
      }

      // For knowledge questions, check if correct (full points or zero)
      return acc + (answer === question.correctAnswer ? 1 : 0);
    }, 0);
    return Math.round((score / questions.length) * 100);
  };

  if (showResults) {
    const finalScore = calculateFinalScore();
    const passed = finalScore >= 70;

    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  passed ? "bg-green-500" : "bg-orange-500"
                }`}
              >
                {passed ? (
                  <Trophy className="w-8 h-8 text-white" />
                ) : (
                  <Target className="w-8 h-8 text-white" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold">
                {passed ? "Great Job!" : "Keep Learning!"}
              </CardTitle>
              <CardDescription className="text-base">
                You've completed the post-session quiz
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <div
                  className={`text-4xl font-bold mb-2 ${
                    passed ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {finalScore}%
                </div>
                <Badge
                  className={`${
                    passed
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-orange-100 text-orange-800 border-orange-200"
                  } border`}
                >
                  {passed ? "Passed" : "Needs Improvement"}
                </Badge>
              </div>

              {sessionData && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-therapy-calm rounded-lg">
                    <div className="text-lg font-semibold text-abby-blue">
                      {Math.round((sessionData.sessionDuration / 60) * 10) / 10}
                      h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Session Duration
                    </div>
                  </div>
                  <div className="text-center p-4 bg-therapy-calm rounded-lg">
                    <div className="text-lg font-semibold text-abby-green">
                      {Math.floor(sessionData.messagesCount / 2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Messages Exchanged
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  {passed ? "Excellent Understanding!" : "Areas to Review:"}
                </h4>
                <p className="text-sm text-blue-800">
                  {passed
                    ? "You demonstrated a great understanding of the session content. Keep practicing the techniques we discussed!"
                    : "Consider reviewing the session materials and practicing the techniques. Remember, learning is a journey!"}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Force navigation with state to trigger data refresh
                    navigate("/sessions", {
                      state: {
                        refresh: true,
                        completedSessionId: sessionData?.sessionId,
                        timestamp: Date.now()
                      }
                    });
                  }}
                  className="flex-1"
                >
                  View Sessions
                </Button>
                <Button
                  onClick={() => navigate("/book-session")}
                  className="flex-1 bg-abby-blue hover:bg-abby-blue/90"
                >
                  Book New Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm">
        {/* Header */}
        <div className="border-b border-border/40 bg-white/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-abby-blue to-abby-green rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Post-Session Quiz
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Reflect on your session
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-abby-blue/10 text-abby-blue border-abby-blue/30"
              >
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Question Card */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-8">
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-4">
                {currentQ.category}
              </Badge>
              <CardTitle className="text-xl font-semibold leading-relaxed">
                {currentQ.question}
              </CardTitle>
              <CardDescription>
                Choose the answer that best reflects your experience or
                understanding
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RadioGroup
                value={selectedAnswer?.toString()}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                className="space-y-3"
              >
                {currentQ.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-therapy-calm/30 transition-colors"
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null || isSubmitting}
              className="flex items-center space-x-2 bg-abby-blue hover:bg-abby-blue/90"
            >
              {isSubmitting ? (
                <>
                  <CheckCircle className="w-4 h-4 animate-pulse" />
                  <span>Submitting...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
