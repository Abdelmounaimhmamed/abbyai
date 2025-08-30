import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Save,
  Upload,
  Settings as SettingsIcon,
  Award,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  Download,
  Key,
  Database,
  Server,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Mock admin profile data
const mockAdminProfile = {
  personalInfo: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@abbyai.com',
    phone: '+1 (555) 987-6543',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
  },
  platformSettings: {
    siteName: 'Abby AI Therapy Platform',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    paymentVerificationRequired: true,
    sessionDurationLimit: 120, // minutes
    maxSessionsPerClient: 10,
    certificationRequirements: {
      minSessions: 2,
      minQuizScore: 70,
      requireQuizCompletion: true
    }
  },
  notifications: {
    newUserRegistrations: true,
    paymentSubmissions: true,
    sessionRequests: true,
    systemAlerts: true,
    weeklyReports: true,
    emailNotifications: true,
    smsNotifications: false
  },
  security: {
    twoFactorEnabled: true,
    sessionTimeout: 60, // minutes
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true
    },
    loginNotifications: true
  }
};

// Mock pending certifications
const mockPendingCertifications = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Alice Johnson',
    sessionsCompleted: 2,
    averageQuizScore: 88,
    certificationType: 'Anxiety Management Basics',
    submittedAt: '2024-01-22T10:00:00Z',
    status: 'pending'
  },
  {
    id: '2',
    clientId: '3',
    clientName: 'Carol Wilson',
    sessionsCompleted: 2,
    averageQuizScore: 85,
    certificationType: 'Anxiety Management Basics',
    submittedAt: '2024-01-21T14:30:00Z',
    status: 'pending'
  }
];

export default function AdminSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(mockAdminProfile);
  const [pendingCertifications, setPendingCertifications] = useState(mockPendingCertifications);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileUpdate = (section: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleNestedUpdate = (section: string, subsection: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleCertificationAction = (certId: string, action: 'approve' | 'reject') => {
    setPendingCertifications(prev => 
      prev.map(cert => 
        cert.id === certId 
          ? { ...cert, status: action === 'approve' ? 'approved' : 'rejected' }
          : cert
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings updated:', profile);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${colors[status as keyof typeof colors]} border-0`}>
        {status}
      </Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground">
              Manage platform settings, certifications, and administrative preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="api-config">API Config</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Administrator Profile</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.personalInfo.avatar} />
                      <AvatarFallback className="bg-red-600 text-white text-xl">
                        <Shield className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recommended: Square image, at least 200x200px
                      </p>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.personalInfo.firstName}
                        onChange={(e) => handleProfileUpdate('personalInfo', 'firstName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.personalInfo.lastName}
                        onChange={(e) => handleProfileUpdate('personalInfo', 'lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.personalInfo.email}
                        onChange={(e) => handleProfileUpdate('personalInfo', 'email', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profile.personalInfo.phone}
                        onChange={(e) => handleProfileUpdate('personalInfo', 'phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platform Settings Tab */}
            <TabsContent value="platform" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Configuration</CardTitle>
                  <CardDescription>
                    Configure global platform settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={profile.platformSettings.siteName}
                      onChange={(e) => handleProfileUpdate('platformSettings', 'siteName', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionDuration">Max Session Duration (minutes)</Label>
                      <Select
                        value={profile.platformSettings.sessionDurationLimit.toString()}
                        onValueChange={(value) => handleProfileUpdate('platformSettings', 'sessionDurationLimit', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                          <SelectItem value="150">150 minutes</SelectItem>
                          <SelectItem value="180">180 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxSessions">Max Sessions per Client</Label>
                      <Select
                        value={profile.platformSettings.maxSessionsPerClient.toString()}
                        onValueChange={(value) => handleProfileUpdate('platformSettings', 'maxSessionsPerClient', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i + 5).map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} sessions</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Platform Features</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Registration Enabled</div>
                          <div className="text-sm text-muted-foreground">Allow new user registrations</div>
                        </div>
                      </div>
                      <Checkbox
                        checked={profile.platformSettings.registrationEnabled}
                        onCheckedChange={(checked) => handleProfileUpdate('platformSettings', 'registrationEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium">Email Verification Required</div>
                          <div className="text-sm text-muted-foreground">Require email verification for new accounts</div>
                        </div>
                      </div>
                      <Checkbox
                        checked={profile.platformSettings.emailVerificationRequired}
                        onCheckedChange={(checked) => handleProfileUpdate('platformSettings', 'emailVerificationRequired', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium">Payment Verification Required</div>
                          <div className="text-sm text-muted-foreground">Require payment verification before activation</div>
                        </div>
                      </div>
                      <Checkbox
                        checked={profile.platformSettings.paymentVerificationRequired}
                        onCheckedChange={(checked) => handleProfileUpdate('platformSettings', 'paymentVerificationRequired', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Server className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="font-medium">Maintenance Mode</div>
                          <div className="text-sm text-muted-foreground">Disable platform access for maintenance</div>
                        </div>
                      </div>
                      <Checkbox
                        checked={profile.platformSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleProfileUpdate('platformSettings', 'maintenanceMode', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Certification Requirements</CardTitle>
                  <CardDescription>
                    Configure the requirements for client certifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minSessions">Minimum Sessions Required</Label>
                      <Select
                        value={profile.platformSettings.certificationRequirements.minSessions.toString()}
                        onValueChange={(value) => handleNestedUpdate('platformSettings', 'certificationRequirements', 'minSessions', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} session{num !== 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="minQuizScore">Minimum Quiz Score (%)</Label>
                      <Select
                        value={profile.platformSettings.certificationRequirements.minQuizScore.toString()}
                        onValueChange={(value) => handleNestedUpdate('platformSettings', 'certificationRequirements', 'minQuizScore', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, i) => (i + 5) * 10).map(score => (
                            <SelectItem key={score} value={score.toString()}>{score}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Require Quiz Completion</div>
                      <div className="text-sm text-muted-foreground">
                        All sessions must have completed quizzes for certification
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.platformSettings.certificationRequirements.requireQuizCompletion}
                      onCheckedChange={(checked) => handleNestedUpdate('platformSettings', 'certificationRequirements', 'requireQuizCompletion', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Configuration Tab */}
            <TabsContent value="api-config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    Configure AI model API keys and chat response settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <Key className="w-5 h-5 mr-2 text-blue-600" />
                      2025 Model API Key
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      This API key will be used for all chat responses to users. Configure the key for your preferred 2025 AI model provider.
                    </p>

                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <Label htmlFor="api-provider">AI Provider</Label>
                        <Select defaultValue="openai">
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select AI provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                            <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                            <SelectItem value="cohere">Cohere Command</SelectItem>
                            <SelectItem value="google">Google Gemini</SelectItem>
                            <SelectItem value="custom">Custom Provider</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="model-name">Model Name</Label>
                        <Input
                          id="model-name"
                          placeholder="e.g., gpt-4-turbo, claude-3-opus, etc."
                          className="mt-2"
                          defaultValue="gpt-4-turbo"
                        />
                      </div>

                      <div>
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="relative mt-2">
                          <Input
                            id="api-key"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your 2025 model API key"
                            defaultValue="sk-proj-*****************************"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This key will be used for all chat interactions with users
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="api-endpoint">API Endpoint (Optional)</Label>
                        <Input
                          id="api-endpoint"
                          placeholder="https://api.openai.com/v1/chat/completions"
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave blank to use default provider endpoint
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max-tokens">Max Tokens</Label>
                          <Input
                            id="max-tokens"
                            type="number"
                            placeholder="4096"
                            className="mt-2"
                            defaultValue="4096"
                          />
                        </div>
                        <div>
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            placeholder="0.7"
                            className="mt-2"
                            defaultValue="0.7"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Enable Chat Responses</div>
                          <div className="text-sm text-muted-foreground">
                            Allow the AI to respond to user messages using this API key
                          </div>
                        </div>
                        <Checkbox defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Stream Responses</div>
                          <div className="text-sm text-muted-foreground">
                            Enable real-time streaming of AI responses
                          </div>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Key className="w-4 h-4 mr-2" />
                        Test API Connection
                      </Button>
                      <Button variant="outline">
                        Save API Configuration
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-green-600" />
                      Chat Configuration
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="system-prompt">System Prompt</Label>
                        <Textarea
                          id="system-prompt"
                          placeholder="You are Abby, a helpful AI therapy assistant..."
                          className="mt-2"
                          rows={4}
                          defaultValue="You are Abby, a compassionate AI therapy assistant. You provide supportive, evidence-based guidance while maintaining professional boundaries. Always encourage users to seek professional help for serious mental health concerns."
                        />
                      </div>
                      <div>
                        <Label htmlFor="response-guidelines">Response Guidelines</Label>
                        <Textarea
                          id="response-guidelines"
                          placeholder="Always be empathetic and supportive..."
                          className="mt-2"
                          rows={4}
                          defaultValue="- Be empathetic and supportive
- Use evidence-based therapeutic techniques
- Maintain professional boundaries
- Encourage self-reflection
- Suggest coping strategies when appropriate
- Always recommend professional help for serious issues"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <Select defaultValue="30">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="max-messages">Max Messages per Session</Label>
                        <Input
                          id="max-messages"
                          type="number"
                          placeholder="50"
                          className="mt-2"
                          defaultValue="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="response-delay">Response Delay (ms)</Label>
                        <Input
                          id="response-delay"
                          type="number"
                          placeholder="1000"
                          className="mt-2"
                          defaultValue="1000"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certification Approvals</CardTitle>
                  <CardDescription>
                    Review and approve client certification requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingCertifications.filter(cert => cert.status === 'pending').length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Certification Type</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Avg Quiz Score</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingCertifications.filter(cert => cert.status === 'pending').map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell>
                              <div className="font-medium">{cert.clientName}</div>
                              <div className="text-sm text-muted-foreground">ID: {cert.clientId}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {cert.certificationType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{cert.sessionsCompleted}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Award className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">{cert.averageQuizScore}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(cert.submittedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleCertificationAction(cert.id, 'approve')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCertificationAction(cert.id, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Pending Certifications</h3>
                      <p className="text-muted-foreground">
                        All certification requests have been processed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processed Certifications */}
              {pendingCertifications.filter(cert => cert.status !== 'pending').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Processed</CardTitle>
                    <CardDescription>
                      Recently approved or rejected certification requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingCertifications.filter(cert => cert.status !== 'pending').map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-purple-600 text-white text-xs">
                                {cert.clientName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{cert.clientName}</div>
                              <div className="text-sm text-muted-foreground">{cert.certificationType}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(cert.status)}
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how and when you receive platform notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">New User Registrations</div>
                        <div className="text-sm text-muted-foreground">Get notified when new users register</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.notifications.newUserRegistrations}
                      onCheckedChange={(checked) => handleProfileUpdate('notifications', 'newUserRegistrations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Payment Submissions</div>
                        <div className="text-sm text-muted-foreground">New payment verification requests</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.notifications.paymentSubmissions}
                      onCheckedChange={(checked) => handleProfileUpdate('notifications', 'paymentSubmissions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Session Requests</div>
                        <div className="text-sm text-muted-foreground">Human therapist session requests</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.notifications.sessionRequests}
                      onCheckedChange={(checked) => handleProfileUpdate('notifications', 'sessionRequests', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium">System Alerts</div>
                        <div className="text-sm text-muted-foreground">Critical system notifications</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.notifications.systemAlerts}
                      onCheckedChange={(checked) => handleProfileUpdate('notifications', 'systemAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Weekly Reports</div>
                        <div className="text-sm text-muted-foreground">Platform usage and performance reports</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.notifications.weeklyReports}
                      onCheckedChange={(checked) => handleProfileUpdate('notifications', 'weeklyReports', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage platform security and administrative access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Password Policy</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Minimum Password Length</Label>
                        <Select
                          value={profile.security.passwordPolicy.minLength.toString()}
                          onValueChange={(value) => handleNestedUpdate('security', 'passwordPolicy', 'minLength', parseInt(value))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 9 }, (_, i) => i + 6).map(length => (
                              <SelectItem key={length} value={length.toString()}>{length} characters</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Session Timeout (minutes)</Label>
                        <Select
                          value={profile.security.sessionTimeout.toString()}
                          onValueChange={(value) => handleProfileUpdate('security', 'sessionTimeout', parseInt(value))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Require numbers in passwords</span>
                        <Checkbox
                          checked={profile.security.passwordPolicy.requireNumbers}
                          onCheckedChange={(checked) => handleNestedUpdate('security', 'passwordPolicy', 'requireNumbers', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Require symbols in passwords</span>
                        <Checkbox
                          checked={profile.security.passwordPolicy.requireSymbols}
                          onCheckedChange={(checked) => handleNestedUpdate('security', 'passwordPolicy', 'requireSymbols', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Require uppercase letters</span>
                        <Checkbox
                          checked={profile.security.passwordPolicy.requireUppercase}
                          onCheckedChange={(checked) => handleNestedUpdate('security', 'passwordPolicy', 'requireUppercase', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Administrator Security</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          Two-Factor Authentication
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {profile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <Button 
                        variant={profile.security.twoFactorEnabled ? "destructive" : "default"}
                        onClick={() => handleProfileUpdate('security', 'twoFactorEnabled', !profile.security.twoFactorEnabled)}
                      >
                        {profile.security.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
