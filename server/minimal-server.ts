import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple test credentials
  if (email === 'client@abbyai.com' && password === 'password123') {
    res.json({
      message: 'Login successful',
      token: 'test-token-123',
      user: {
        id: '1',
        email: 'client@abbyai.com',
        firstName: 'Test',
        lastName: 'Client',
        role: 'client',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
