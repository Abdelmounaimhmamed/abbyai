import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = 3001;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "abby-ai-therapy-platform-secret-key-production-2024";

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ",
    },
  },
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "24h" });
};

const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as {
    userId: string;
    email: string;
    role: string;
  };
};

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "simple-auth-server",
    database: "connected",
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Simple auth server is working!",
    timestamp: new Date().toISOString(),
  });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = "client",
      dateOfBirth,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "Email, password, first name, and last name are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as any,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isActive: role === "client",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (role === "client") {
      await prisma.clientProfile.create({
        data: { userId: user.id },
      });
    } else if (role === "doctor") {
      await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          licenseNumber: "",
          specializations: [],
          education: [],
          experience: 0,
          workingHours: {},
        },
      });
    } else if (role === "admin") {
      await prisma.adminProfile.create({
        data: {
          userId: user.id,
          permissions: [],
        },
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error:
          "Account is pending activation. Please contact an administrator.",
      });
    }

    const token = generateToken(user.id, user.email, user.role);

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
      profile:
        user.role === "client"
          ? user.clientProfile
          : user.role === "doctor"
            ? user.doctorProfile
            : user.adminProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log("Login successful for user:", userData.email);
    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = {
      ...user,
      profile:
        user.role === "client"
          ? user.clientProfile
          : user.role === "doctor"
            ? user.doctorProfile
            : user.adminProfile,
    };

    res.json({ user: userData });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile
app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
  try {
    const { firstName, lastName, phone, avatar, ...profileData } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone,
        avatar,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    let profile = null;
    if (req.user.role === "client" && profileData) {
      profile = await prisma.clientProfile.update({
        where: { userId: req.user.id },
        data: profileData,
      });
    } else if (req.user.role === "doctor" && profileData) {
      profile = await prisma.doctorProfile.update({
        where: { userId: req.user.id },
        data: profileData,
      });
    } else if (req.user.role === "admin" && profileData) {
      profile = await prisma.adminProfile.update({
        where: { userId: req.user.id },
        data: profileData,
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: { ...updatedUser, profile },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Complete onboarding
app.post("/api/auth/onboarding", authenticateToken, async (req: any, res) => {
  try {
    const onboardingData = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { hasCompletedOnboarding: true },
    });

    let updatedProfile = null;
    if (req.user.role === "client") {
      updatedProfile = await prisma.clientProfile.update({
        where: { userId: req.user.id },
        data: {
          emergencyContact: onboardingData.emergencyContact,
          primaryGoals: onboardingData.primaryGoals || [],
          anxietyTriggers: onboardingData.anxietyTriggers || [],
          preferredTherapyType: onboardingData.preferredTherapyType || [],
          previousTherapyExperience:
            onboardingData.previousTherapyExperience || false,
          medicationStatus: onboardingData.medicationStatus,
        },
      });
    } else if (req.user.role === "doctor") {
      updatedProfile = await prisma.doctorProfile.update({
        where: { userId: req.user.id },
        data: {
          licenseNumber: onboardingData.licenseNumber,
          specializations: onboardingData.specializations || [],
          education: onboardingData.education || [],
          experience: onboardingData.experience || 0,
          bio: onboardingData.bio,
          workingHours: onboardingData.workingHours || {},
          sessionDuration: onboardingData.sessionDuration || 120,
          breakBetweenSessions: onboardingData.breakBetweenSessions || 15,
        },
      });
    }

    res.json({
      message: "Onboarding completed successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  },
);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Auth Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`💾 Database: Connected to Prisma PostgreSQL`);
  console.log(`📱 Ready to accept connections!`);
});

export default app;
