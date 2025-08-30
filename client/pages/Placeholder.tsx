import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft, Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  suggestedPrompt?: string;
}

export default function Placeholder({
  title,
  description,
  suggestedPrompt,
}: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-abby-light via-white to-therapy-calm">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-abby-blue to-abby-green rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Abby AI</h1>
                <p className="text-xs text-muted-foreground">
                  Therapy Platform
                </p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="sm"
                  className="bg-abby-blue hover:bg-abby-blue/90"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <div className="p-4 bg-therapy-calm/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This page is currently under development.
                {suggestedPrompt && (
                  <>
                    <br />
                    <br />
                    <strong>Suggested prompt:</strong>
                    <br />"{suggestedPrompt}"
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/login">
                <Button className="w-full bg-abby-blue hover:bg-abby-blue/90">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
