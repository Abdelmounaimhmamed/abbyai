import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Brain,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Shield,
  Heart,
  Send,
} from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    contactType: "general"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log("Form submitted:", formData);
    // Reset form or show success message
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
              <Link to="/about">
                <Button variant="ghost" size="sm">
                  About
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
              <MessageCircle className="w-3 h-3 mr-1" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              We're Here to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-abby-blue to-abby-green">
                Help
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Have questions about Abby AI? Need support for your child's therapy journey? 
              Our dedicated team is here to provide the assistance you need, when you need it.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-abby-blue to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Emergency Support</CardTitle>
                <CardDescription>24/7 crisis intervention available</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-abby-blue">1-800-ABBY-911</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Immediate assistance for urgent situations
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-abby-green to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">General Inquiries</CardTitle>
                <CardDescription>Questions about our platform</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-abby-green">support@abbyai.com</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Response within 24 hours
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Privacy & Safety</CardTitle>
                <CardDescription>Data protection concerns</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-purple-600">privacy@abbyai.com</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Secure communication guaranteed
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Clinical Team</CardTitle>
                <CardDescription>Licensed therapist consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-orange-600">clinical@abbyai.com</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Professional guidance available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form and Info */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactType">Type of Inquiry</Label>
                    <select
                      id="contactType"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      value={formData.contactType}
                      onChange={(e) => handleInputChange("contactType", e.target.value)}
                    >
                      <option value="general">General Information</option>
                      <option value="support">Technical Support</option>
                      <option value="clinical">Clinical Questions</option>
                      <option value="privacy">Privacy & Safety</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="partnership">Partnership Opportunities</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your inquiry"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide details about your inquiry..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-abby-blue hover:bg-abby-blue/90"
                    size="lg"
                  >
                    Send Message
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-abby-blue" />
                    Support Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Emergency Support:</span>
                    <span className="text-muted-foreground">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">General Support:</span>
                    <span className="text-muted-foreground">Mon-Fri, 8AM-8PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Clinical Team:</span>
                    <span className="text-muted-foreground">Mon-Fri, 9AM-6PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Weekend Support:</span>
                    <span className="text-muted-foreground">Sat-Sun, 10AM-4PM EST</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-abby-green" />
                    Our Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">Abby AI Headquarters</p>
                    <p className="text-muted-foreground">
                      123 Innovation Drive<br />
                      Silicon Valley, CA 94025<br />
                      United States
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-abby-blue/10 to-abby-green/10">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-abby-blue" />
                    Safety First
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    If your child is experiencing a mental health emergency, please contact your local 
                    emergency services immediately. For non-emergency crisis support, contact the 
                    National Suicide Prevention Lifeline at 988.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to common questions about Abby AI
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Is Abby AI safe for my child?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, safety is our top priority. All conversations are monitored by licensed therapists, 
                  and our AI is specifically designed with child safety protocols. We use bank-level encryption 
                  and comply with all privacy regulations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply register for an account, complete our initial assessment, and schedule your first session. 
                  Our platform will guide you through the entire process step by step.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">What if I need immediate help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  For emergencies, call 911 or your local emergency services. For urgent but non-emergency situations, 
                  contact our 24/7 crisis support line at 1-800-ABBY-911.
                </p>
              </CardContent>
            </Card>
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
