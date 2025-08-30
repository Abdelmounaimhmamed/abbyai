import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Debug server running' });
});

// Test auth endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Test database connection
    const { prisma } = await import('./lib/prisma');
    console.log('Prisma imported successfully');
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check password
    const { comparePassword } = await import('./lib/auth');
    const isValidPassword = await comparePassword(password, user.passwordHash);
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account not active' });
    }

    // Generate token
    const { generateToken } = await import('./lib/auth');
    const token = generateToken(user.id, user.email, user.role);

    // Prepare response
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
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Test database connection
app.get('/api/test/db', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma');
    const userCount = await prisma.user.count();
    res.json({ 
      message: 'Database connected', 
      userCount,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🐛 Debug server running on http://localhost:${PORT}`);
  console.log(`🔍 Test DB: http://localhost:${PORT}/api/test/db`);
  console.log(`🔑 Test Auth: POST http://localhost:${PORT}/api/auth/login`);
});
