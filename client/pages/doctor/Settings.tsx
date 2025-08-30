import { useState, useEffect } from 'react';
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
  MapPin,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Save,
  Upload,
  Settings as SettingsIcon,
  Stethoscope,
  Clock,
  MessageCircle,
  Video,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doctorApi } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';


const specializations = [
  'Child Psychology',
  'Adolescent Therapy',
  'Anxiety Disorders',
  'Depression',
  'ADHD',
  'Autism Spectrum',
  'Behavioral Issues',
  'Family Therapy',
  'Trauma Therapy',
  'Social Skills Training'
];

const timeZones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo'
];

export default function DoctorSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch doctor settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await doctorApi.getSettings();

        // Transform API response to match our state structure
        const userData = response.user;
        const doctorProfile = userData.doctorProfile;

        setProfile({
          personalInfo: {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: doctorProfile?.address || '',
            avatar: userData.avatar || ''
          },
          professionalInfo: {
            license: doctorProfile?.licenseNumber || '',
            specializations: doctorProfile?.specializations || [],
            experience: doctorProfile?.experience || 0,
            bio: doctorProfile?.bio || '',
            education: doctorProfile?.education || [],
            certifications: doctorProfile?.certifications || []
          },
          preferences: {
            sessionDuration: doctorProfile?.sessionDuration || 50,
            maxSessionsPerDay: doctorProfile?.maxSessionsPerDay || 8,
            breakBetweenSessions: doctorProfile?.breakBetweenSessions || 10,
            timeZone: doctorProfile?.timeZone || 'UTC',
            workingDays: doctorProfile?.workingDays || [1, 2, 3, 4, 5],
            emailNotifications: doctorProfile?.emailNotifications ?? true,
            smsNotifications: doctorProfile?.smsNotifications ?? false,
            sessionReminders: doctorProfile?.sessionReminders ?? true,
            clientProgressReports: doctorProfile?.clientProgressReports ?? true
          },
          security: {
            twoFactorEnabled: doctorProfile?.twoFactorEnabled ?? false,
            lastPasswordChange: doctorProfile?.lastPasswordChange || new Date().toISOString(),
            loginNotifications: doctorProfile?.loginNotifications ?? true
          }
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleProfileUpdate = (section: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    const current = profile.professionalInfo.specializations;
    if (current.includes(specialization)) {
      handleProfileUpdate('professionalInfo', 'specializations', 
        current.filter(s => s !== specialization)
      );
    } else {
      handleProfileUpdate('professionalInfo', 'specializations', 
        [...current, specialization]
      );
    }
  };

  const handleWorkingDayToggle = (day: number) => {
    const current = profile.preferences.workingDays;
    if (current.includes(day)) {
      handleProfileUpdate('preferences', 'workingDays', 
        current.filter(d => d !== day)
      );
    } else {
      handleProfileUpdate('preferences', 'workingDays', 
        [...current, day].sort()
      );
    }
  };

  const handleSaveChanges = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await doctorApi.updateSettings({
        firstName: profile.personalInfo.firstName,
        lastName: profile.personalInfo.lastName,
        phone: profile.personalInfo.phone,
        avatar: profile.personalInfo.avatar,
        licenseNumber: profile.professionalInfo.license,
        specializations: profile.professionalInfo.specializations,
        education: profile.professionalInfo.education,
        experience: profile.professionalInfo.experience,
        bio: profile.professionalInfo.bio
      });

      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      // TODO: Implement password change API call
      console.log('Password updated');
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to update password:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abby-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && !profile) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">No profile data found</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile, preferences, and account settings
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.personalInfo.avatar} />
                      <AvatarFallback className="bg-abby-green text-white text-xl">
                        <Stethoscope className="w-8 h-8" />
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

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        value={profile.personalInfo.address}
                        onChange={(e) => handleProfileUpdate('personalInfo', 'address', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Tab */}
            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Update your credentials and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="license">License Number</Label>
                      <Input
                        id="license"
                        value={profile.professionalInfo.license}
                        onChange={(e) => handleProfileUpdate('professionalInfo', 'license', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        value={profile.professionalInfo.experience}
                        onChange={(e) => handleProfileUpdate('professionalInfo', 'experience', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      value={profile.professionalInfo.education}
                      onChange={(e) => handleProfileUpdate('professionalInfo', 'education', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Specializations</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {specializations.map(spec => (
                        <div key={spec} className="flex items-center space-x-2">
                          <Checkbox
                            id={spec}
                            checked={profile.professionalInfo.specializations.includes(spec)}
                            onCheckedChange={() => handleSpecializationToggle(spec)}
                          />
                          <Label htmlFor={spec} className="text-sm cursor-pointer">
                            {spec}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.professionalInfo.bio}
                      onChange={(e) => handleProfileUpdate('professionalInfo', 'bio', e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Write a brief professional biography..."
                    />
                  </div>

                  <div>
                    <Label>Current Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.professionalInfo.certifications.map(cert => (
                        <Badge key={cert} variant="secondary" className="bg-green-100 text-green-800">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Preferences</CardTitle>
                  <CardDescription>
                    Configure your session settings and working schedule
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sessionDuration">Default Session Duration (minutes)</Label>
                      <Select
                        value={profile.preferences.sessionDuration.toString()}
                        onValueChange={(value) => handleProfileUpdate('preferences', 'sessionDuration', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="50">50 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxSessions">Max Sessions per Day</Label>
                      <Select
                        value={profile.preferences.maxSessionsPerDay.toString()}
                        onValueChange={(value) => handleProfileUpdate('preferences', 'maxSessionsPerDay', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} sessions</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="breakTime">Break Between Sessions (minutes)</Label>
                      <Select
                        value={profile.preferences.breakBetweenSessions.toString()}
                        onValueChange={(value) => handleProfileUpdate('preferences', 'breakBetweenSessions', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Working Days</Label>
                    <div className="flex space-x-2 mt-2">
                      {dayNames.map((day, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <Checkbox
                            id={`day-${index}`}
                            checked={profile.preferences.workingDays.includes(index)}
                            onCheckedChange={() => handleWorkingDayToggle(index)}
                          />
                          <Label htmlFor={`day-${index}`} className="text-xs mt-1 cursor-pointer">
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Time Zone</Label>
                    <Select
                      value={profile.preferences.timeZone}
                      onValueChange={(value) => handleProfileUpdate('preferences', 'timeZone', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map(tz => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-abby-blue" />
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">Receive updates via email</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.preferences.emailNotifications}
                      onCheckedChange={(checked) => handleProfileUpdate('preferences', 'emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="w-5 h-5 text-abby-green" />
                      <div>
                        <div className="font-medium">SMS Notifications</div>
                        <div className="text-sm text-muted-foreground">Receive updates via text message</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.preferences.smsNotifications}
                      onCheckedChange={(checked) => handleProfileUpdate('preferences', 'smsNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Session Reminders</div>
                        <div className="text-sm text-muted-foreground">Get reminded about upcoming sessions</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.preferences.sessionReminders}
                      onCheckedChange={(checked) => handleProfileUpdate('preferences', 'sessionReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Client Progress Reports</div>
                        <div className="text-sm text-muted-foreground">Weekly progress summaries</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={profile.preferences.clientProgressReports}
                      onCheckedChange={(checked) => handleProfileUpdate('preferences', 'clientProgressReports', checked)}
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
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Change Password</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={!newPassword || newPassword !== confirmPassword}
                        className="bg-abby-blue hover:bg-abby-blue/90"
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {profile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
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

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Login Notifications</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Email on Login</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified when someone logs into your account
                        </div>
                      </div>
                      <Checkbox
                        checked={profile.security.loginNotifications}
                        onCheckedChange={(checked) => handleProfileUpdate('security', 'loginNotifications', checked)}
                      />
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
              className="bg-abby-green hover:bg-abby-green/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
