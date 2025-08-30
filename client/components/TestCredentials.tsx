import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Crown, Stethoscope } from 'lucide-react';

const testCredentials = [
  {
    role: 'client',
    email: 'client@abbyai.com',
    password: 'password123',
    name: 'Emma Client',
    icon: User,
    color: 'bg-blue-500'
  },
  {
    role: 'doctor',
    email: 'doctor@abbyai.com', 
    password: 'password123',
    name: 'Dr. Sarah Wilson',
    icon: Stethoscope,
    color: 'bg-green-500'
  },
  {
    role: 'admin',
    email: 'admin@abbyai.com',
    password: 'password123', 
    name: 'Admin User',
    icon: Crown,
    color: 'bg-purple-500'
  }
];

export default function TestCredentials() {
  const { login, logout, user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string, role: string) => {
    setIsLoading(role);
    try {
      const success = await login(email, password);
      if (!success) {
        alert('Login failed! Please check credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error occurred.');
    } finally {
      setIsLoading(null);
    }
  };

  if (isAuthenticated && user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ Authenticated as {user.role}
          </CardTitle>
          <CardDescription>
            Welcome, {user.firstName} {user.lastName}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> <Badge variant="outline">{user.role}</Badge></div>
            <div><strong>Status:</strong> <Badge variant="default">{user.status}</Badge></div>
          </div>
          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Test Authentication</CardTitle>
          <CardDescription>
            Click any button below to test login for different user roles
          </CardDescription>
        </CardHeader>
      </Card>

      {testCredentials.map((cred) => {
        const IconComponent = cred.icon;
        return (
          <Card key={cred.role} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${cred.color} text-white`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{cred.name}</div>
                    <div className="text-sm text-muted-foreground">{cred.email}</div>
                    <Badge variant="secondary" className="mt-1">
                      {cred.role}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handleLogin(cred.email, cred.password, cred.role)}
                  disabled={isLoading !== null}
                  className="ml-4"
                >
                  {isLoading === cred.role ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
