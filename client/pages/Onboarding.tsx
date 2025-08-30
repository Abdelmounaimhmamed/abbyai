import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { OnboardingQuestion, OnboardingResponse } from "@shared/types";
import { cn } from "@/lib/utils";

const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "1",
    question: "What is your age?",
    type: "text",
    required: true,
    category: "background",
  },
  {
    id: "2",
    question: "How would you describe your current mood most days?",
    type: "multiple-choice",
    options: ["Very happy", "Happy", "Neutral", "Sad", "Very sad"],
    required: true,
    category: "personality",
  },
  {
    id: "3",
    question: "What brings you the most comfort when you're feeling upset?",
    type: "multiple-choice",
    options: [
      "Talking to someone",
      "Listening to music",
      "Being alone",
      "Playing games",
      "Being with pets",
      "Other",
    ],
    required: true,
    category: "preferences",
  },
  {
    id: "4",
    question:
      "On a scale of 1-10, how comfortable are you talking about your feelings?",
    type: "scale",
    required: true,
    category: "personality",
  },
  {
    id: "5",
    question: "Do you have any pets?",
    type: "boolean",
    required: false,
    category: "background",
  },
  {
    id: "6",
    question: "What are your favorite activities or hobbies?",
    type: "text",
    required: false,
    category: "preferences",
  },
  {
    id: "7",
    question: "How do you usually handle stress or difficult situations?",
    type: "multiple-choice",
    options: [
      "Talk to family/friends",
      "Listen to music",
      "Exercise or play sports",
      "Draw or write",
      "Play video games",
      "Take deep breaths",
      "Other",
    ],
    required: true,
    category: "personality",
  },
  {
    id: "8",
    question: "What would you most like to achieve through therapy?",
    type: "multiple-choice",
    options: [
      "Feel happier",
      "Manage anxiety",
      "Improve relationships",
      "Build confidence",
      "Better handle school stress",
      "Understand my emotions better",
    ],
    required: true,
    category: "goals",
  },
  {
    id: "9",
    question:
      "Is there anything specific you'd like Abby AI to know about you?",
    type: "text",
    required: false,
    category: "preferences",
  },
  {
    id: "10",
    question: "How often would you like to have therapy sessions?",
    type: "multiple-choice",
    options: [
      "Daily",
      "2-3 times per week",
      "Once a week",
      "When I feel I need it",
    ],
    required: true,
    category: "preferences",
  },
];

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<OnboardingResponse[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | number | boolean>(
    "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = onboardingQuestions[currentStep];
  const progress = ((currentStep + 1) / onboardingQuestions.length) * 100;
  const isLastStep = currentStep === onboardingQuestions.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    // Reset current answer when step changes
    setCurrentAnswer("");
  }, [currentStep]);

  const handleAnswerChange = (value: string | number | boolean) => {
    setCurrentAnswer(value);
  };

  const handleNext = () => {
    if (
      currentQuestion.required &&
      (currentAnswer === "" ||
        currentAnswer === null ||
        currentAnswer === undefined)
    ) {
      return;
    }

    // Save current response
    const response: OnboardingResponse = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      timestamp: new Date().toISOString(),
    };

    setResponses((prev) => {
      const existing = prev.findIndex(
        (r) => r.questionId === currentQuestion.id,
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = response;
        return updated;
      }
      return [...prev, response];
    });

    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
      // Load previous answer
      const prevResponse = responses.find(
        (r) => r.questionId === onboardingQuestions[currentStep - 1].id,
      );
      if (prevResponse) {
        setCurrentAnswer(prevResponse.answer);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save final response
      const finalResponse: OnboardingResponse = {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        timestamp: new Date().toISOString(),
      };

      const allResponses = [...responses, finalResponse];

      // Save to backend
      console.log("Onboarding responses:", allResponses);

      // Call the complete onboarding API
      await authApi.completeOnboarding({
        responses: allResponses,
        completedAt: new Date().toISOString()
      });

      // Update local user state to reflect completion
      await updateUser({
        hasCompletedOnboarding: true
      });

      // Mark onboarding as completed locally as well
      localStorage.setItem("onboarding_completed", "true");

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save onboarding responses:", error);
      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case "text":
        return (
          <Textarea
            value={currentAnswer as string}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px]"
          />
        );

      case "multiple-choice":
        return (
          <RadioGroup
            value={currentAnswer as string}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-therapy-calm/30 transition-colors"
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "scale":
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 (Not comfortable)</span>
              <span>10 (Very comfortable)</span>
            </div>
            <RadioGroup
              value={currentAnswer?.toString()}
              onValueChange={(value) => handleAnswerChange(parseInt(value))}
              className="grid grid-cols-5 gap-2"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <div key={num} className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor={`scale-${num}`}
                    className="text-sm cursor-pointer"
                  >
                    {num}
                  </Label>
                  <RadioGroupItem value={num.toString()} id={`scale-${num}`} />
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "boolean":
        return (
          <RadioGroup
            value={currentAnswer?.toString()}
            onValueChange={(value) => handleAnswerChange(value === "true")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-therapy-calm/30 transition-colors">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes" className="flex-1 cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-therapy-calm/30 transition-colors">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no" className="flex-1 cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "background":
        return "bg-blue-100 text-blue-800";
      case "personality":
        return "bg-purple-100 text-purple-800";
      case "preferences":
        return "bg-green-100 text-green-800";
      case "goals":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
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
                <h1 className="text-xl font-bold text-foreground">Abby AI</h1>
                <p className="text-xs text-muted-foreground">
                  Getting to know you
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-abby-blue/10 text-abby-blue border-abby-blue/30"
            >
              Step {currentStep + 1} of {onboardingQuestions.length}
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
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs capitalize",
                  getCategoryColor(currentQuestion.category),
                )}
              >
                {currentQuestion.category}
              </Badge>
              {currentQuestion.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
            <CardDescription>
              Take your time to think about your answer. This helps Abby AI
              understand you better.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderQuestionInput()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {onboardingQuestions.length}
            </p>
          </div>

          <Button
            onClick={handleNext}
            disabled={
              currentQuestion.required &&
              !currentAnswer &&
              currentAnswer !== false
            }
            className="flex items-center space-x-2 bg-abby-blue hover:bg-abby-blue/90"
          >
            {isSubmitting ? (
              <>
                <CheckCircle className="w-4 h-4 animate-pulse" />
                <span>Finishing...</span>
              </>
            ) : isLastStep ? (
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

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your responses are private and secure. They help us personalize your
            therapy experience.
          </p>
        </div>
      </div>
    </div>
  );
}
