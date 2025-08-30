import express from 'express';
import cors from 'cors';

// Load environment variables manually to avoid path-to-regexp issues
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'abby-ai-therapy-platform-secret-key-production-2024';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:5173", "https://*.fly.dev", "https://*.builder.io"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'abby-ai-standalone-server',
    port: PORT
  });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Import Prisma and auth functions
    const { prisma } = await import('./lib/prisma');
    const { comparePassword, generateToken } = await import('./lib/auth');
    
    console.log('Looking up user:', email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      }
    });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('User found, checking password...');
    
    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      console.log('User not active:', email);
      return res.status(401).json({ error: 'Account is pending activation. Please contact an administrator.' });
    }

    console.log('Generating token for:', email);
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Prepare user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      profile: user.role === 'client' ? user.clientProfile : 
               user.role === 'doctor' ? user.doctorProfile : 
               user.adminProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log('Login successful for:', email);
    
    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
    
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      error: 'Internal server error',
      details: errorMessage
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const { verifyToken } = await import('./lib/auth');
    const { prisma } = await import('./lib/prisma');
    
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        hasCompletedOnboarding: true,
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    const userData = {
      ...user,
      profile: user.role === 'client' ? user.clientProfile : 
               user.role === 'doctor' ? user.doctorProfile : 
               user.adminProfile
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
});

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Standalone API server is working!', 
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    const { prisma } = await import('./lib/prisma');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Abby AI Standalone Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🌍 CORS enabled for frontend origins`);
  console.log(`📱 Ready to accept connections!`);
});

export default app;
