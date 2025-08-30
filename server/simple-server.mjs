import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'simple-server'
  });
});

// Mock login endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Simple mock authentication
  const mockUsers = {
    'client@abbyai.com': {
      id: 'client-123',
      email: 'client@abbyai.com',
      firstName: 'Emma',
      lastName: 'Client',
      role: 'client',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    'doctor@abbyai.com': {
      id: 'doctor-123', 
      email: 'doctor@abbyai.com',
      firstName: 'Dr. Sarah',
      lastName: 'Wilson',
      role: 'doctor',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    'admin@abbyai.com': {
      id: 'admin-123',
      email: 'admin@abbyai.com', 
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  };
  
  if (mockUsers[email] && password === 'password123') {
    const user = mockUsers[email];
    const token = 'mock-jwt-token-' + Date.now();
    
    console.log('Login successful for:', email);
    
    res.json({
      message: 'Login successful',
      token,
      user
    });
  } else {
    console.log('Invalid credentials for:', email);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Simple server is working!' });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`🔑 Auth: http://localhost:${PORT}/api/auth/login`);
});
