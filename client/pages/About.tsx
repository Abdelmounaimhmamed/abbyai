import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Brain,
  Heart,
  Shield,
  Users,
  Award,
  Target,
  Lightbulb,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function About() {
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
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="sm">
                  Contact
                </Button>
              </Link>
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

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-6 bg-therapy-focus/20 text-abby-blue border-abby-blue/30 hover:bg-therapy-focus/30">
              About Abby AI
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Empowering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-abby-blue to-abby-green">
                Young Minds
              </span>
              <br />
              Through AI-Powered Therapy
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Abby AI is a revolutionary therapy platform designed specifically for children under 15, 
              combining cutting-edge artificial intelligence with human expertise to provide safe, 
              effective, and personalized mental health support.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We believe every child deserves access to quality mental health support. 
                Our mission is to make therapy accessible, engaging, and effective for young minds 
                through innovative AI technology while maintaining the highest standards of safety and privacy.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-abby-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Accessibility</h4>
                    <p className="text-muted-foreground">Making therapy available 24/7 for children who need support</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-abby-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Safety First</h4>
                    <p className="text-muted-foreground">Ensuring secure, private, and age-appropriate interactions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-abby-green mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Evidence-Based</h4>
                    <p className="text-muted-foreground">Grounded in proven therapeutic techniques and child psychology</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-abby-blue to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-abby-blue">24/7</CardTitle>
                  <CardDescription>Available Support</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-abby-green to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-abby-green">100%</CardTitle>
                  <CardDescription>Privacy Protected</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-purple-600">1000+</CardTitle>
                  <CardDescription>Children Helped</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-orange-600">95%</CardTitle>
                  <CardDescription>Success Rate</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Advanced Technology Meets Human Care
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our platform combines state-of-the-art AI technology with evidence-based therapeutic practices,
              supervised by licensed mental health professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-abby-blue to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Cohere AI Technology</CardTitle>
                <CardDescription className="leading-relaxed">
                  Powered by advanced language models specifically fine-tuned for therapeutic conversations
                  with children, ensuring age-appropriate and empathetic responses.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-abby-green to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Human Oversight</CardTitle>
                <CardDescription className="leading-relaxed">
                  Licensed therapists monitor AI interactions and are available for direct sessions when needed,
                  ensuring professional care standards are maintained.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Personalized Learning</CardTitle>
                <CardDescription className="leading-relaxed">
                  Adaptive algorithms learn from each interaction to provide increasingly personalized
                  support tailored to each child's unique needs and progress.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-abby-blue to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Empathy</h3>
              <p className="text-muted-foreground">
                Every interaction is designed with deep understanding and compassion for children's emotional needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-abby-green to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Safety</h3>
              <p className="text-muted-foreground">
                Protecting children's privacy and well-being is our highest priority in every feature we build.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Excellence</h3>
              <p className="text-muted-foreground">
                We continuously improve our platform to provide the highest quality therapeutic support.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Inclusion</h3>
              <p className="text-muted-foreground">
                Our platform is designed to be accessible and welcoming to children from all backgrounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-abby-blue to-abby-green">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Support Your Child's Mental Health?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join our community of families who trust Abby AI to provide safe, effective therapy support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="px-8 py-3 text-lg bg-white text-abby-blue hover:bg-white/90"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg border-white/30 text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-abby-blue to-abby-green rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Abby AI</span>
              </Link>
              <p className="text-muted-foreground">
                Empowering young minds through personalized AI therapy and human
                support.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/ai-session"
                    className="hover:text-background transition-colors"
                  >
                    AI Therapy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sessions"
                    className="hover:text-background transition-colors"
                  >
                    Human Therapists
                  </Link>
                </li>
                <li>
                  <Link
                    to="/progress"
                    className="hover:text-background transition-colors"
                  >
                    Progress Tracking
                  </Link>
                </li>
                <li>
                  <Link
                    to="/certifications"
                    className="hover:text-background transition-colors"
                  >
                    Certification
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-background transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Safety Guidelines
                  </a>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-background transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-background transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-background transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-background transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-background transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/20 pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2025 Abby AI. All rights reserved. Built with care for
              young minds.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
