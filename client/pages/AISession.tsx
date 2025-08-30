import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brain,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  MessageCircle,
  User,
  X,
  Pause,
  Play,
  CheckCircle,
} from "lucide-react";
import { ChatMessage } from "@shared/types";
import { clientApi } from "@/lib/api";
import { format } from "date-fns";

interface SessionState {
  id: string;
  startTime: Date;
  duration: number; // in minutes
  messagesCount: number;
  isActive: boolean;
}

const MAX_SESSION_DURATION = 120; // 2 hours in minutes

export default function AISession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({
    id: `session_${Date.now()}`,
    startTime: new Date(),
    duration: 0,
    messagesCount: 0,
    isActive: true,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Create real AI session in database and initialize
    const initializeSession = async () => {
      try {
        // Check if we have session data from navigation state first
        const routeState = location.state as { sessionId?: string; topic?: string; existingSession?: boolean } | null;

        let realSessionId: string;
        let topic = routeState?.topic || "General AI Therapy Session";

        if (routeState?.sessionId && routeState?.existingSession) {
          // Use existing session ID if provided and it's an existing session
          realSessionId = routeState.sessionId;

          // Update existing session status to in-progress if it's not already
          try {
            await clientApi.sendAIMessage(realSessionId, "Session resumed");
          } catch (error) {
            console.log("Session already in progress or message failed:", error);
          }
        } else if (routeState?.sessionId) {
          // Use existing session ID if provided
          realSessionId = routeState.sessionId;
        } else {
          // Create new AI session in database
          const response = await clientApi.startAISession(topic);
          realSessionId = response.session.id;
        }

        // Update session state with real database ID
        setSessionState(prev => ({
          ...prev,
          id: realSessionId
        }));

        // Send welcome message from Abby
        const welcomeMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          sessionId: realSessionId,
          sender: "ai",
          content: `Hi ${user?.firstName}! I'm Abby, your AI therapy companion. I'm here to listen and support you today. How are you feeling right now?`,
          timestamp: new Date().toISOString(),
          type: "text",
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize AI session:', error);
        // Fall back to client-side session ID if database creation fails
        const fallbackMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          sessionId: sessionState.id,
          sender: "ai",
          content: `Hi ${user?.firstName}! I'm Abby, your AI therapy companion. I'm here to listen and support you today. How are you feeling right now?`,
          timestamp: new Date().toISOString(),
          type: "text",
        };
        setMessages([fallbackMessage]);
      }
    };

    initializeSession();

    // Start session timer
    timerRef.current = setInterval(() => {
      setSessionState((prev) => {
        const duration = Math.floor(
          (Date.now() - prev.startTime.getTime()) / 1000 / 60,
        );
        if (duration >= MAX_SESSION_DURATION) {
          handleEndSession();
        }
        return { ...prev, duration };
      });
    }, 60000); // Update every minute

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sessionId: sessionState.id,
      sender: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message to AI using configured API key from admin settings
      const response = await clientApi.sendAIMessage(sessionState.id, inputValue.trim());

      if (response.response) {
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sessionId: sessionState.id,
          sender: "ai",
          content: response.response.content,
          timestamp: response.response.timestamp,
          type: response.response.type || "text",
        };

        setMessages((prev) => [...prev, aiMessage]);
        setSessionState((prev) => ({
          ...prev,
          messagesCount: prev.messagesCount + 2,
        }));

        // Play AI response if audio is enabled
        if (audioEnabled) {
          // TODO: Implement text-to-speech
          console.log("Playing AI response:", response.response.content);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_error_${Date.now()}`,
        sessionId: sessionState.id,
        sender: "ai",
        content:
          "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const responses = [
      "I understand how you're feeling. It's completely normal to experience these emotions. Can you tell me more about what specifically is troubling you?",
      "Thank you for sharing that with me. Your feelings are valid, and it takes courage to talk about them. What do you think might help you feel better?",
      "That sounds really challenging. It's okay to feel overwhelmed sometimes. What are some things that usually make you feel calmer or happier?",
      "I hear you, and I'm here to support you. It's important to remember that it's okay to not be okay sometimes. How can we work together to help you feel better?",
      "That's a really insightful observation about yourself. Understanding our emotions is the first step to managing them better. What do you think you've learned about yourself today?",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

          // For now, we'll convert to text using a simple placeholder
          // In a real implementation, you'd use speech-to-text service
          const transcribedText = await transcribeAudio(audioBlob);

          if (transcribedText) {
            setInputValue(transcribedText);
          }

          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Unable to access microphone. Please check your browser permissions.');
      }
    }
  };

  // Audio transcription with better placeholder responses
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    // In a real implementation, you would send this to a speech-to-text service
    // For now, return varied meaningful placeholder messages based on audio duration
    const duration = audioBlob.size / 16000; // Rough estimate

    const shortResponses = [
      "I'm feeling a bit anxious today.",
      "I've been having trouble sleeping lately.",
      "I'm dealing with some stress at work.",
      "I'm feeling overwhelmed with everything going on.",
      "I had a difficult conversation with someone close to me."
    ];

    const longResponses = [
      "I've been struggling with my emotions lately. I find myself feeling anxious in social situations and I'm not sure how to handle it. I think I need some guidance on coping strategies.",
      "Today has been particularly challenging for me. I've been overthinking a lot about my future and career decisions. I feel like I'm stuck and don't know which direction to take.",
      "I've been having recurring thoughts about a past relationship that ended badly. It's affecting my ability to trust new people and I'm wondering how to move forward and heal.",
      "I'm dealing with work-related stress that's starting to impact my personal life. I feel like I'm constantly under pressure and I need help finding better work-life balance.",
      "I've been feeling isolated and lonely lately, especially since moving to a new city. I'm having trouble making new connections and maintaining my mental health."
    ];

    if (duration > 5) {
      // For longer recordings, return more detailed responses
      return longResponses[Math.floor(Math.random() * longResponses.length)];
    } else if (duration > 1) {
      // For shorter recordings, return brief responses
      return shortResponses[Math.floor(Math.random() * shortResponses.length)];
    }

    return "";
  };

  const handleEndSession = () => {
    setSessionState((prev) => ({ ...prev, isActive: false }));
    setShowEndDialog(true);
  };

  const handleCompleteSession = () => {
    // Navigate to quiz
    navigate("/quiz", {
      state: {
        sessionId: sessionState.id,
        sessionDuration: sessionState.duration,
        messagesCount: sessionState.messagesCount,
      },
    });
  };

  const handleSkipQuiz = async () => {
    try {
      // Mark session as skipped (won't count towards progress)
      await clientApi.completeSession(sessionState.id, {
        skipped: true,
        rating: null,
        feedback: "Quiz skipped"
      });

      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to skip session:", error);
      // Navigate anyway
      navigate("/dashboard");
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_SESSION_DURATION - sessionState.duration;
  const progressPercentage =
    (sessionState.duration / MAX_SESSION_DURATION) * 100;

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm flex flex-col">
        {/* Header */}
        <div className="border-b border-border/40 bg-white/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/abby-avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-abby-blue to-abby-green text-white">
                    <Brain className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">Abby AI</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">
                  {formatTime(sessionState.duration)} /{" "}
                  {formatTime(MAX_SESSION_DURATION)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Session Time
                </div>
              </div>

              <Progress value={progressPercentage} className="w-24" />

              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                disabled={!sessionState.isActive}
              >
                End Session
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[80%] ${
                      message.sender === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8 mt-1">
                      {message.sender === "user" ? (
                        <>
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="bg-abby-blue text-white text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src="/abby-avatar.png" />
                          <AvatarFallback className="bg-gradient-to-br from-abby-blue to-abby-green text-white">
                            <Brain className="w-4 h-4" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.sender === "user"
                          ? "bg-abby-blue text-white"
                          : "bg-white border border-border/40 text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === "user"
                            ? "text-white/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(message.timestamp), "HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-abby-blue to-abby-green text-white">
                        <Brain className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-border/40 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-abby-blue rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-abby-blue rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-abby-blue rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/40 pt-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message to Abby..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={!sessionState.isActive}
                  className="pr-12 h-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="h-8 w-8 p-0"
                  >
                    {audioEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceRecording}
                disabled={!sessionState.isActive}
                className={`h-12 w-12 p-0 ${isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() || isLoading || !sessionState.isActive
                }
                className="h-12 w-12 p-0 bg-abby-blue hover:bg-abby-blue/90"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {remainingTime <= 30 && remainingTime > 0 && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2 text-orange-800">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Session ending in {remainingTime} minute
                    {remainingTime !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* End Session Dialog */}
        <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Session Complete</span>
              </DialogTitle>
              <DialogDescription>
                Great job completing your therapy session with Abby! Now let's
                take a short quiz to reflect on your experience.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-therapy-calm rounded-lg">
                  <div className="text-lg font-semibold text-abby-blue">
                    {formatTime(sessionState.duration)}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
                <div className="p-3 bg-therapy-calm rounded-lg">
                  <div className="text-lg font-semibold text-abby-green">
                    {Math.floor(sessionState.messagesCount / 2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Messages</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipQuiz}
                  className="flex-1"
                >
                  Skip Quiz
                </Button>
                <Button
                  onClick={handleCompleteSession}
                  className="flex-1 bg-abby-blue hover:bg-abby-blue/90"
                >
                  Take Quiz
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
