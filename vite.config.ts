import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Custom plugin to add Express server middleware with real database
const databaseServerPlugin = (): Plugin => ({
  name: "database-server",
  configureServer: async (server) => {
    // Import the server routes
    const express = await import("express");
    const cors = await import("cors");

    const app = express.default();

    // Auto-seed database on startup
    setTimeout(async () => {
      try {
        console.log('��� Auto-seeding database...');
        const { PrismaClient } = await import("@prisma/client");
        const bcrypt = await import("bcryptjs");

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Create test users if they don't exist
        const existingClient = await prisma.user.findUnique({
          where: { email: 'client@abbyai.com' }
        });

        if (!existingClient) {
          console.log('👤 Creating test client...');
          await prisma.user.create({
            data: {
              email: 'client@abbyai.com',
              passwordHash: await bcrypt.hash('password123', 12),
              firstName: 'Emma',
              lastName: 'Client',
              role: 'client',
              isActive: true,
              hasCompletedOnboarding: true,
              dateOfBirth: new Date('1995-06-15'),
              phone: '+1-555-0123',
              clientProfile: {
                create: {
                  emergencyContact: 'John Client - +1-555-0124',
                  primaryGoals: ['Anxiety Management', 'Stress Reduction'],
                  anxietyTriggers: ['Public Speaking', 'Social Situations'],
                  preferredTherapyType: ['CBT', 'Mindfulness'],
                  previousTherapyExperience: true,
                  medicationStatus: 'None',
                  totalSessionsCompleted: 3,
                  totalQuizzesCompleted: 3,
                  progressLevel: 2
                }
              }
            }
          });
        }

        const existingDoctor = await prisma.user.findUnique({
          where: { email: 'doctor@abbyai.com' }
        });

        if (!existingDoctor) {
          console.log('👨‍⚕️ Creating test doctor...');
          await prisma.user.create({
            data: {
              email: 'doctor@abbyai.com',
              passwordHash: await bcrypt.hash('password123', 12),
              firstName: 'Dr. Sarah',
              lastName: 'Wilson',
              role: 'doctor',
              isActive: true,
              phone: '+1-555-0125',
              doctorProfile: {
                create: {
                  licenseNumber: 'PSY-12345',
                  specializations: ['Anxiety Disorders', 'Depression', 'CBT'],
                  education: ['PhD Psychology - Harvard University', 'MS Clinical Psychology - Stanford'],
                  experience: 8,
                  bio: 'Specialized in cognitive behavioral therapy with 8+ years experience helping clients with anxiety and depression.',
                  workingHours: {
                    monday: { start: '09:00', end: '17:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '17:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '17:00', isAvailable: true },
                    thursday: { start: '09:00', end: '17:00', isAvailable: true },
                    friday: { start: '09:00', end: '15:00', isAvailable: true },
                    saturday: { start: '10:00', end: '14:00', isAvailable: false },
                    sunday: { start: '10:00', end: '14:00', isAvailable: false }
                  },
                  sessionDuration: 120,
                  breakBetweenSessions: 15,
                  isApproved: true,
                  approvedAt: new Date()
                }
              }
            }
          });
        }

        const existingAdmin = await prisma.user.findUnique({
          where: { email: 'admin@abbyai.com' }
        });

        if (!existingAdmin) {
          console.log('👑 Creating test admin...');
          await prisma.user.create({
            data: {
              email: 'admin@abbyai.com',
              passwordHash: await bcrypt.hash('password123', 12),
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
              isActive: true,
              phone: '+1-555-0126',
              adminProfile: {
                create: {
                  permissions: ['user_management', 'doctor_approval', 'payment_verification', 'certification_approval'],
                  lastLogin: new Date()
                }
              }
            }
          });
        }

        await prisma.$disconnect();
        console.log('✅ Database seeded successfully!');
        console.log('🔐 Test Credentials:');
        console.log('👤 Client: client@abbyai.com / password123');
        console.log('👨‍⚕️ Doctor: doctor@abbyai.com / password123');
        console.log('👑 Admin: admin@abbyai.com / password123');
      } catch (error) {
        console.error('❌ Error seeding database:', error);
      }
    }, 2000); // Wait 2 seconds for server to be ready

    // Middleware
    app.use(
      cors.default({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    );
    app.use(express.default.json({ limit: "10mb" }));

    // Add a debug middleware to log all requests
    app.use("/api", (req, res, next) => {
      console.log(`API ${req.method} ${req.path}`, req.body);
      next();
    });

    // Real database authentication endpoint
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        console.log("Database login attempt:", email);

        if (!email || !password) {
          return res.status(400).json({ error: "Email and password required" });
        }

        // Import database functions dynamically
        const { PrismaClient } = await import("@prisma/client");
        const bcrypt = await import("bcryptjs");
        const jwt = await import("jsonwebtoken");

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        console.log("Database: Looking up user:", email);

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            clientProfile: true,
            doctorProfile: true,
            adminProfile: true,
          },
        });

        if (!user) {
          console.log("Database: User not found:", email);
          await prisma.$disconnect();
          return res.status(401).json({ error: "Invalid email or password" });
        }

        console.log("Database: User found, checking password...");

        // Check password
        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash,
        );
        if (!isValidPassword) {
          console.log("Database: Invalid password for:", email);
          await prisma.$disconnect();
          return res.status(401).json({ error: "Invalid email or password" });
        }

        if (!user.isActive) {
          console.log("Database: User not active:", email);
          await prisma.$disconnect();
          return res.status(401).json({
            error:
              "Account is pending activation. Please contact an administrator.",
          });
        }

        console.log("Database: Generating token for:", email);

        // Generate token
        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const token = jwt.default.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "24h" },
        );

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
          profile:
            user.role === "client"
              ? user.clientProfile
              : user.role === "doctor"
                ? user.doctorProfile
                : user.adminProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        console.log("Database: Login successful for:", email);

        await prisma.$disconnect();

        res.json({
          message: "Login successful",
          token,
          user: userData,
        });
      } catch (error) {
        console.error("Database login error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
          error: "Internal server error",
          details: errorMessage,
        });
      }
    });

    // Real database registration endpoint
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

        // Import database functions
        const { PrismaClient } = await import("@prisma/client");
        const bcrypt = await import("bcryptjs");

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          await prisma.$disconnect();
          return res
            .status(400)
            .json({ error: "User with this email already exists" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: role as any,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            isActive: role === "client", // Auto-activate clients, doctors/admins need approval
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

        // Create role-specific profile
        if (role === "client") {
          await prisma.clientProfile.create({
            data: {
              userId: user.id,
            },
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

        await prisma.$disconnect();

        res.status(201).json({
          message: "User registered successfully",
          user,
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get current user endpoint
    app.get("/api/auth/me", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";

        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            clientProfile: true,
            doctorProfile: true,
            adminProfile: true,
          },
        });

        if (!user || !user.isActive) {
          await prisma.$disconnect();
          return res.status(401).json({ error: "Invalid or inactive user" });
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

        await prisma.$disconnect();

        res.json({ user: userData });
      } catch (error) {
        console.error("Get user error:", error);
        res.status(401).json({ error: "Invalid token" });
      }
    });

    // Complete onboarding endpoint
    app.post("/api/auth/onboarding", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";

        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const onboardingData = req.body;
        const userId = decoded.userId;
        const userRole = decoded.role;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Update user onboarding status
        await prisma.user.update({
          where: { id: userId },
          data: { hasCompletedOnboarding: true }
        });

        let updatedProfile = null;

        if (userRole === 'client') {
          // Update client profile with onboarding data
          updatedProfile = await prisma.clientProfile.update({
            where: { userId },
            data: {
              emergencyContact: onboardingData.emergencyContact,
              primaryGoals: onboardingData.primaryGoals || [],
              anxietyTriggers: onboardingData.anxietyTriggers || [],
              preferredTherapyType: onboardingData.preferredTherapyType || [],
              previousTherapyExperience: onboardingData.previousTherapyExperience || false,
              medicationStatus: onboardingData.medicationStatus,
            }
          });
        } else if (userRole === 'doctor' && onboardingData.doctorProfile) {
          // Update doctor profile with onboarding data
          const doctorData = onboardingData.doctorProfile;
          updatedProfile = await prisma.doctorProfile.update({
            where: { userId },
            data: {
              licenseNumber: doctorData.licenseNumber,
              specializations: doctorData.specializations || [],
              education: doctorData.education || [],
              experience: doctorData.experience || 0,
              bio: doctorData.bio,
              workingHours: doctorData.workingHours || {},
              sessionDuration: doctorData.sessionDuration || 60,
              breakBetweenSessions: doctorData.breakBetweenSessions || 15,
              isAvailable: true
            }
          });
        }

        await prisma.$disconnect();

        res.json({
          message: 'Onboarding completed successfully',
          profile: updatedProfile
        });
      } catch (error) {
        console.error("Onboarding error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Test health endpoint
    app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "neon-connected",
      });
    });

    // Debug endpoint to check users and test authentication
    app.get("/api/debug/users", async (req, res) => {
      try {
        const { PrismaClient } = await import("@prisma/client");
        const bcrypt = await import("bcryptjs");

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Get all users and test password for client
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            passwordHash: true
          }
        });

        // Test password comparison for client
        const client = users.find(u => u.email === 'client@abbyai.com');
        const passwordTest = client ? await bcrypt.compare('password123', client.passwordHash) : false;

        await prisma.$disconnect();

        res.json({
          message: "Debug info",
          userCount: users.length,
          users: users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            isActive: u.isActive,
            hasPasswordHash: !!u.passwordHash,
            passwordHashLength: u.passwordHash?.length || 0
          })),
          clientPasswordTest: {
            clientExists: !!client,
            passwordMatches: passwordTest
          }
        });
      } catch (error) {
        console.error("Debug users error:", error);
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
      }
    });

    // Simple test endpoint
    app.get("/api/test", (req, res) => {
      res.json({ message: "Database API is working from Vite middleware!" });
    });

    // Session request/booking endpoint for clients
    app.post("/api/client/sessions/request", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'client') {
          return res.status(403).json({ error: "Only clients can request sessions" });
        }

        const { preferredDate, preferredTime, reason, doctorId, sessionType = 'human' } = req.body;

        if (!preferredDate || !preferredTime || !reason) {
          return res.status(400).json({ error: "Preferred date, time, and reason are required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Parse the preferred date and time
        const scheduledAt = new Date(`${preferredDate}T${preferredTime}`);

        // If no specific doctor requested, leave it null for admin assignment
        // Human therapist sessions without assigned doctor should be pending for admin review
        const needsAssignment = sessionType === 'human' && !doctorId;
        const sessionData = {
          clientId: decoded.userId,
          type: sessionType,
          status: needsAssignment ? 'pending' : 'scheduled',
          scheduledAt,
          topic: reason,
          ...(doctorId && { doctorId })
        };

        const session = await prisma.session.create({
          data: sessionData,
          include: {
            client: {
              select: { firstName: true, lastName: true, email: true }
            },
            doctor: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        await prisma.$disconnect();

        res.json({
          message: "Session request submitted successfully",
          session: {
            id: session.id,
            type: session.type,
            status: session.status,
            scheduledAt: session.scheduledAt,
            topic: session.topic,
            clientName: `${session.client.firstName} ${session.client.lastName}`,
            doctorName: session.doctor ? `${session.doctor.firstName} ${session.doctor.lastName}` : 'To be assigned',
            needsApproval: !session.doctorId
          }
        });
      } catch (error) {
        console.error("Session request error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get available doctors for booking
    app.get("/api/client/doctors", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const doctors = await prisma.user.findMany({
          where: {
            role: 'doctor',
            isActive: true,
            doctorProfile: {
              isApproved: true
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            doctorProfile: {
              select: {
                licenseNumber: true,
                specializations: true,
                education: true,
                experience: true,
                bio: true,
                workingHours: true,
                sessionDuration: true,
                breakBetweenSessions: true,
                isApproved: true
              }
            }
          }
        });

        await prisma.$disconnect();

        res.json({
          doctors: doctors.map(doctor => ({
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            avatar: doctor.avatar,
            profile: doctor.doctorProfile,
            specializations: doctor.doctorProfile?.specializations || [],
            experience: doctor.doctorProfile?.experience || 0,
            bio: doctor.doctorProfile?.bio || '',
            workingHours: doctor.doctorProfile?.workingHours || {},
            sessionDuration: doctor.doctorProfile?.sessionDuration || 120
          }))
        });
      } catch (error) {
        console.error("Get doctors error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get client sessions
    app.get("/api/client/sessions", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const sessions = await prisma.session.findMany({
          where: { clientId: decoded.userId },
          include: {
            doctor: {
              select: { firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        await prisma.$disconnect();

        res.json({
          sessions: sessions.map(session => ({
            id: session.id,
            type: session.type,
            status: session.status,
            scheduledAt: session.scheduledAt,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            topic: session.topic,
            summary: session.summary,
            doctorName: session.doctor ? `${session.doctor.firstName} ${session.doctor.lastName}` : 'To be assigned',
            clientRating: session.clientRating,
            clientFeedback: session.clientFeedback,
            createdAt: session.createdAt
          }))
        });
      } catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Client dashboard endpoints
    app.get("/api/client/dashboard", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Get user sessions
        const sessions = await prisma.session.findMany({
          where: { clientId: decoded.userId },
          include: {
            doctor: {
              select: { firstName: true, lastName: true },
            },
            quizResult: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        // Get user certifications
        const certifications = await prisma.userCertification.findMany({
          where: { userId: decoded.userId },
          include: {
            certification: true,
          },
        });

        // Get user profile with progress
        const userProfile = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            clientProfile: true,
          },
        });

        // Calculate stats
        const completedSessions = sessions.filter(
          (s) => s.status === "completed",
        ).length;
        const completedQuizzes = sessions.filter((s) => s.quizResult).length;
        const averageQuizScore =
          sessions
            .filter((s) => s.quizResult)
            .reduce((acc, s) => acc + (s.quizResult?.score || 0), 0) /
          (completedQuizzes || 1);

        await prisma.$disconnect();

        res.json({
          sessions: sessions.map((session) => ({
            id: session.id,
            type: session.type,
            status: session.status,
            scheduledAt: session.scheduledAt,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            topic: session.topic,
            summary: session.summary,
            clientRating: session.clientRating,
            doctorName: session.doctor
              ? `${session.doctor.firstName} ${session.doctor.lastName}`
              : null,
            quizScore: session.quizResult?.score,
            quizCompleted: !!session.quizResult,
          })),
          certifications: certifications.map((cert) => ({
            id: cert.id,
            title: cert.certification.name,
            description: cert.certification.description,
            status: cert.status,
            progressPercentage: cert.progressPercentage,
            earnedAt: cert.earnedAt,
            isApproved: cert.isApproved,
          })),
          stats: {
            totalSessions: sessions.length,
            completedSessions,
            completedQuizzes,
            averageQuizScore: Math.round(averageQuizScore),
            progressLevel: userProfile?.clientProfile?.progressLevel || 1,
            totalQuizzesCompleted:
              userProfile?.clientProfile?.totalQuizzesCompleted || 0,
            totalSessionsCompleted:
              userProfile?.clientProfile?.totalSessionsCompleted || 0,
          },
        });
      } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Doctor dashboard endpoints
    app.get("/api/doctor/dashboard", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];


        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Get doctor's sessions
        const sessions = await prisma.session.findMany({
          where: { doctorId: decoded.userId },
          include: {
            client: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        // Get upcoming sessions
        const upcomingSessions = sessions.filter(
          (s) =>
            s.status === "scheduled" && new Date(s.scheduledAt) > new Date(),
        );

        // Get doctor profile
        const doctorProfile = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            doctorProfile: true,
          },
        });

        // Calculate stats
        const completedSessions = sessions.filter(
          (s) => s.status === "completed",
        ).length;
        const totalClients = new Set(sessions.map((s) => s.clientId)).size;
        const averageRating =
          sessions
            .filter((s) => s.doctorRating)
            .reduce((acc, s) => acc + (s.doctorRating || 0), 0) /
          (sessions.filter((s) => s.doctorRating).length || 1);

        await prisma.$disconnect();

        res.json({
          sessions: sessions.map((session) => ({
            id: session.id,
            type: session.type,
            status: session.status,
            scheduledAt: session.scheduledAt,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            topic: session.topic,
            summary: session.summary,
            clientName: session.client
              ? `${session.client.firstName} ${session.client.lastName}`
              : "Unknown",
            clientEmail: session.client?.email,
            clientRating: session.clientRating,
            doctorRating: session.doctorRating,
          })),
          upcomingSessions: upcomingSessions.map((session) => ({
            id: session.id,
            scheduledAt: session.scheduledAt,
            topic: session.topic,
            clientName: session.client
              ? `${session.client.firstName} ${session.client.lastName}`
              : "Unknown",
          })),
          stats: {
            totalSessions: sessions.length,
            completedSessions,
            totalClients,
            averageRating: Math.round(averageRating * 10) / 10,
            upcomingSessionsCount: upcomingSessions.length,
          },
          profile: doctorProfile?.doctorProfile,
        });
      } catch (error) {
        console.error("Doctor dashboard error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get doctor sessions
    app.get("/api/doctor/sessions", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];


        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'doctor') {
          return res.status(403).json({ error: "Doctor access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const { status, date } = req.query;

        let whereClause: any = { doctorId: decoded.userId };
        if (status) whereClause.status = status;
        if (date) {
          const queryDate = new Date(date as string);
          const nextDay = new Date(queryDate);
          nextDay.setDate(nextDay.getDate() + 1);
          whereClause.scheduledAt = {
            gte: queryDate,
            lt: nextDay
          };
        }

        const sessions = await prisma.session.findMany({
          where: whereClause,
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                clientProfile: {
                  select: {
                    primaryGoals: true,
                    anxietyTriggers: true,
                    totalSessionsCompleted: true
                  }
                }
              }
            },
            quizResult: true,
            sessionNotes: true
          },
          orderBy: { scheduledAt: 'desc' }
        });

        await prisma.$disconnect();

        res.json({
          sessions: sessions.map(session => ({
            id: session.id,
            type: session.type,
            status: session.status,
            scheduledAt: session.scheduledAt,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            topic: session.topic,
            summary: session.summary,
            notes: session.notes,
            client: session.client,
            quizResult: session.quizResult,
            sessionNotes: session.sessionNotes,
            duration: session.duration,
            quizCompleted: !!session.quizResult,
            quizScore: session.quizResult?.score,
            clientRating: session.clientRating,
            doctorRating: session.doctorRating
          }))
        });
      } catch (error) {
        console.error("Get doctor sessions error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Doctor schedule/availability endpoints
    app.get("/api/doctor/schedule", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'doctor') {
          return res.status(403).json({ error: "Doctor access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const { week } = req.query;

        // Get doctor profile for working hours
        const profile = await prisma.doctorProfile.findUnique({
          where: { userId: decoded.userId }
        });

        if (!profile) {
          await prisma.$disconnect();
          return res.status(404).json({ error: 'Doctor profile not found' });
        }

        // Calculate week range
        const startDate = week ? new Date(week as string) : new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        // Get sessions for the week
        const sessions = await prisma.session.findMany({
          where: {
            doctorId: decoded.userId,
            scheduledAt: {
              gte: startDate,
              lt: endDate
            }
          },
          include: {
            client: {
              select: { firstName: true, lastName: true, avatar: true }
            }
          },
          orderBy: { scheduledAt: 'asc' }
        });

        await prisma.$disconnect();

        res.json({
          workingHours: profile.workingHours,
          sessionDuration: profile.sessionDuration,
          breakBetweenSessions: profile.breakBetweenSessions,
          sessions,
          weekStart: startDate,
          weekEnd: endDate
        });
      } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Update doctor schedule/availability
    app.put("/api/doctor/schedule", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'doctor') {
          return res.status(403).json({ error: "Doctor access required" });
        }

        const { workingHours, sessionDuration, breakBetweenSessions } = req.body;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const updatedProfile = await prisma.doctorProfile.update({
          where: { userId: decoded.userId },
          data: {
            workingHours,
            sessionDuration,
            breakBetweenSessions
          }
        });

        await prisma.$disconnect();

        res.json({
          message: 'Schedule updated successfully',
          profile: updatedProfile
        });
      } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get doctor settings/profile
    app.get("/api/doctor/settings", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'doctor') {
          return res.status(403).json({ error: "Doctor access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            doctorProfile: true
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            doctorProfile: true
          }
        });

        if (!user) {
          await prisma.$disconnect();
          return res.status(404).json({ error: 'User not found' });
        }

        await prisma.$disconnect();

        res.json({ user });
      } catch (error) {
        console.error('Get doctor settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Update doctor settings/profile
    app.put("/api/doctor/settings", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'doctor') {
          return res.status(403).json({ error: "Doctor access required" });
        }

        const {
          firstName,
          lastName,
          phone,
          avatar,
          licenseNumber,
          specializations,
          education,
          experience,
          bio
        } = req.body;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Update user basic info
        const updatedUser = await prisma.user.update({
          where: { id: decoded.userId },
          data: {
            firstName,
            lastName,
            phone,
            avatar
          }
        });

        // Update doctor profile
        const updatedProfile = await prisma.doctorProfile.update({
          where: { userId: decoded.userId },
          data: {
            licenseNumber,
            specializations,
            education,
            experience,
            bio
          }
        });

        await prisma.$disconnect();

        res.json({
          message: 'Settings updated successfully',
          user: {
            ...updatedUser,
            doctorProfile: updatedProfile
          }
        });
      } catch (error) {
        console.error('Update doctor settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Admin endpoints for session management
    app.get("/api/admin/sessions", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const { status, needsAssignment } = req.query;

        let whereClause: any = {};
        if (status) whereClause.status = status;
        if (needsAssignment === 'true') whereClause.doctorId = null;

        const sessions = await prisma.session.findMany({
          where: whereClause,
          include: {
            client: {
              select: { firstName: true, lastName: true, email: true }
            },
            doctor: {
              select: { firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        await prisma.$disconnect();

        res.json({
          sessions: sessions.map(session => ({
            id: session.id,
            type: session.type,
            status: session.status,
            scheduledAt: session.scheduledAt,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            topic: session.topic,
            summary: session.summary,
            clientName: `${session.client.firstName} ${session.client.lastName}`,
            clientEmail: session.client.email,
            doctorName: session.doctor ? `${session.doctor.firstName} ${session.doctor.lastName}` : null,
            doctorEmail: session.doctor?.email,
            needsAssignment: !session.doctorId,
            createdAt: session.createdAt
          }))
        });
      } catch (error) {
        console.error("Admin get sessions error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Assign doctor to session
    app.put("/api/admin/sessions/:sessionId/assign", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const { sessionId } = req.params;
        const { doctorId } = req.body;

        if (!doctorId) {
          return res.status(400).json({ error: "Doctor ID is required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Verify doctor exists and is active
        const doctor = await prisma.user.findUnique({
          where: { id: doctorId, role: 'doctor', isActive: true },
          include: { doctorProfile: true }
        });

        if (!doctor || !doctor.doctorProfile?.isApproved) {
          await prisma.$disconnect();
          return res.status(400).json({ error: "Invalid or inactive doctor" });
        }

        // Update session with doctor assignment
        const updatedSession = await prisma.session.update({
          where: { id: sessionId },
          data: { doctorId },
          include: {
            client: {
              select: { firstName: true, lastName: true, email: true }
            },
            doctor: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        await prisma.$disconnect();

        res.json({
          message: "Doctor assigned successfully",
          session: {
            id: updatedSession.id,
            type: updatedSession.type,
            status: updatedSession.status,
            scheduledAt: updatedSession.scheduledAt,
            topic: updatedSession.topic,
            clientName: `${updatedSession.client.firstName} ${updatedSession.client.lastName}`,
            doctorName: `${updatedSession.doctor!.firstName} ${updatedSession.doctor!.lastName}`,
            needsAssignment: false
          }
        });
      } catch (error) {
        console.error("Assign doctor error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get available doctors for assignment
    app.get("/api/admin/doctors", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const doctors = await prisma.user.findMany({
          where: {
            role: 'doctor'
          },
          include: {
            doctorProfile: true
          }
        });

        await prisma.$disconnect();

        res.json({
          doctors: doctors.map(doctor => ({
            id: doctor.id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            email: doctor.email,
            role: doctor.role,
            status: doctor.isActive ? 'active' : 'deactivated',
            createdAt: doctor.createdAt,
            lastLogin: doctor.updatedAt, // Using updatedAt as proxy for lastLogin
            name: `${doctor.firstName} ${doctor.lastName}`,
            specializations: doctor.doctorProfile?.specializations || [],
            experience: doctor.doctorProfile?.experience || 0,
            workingHours: doctor.doctorProfile?.workingHours || {},
            isApproved: doctor.doctorProfile?.isApproved || false
          }))
        });
      } catch (error) {
        console.error("Get admin doctors error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get all users for admin management
    app.get("/api/admin/users", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const { role, status, search, page = 1, limit = 50 } = req.query;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        let whereClause: any = {};

        if (role) whereClause.role = role;
        if (status) {
          if (status === 'active') whereClause.isActive = true;
          else if (status === 'pending' || status === 'deactivated') whereClause.isActive = false;
        }
        if (search) {
          whereClause.OR = [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
          ];
        }

        const users = await prisma.user.findMany({
          where: whereClause,
          include: {
            clientProfile: true,
            doctorProfile: true,
            adminProfile: true
          },
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit as string),
          skip: (parseInt(page as string) - 1) * parseInt(limit as string)
        });

        await prisma.$disconnect();

        res.json({
          users: users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.isActive ? 'active' : (user.role === 'client' ? 'pending' : 'deactivated'),
            createdAt: user.createdAt,
            lastLogin: user.updatedAt, // Using updatedAt as proxy for lastLogin
            avatar: user.avatar,
            profile: user.role === 'client' ? user.clientProfile : user.role === 'doctor' ? user.doctorProfile : user.adminProfile
          }))
        });
      } catch (error) {
        console.error("Get admin users error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Update user status (activate/deactivate)
    app.put("/api/admin/users/:userId/status", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const { userId } = req.params;
        const { isActive } = req.body;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isActive: Boolean(isActive) }
        });

        await prisma.$disconnect();

        res.json({
          message: "User status updated successfully",
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            status: updatedUser.isActive ? 'active' : 'deactivated',
            isActive: updatedUser.isActive
          }
        });
      } catch (error) {
        console.error("Update user status error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Admin dashboard endpoint
    app.get("/api/admin/dashboard", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Get counts for dashboard stats
        const [
          totalClients,
          totalDoctors,
          activeSessions,
          completedSessions,
          pendingApprovals
        ] = await Promise.all([
          prisma.user.count({ where: { role: 'client' } }),
          prisma.user.count({ where: { role: 'doctor' } }),
          prisma.session.count({ where: { status: 'scheduled' } }),
          prisma.session.count({ where: { status: 'completed' } }),
          prisma.user.count({ where: { isActive: false, role: { in: ['client', 'doctor'] } } })
        ]);

        await prisma.$disconnect();

        res.json({
          stats: {
            totalClients,
            totalDoctors,
            activeSessions,
            pendingPayments: 0, // Placeholder
            completedSessions,
            pendingApprovals,
            revenue: 0, // Placeholder
            certificationsIssued: 0 // Placeholder
          }
        });
      } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Admin API Keys endpoints
    app.get("/api/admin/api-keys", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const apiKeys = await prisma.APIKey.findMany({
          orderBy: { createdAt: 'desc' }
        });

        // Hide actual key values, show only preview
        const keysWithPreview = apiKeys.map(key => ({
          ...key,
          keyPreview: `${key.keyHash.substring(0, 8)}...${key.keyHash.substring(key.keyHash.length - 8)}`,
          keyHash: undefined
        }));

        await prisma.$disconnect();

        res.json({ apiKeys: keysWithPreview });
      } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post("/api/admin/api-keys", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");
        const crypto = await import("crypto");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const { name, permissions, expiresAt } = req.body;
        const adminId = decoded.userId;

        if (!name) {
          return res.status(400).json({ error: 'API key name is required' });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Generate random API key
        const apiKey = `abby_${crypto.default.randomBytes(32).toString('hex')}`;
        const keyHash = crypto.default.createHash('sha256').update(apiKey).digest('hex');

        const createdKey = await prisma.APIKey.create({
          data: {
            name,
            keyHash,
            permissions: permissions || [],
            createdBy: adminId,
            expiresAt: expiresAt ? new Date(expiresAt) : null
          }
        });

        await prisma.$disconnect();

        res.status(201).json({
          message: 'API key created successfully',
          apiKey: apiKey, // Only shown once
          keyInfo: {
            ...createdKey,
            keyPreview: `${keyHash.substring(0, 8)}...${keyHash.substring(keyHash.length - 8)}`,
            keyHash: undefined
          }
        });
      } catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.put("/api/admin/api-keys/:keyId", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const { keyId } = req.params;
        const { name, permissions, isActive } = req.body;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        const updatedKey = await prisma.APIKey.update({
          where: { id: keyId },
          data: {
            name,
            permissions,
            isActive
          }
        });

        await prisma.$disconnect();

        res.json({
          message: 'API key updated successfully',
          keyInfo: {
            ...updatedKey,
            keyPreview: `${updatedKey.keyHash.substring(0, 8)}...${updatedKey.keyHash.substring(updatedKey.keyHash.length - 8)}`,
            keyHash: undefined
          }
        });
      } catch (error) {
        console.error('Update API key error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.delete("/api/admin/api-keys/:keyId", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: "Admin access required" });
        }

        const { keyId } = req.params;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        await prisma.APIKey.delete({
          where: { id: keyId }
        });

        await prisma.$disconnect();

        res.json({ message: 'API key deleted successfully' });
      } catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start AI session endpoint
    app.post("/api/client/sessions/ai", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        if (decoded.role !== 'client') {
          return res.status(403).json({ error: "Only clients can start AI sessions" });
        }

        const { topic } = req.body;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Create AI session in database
        const session = await prisma.session.create({
          data: {
            clientId: decoded.userId,
            type: 'ai',
            status: 'in_progress',
            scheduledAt: new Date(),
            startedAt: new Date(),
            topic: topic || 'AI Therapy Session'
          }
        });

        await prisma.$disconnect();

        res.json({
          message: "AI session started successfully",
          session: {
            id: session.id,
            type: session.type,
            status: session.status,
            startedAt: session.startedAt,
            topic: session.topic
          }
        });
      } catch (error) {
        console.error("Start AI session error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // AI Chat message endpoint - uses configured API key from admin settings
    app.post("/api/client/sessions/:sessionId/messages", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const { sessionId } = req.params;
        const { content, type = 'text' } = req.body;

        if (!content) {
          return res.status(400).json({ error: "Message content is required" });
        }

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Verify session belongs to user
        const session = await prisma.session.findFirst({
          where: {
            id: sessionId,
            clientId: decoded.userId,
            type: 'ai'
          }
        });

        if (!session) {
          await prisma.$disconnect();
          return res.status(404).json({ error: "Session not found" });
        }

        // Use Cohere API for real AI responses
        let aiResponse;

        try {
          // Make request to Cohere API
          const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer fxouNP06AFCibQqrbYNxW1pGoq2pjhQRETLjTMFA`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'command-r-03-2024', // Using the latest available model (command-a-03-2025 may not be available yet)
              message: content,
              chat_history: [], // You could maintain chat history here for context
              temperature: 0.7,
              max_tokens: 300,
              preamble: `You are Abby, a compassionate AI therapy companion. You provide supportive, empathetic responses to help clients with their mental health journey.

Key guidelines:
- Be warm, understanding, and non-judgmental
- Ask thoughtful follow-up questions to encourage reflection
- Provide practical coping strategies when appropriate
- Validate the client's feelings and experiences
- Keep responses conversational and supportive
- Focus on the client's wellbeing and emotional state
- If someone expresses thoughts of self-harm, encourage them to seek immediate professional help

Remember: You are a supportive companion, not a replacement for professional therapy. Always encourage professional help for serious mental health concerns.`
            })
          });

          if (cohereResponse.ok) {
            const cohereData = await cohereResponse.json();
            aiResponse = cohereData.text || cohereData.message || "I'm here to listen and support you. Can you tell me more about how you're feeling?";
          } else {
            console.error('Cohere API error:', cohereResponse.status, await cohereResponse.text());
            // Fallback to supportive response
            aiResponse = "I'm here to listen and support you. Can you tell me more about how you're feeling right now?";
          }
        } catch (error) {
          console.error('Error calling Cohere API:', error);
          // Fallback response
          aiResponse = "I'm here to support you. Sometimes I might have technical difficulties, but I'm always here to listen. How are you feeling today?";
        }

        await prisma.$disconnect();

        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        res.json({
          message: "Message sent successfully",
          response: {
            content: aiResponse,
            type: 'text',
            timestamp: new Date().toISOString(),
            sender: 'ai'
          }
        });
      } catch (error) {
        console.error("AI message error:", error);
        res.status(500).json({
          error: "Internal server error",
          response: {
            content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
            type: 'text',
            timestamp: new Date().toISOString(),
            sender: 'ai'
          }
        });
      }
    });

    // Complete session endpoint (for quiz results or skipped sessions)
    app.post("/api/client/sessions/:sessionId/complete", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const { sessionId } = req.params;
        const { quizAnswers, quizScore, rating, feedback, skipped = false } = req.body;

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Verify session belongs to user
        const session = await prisma.session.findFirst({
          where: {
            id: sessionId,
            clientId: decoded.userId
          }
        });

        if (!session) {
          await prisma.$disconnect();
          return res.status(404).json({ error: "Session not found" });
        }

        let sessionUpdateData: any = {
          endedAt: new Date(),
          clientFeedback: feedback
        };

        if (skipped) {
          // If skipped, mark as cancelled/skipped (won't count towards progress)
          sessionUpdateData.status = 'cancelled';
          sessionUpdateData.summary = 'Session ended early - quiz skipped';
        } else {
          // If completed with quiz, mark as completed and will count towards progress
          sessionUpdateData.status = 'completed';
          sessionUpdateData.clientRating = rating;
          sessionUpdateData.summary = `AI therapy session completed with ${quizScore || 0}% quiz score`;
        }

        // Update session
        const updatedSession = await prisma.session.update({
          where: { id: sessionId },
          data: sessionUpdateData
        });

        // Create quiz result if quiz was taken
        if (!skipped && quizAnswers && quizScore !== undefined) {
          await prisma.quizResult.create({
            data: {
              sessionId: sessionId,
              userId: decoded.userId,
              answers: quizAnswers,
              score: quizScore,
              completedAt: new Date()
            }
          });

          // Update client profile progress if quiz passed (70% or higher)
          if (quizScore >= 70) {
            const clientProfile = await prisma.clientProfile.findUnique({
              where: { userId: decoded.userId }
            });

            if (clientProfile) {
              const newSessionsCompleted = (clientProfile.totalSessionsCompleted || 0) + 1;
              const newQuizzesCompleted = (clientProfile.totalQuizzesCompleted || 0) + 1;

              await prisma.clientProfile.update({
                where: { userId: decoded.userId },
                data: {
                  totalSessionsCompleted: newSessionsCompleted,
                  totalQuizzesCompleted: newQuizzesCompleted,
                  progressLevel: Math.min(5, Math.floor(newSessionsCompleted / 2) + 1)
                }
              });

              // Check for certification eligibility
              await checkAndAwardCertifications(prisma, decoded.userId, newSessionsCompleted, newQuizzesCompleted, quizScore);
            }
          }
        }

        await prisma.$disconnect();

        res.json({
          message: skipped ? "Session ended (skipped)" : "Session completed successfully",
          session: {
            id: updatedSession.id,
            status: updatedSession.status,
            endedAt: updatedSession.endedAt,
            summary: updatedSession.summary
          }
        });
      } catch (error) {
        console.error("Complete session error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get client progress data
    app.get("/api/client/progress", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Get user sessions and quiz results
        const sessions = await prisma.session.findMany({
          where: {
            clientId: decoded.userId,
            status: 'completed'
          },
          include: {
            quizResult: true
          },
          orderBy: { completedAt: 'desc' }
        });

        // Get client profile
        const clientProfile = await prisma.clientProfile.findUnique({
          where: { userId: decoded.userId }
        });

        // Calculate progress statistics
        const totalSessions = sessions.length;
        const completedQuizzes = sessions.filter(s => s.quizResult).length;
        const averageQuizScore = completedQuizzes > 0
          ? sessions.reduce((acc, s) => acc + (s.quizResult?.score || 0), 0) / completedQuizzes
          : 0;

        // Build session history for charts
        const sessionHistory = sessions.map((session, index) => ({
          sessionNumber: index + 1,
          date: session.completedAt,
          score: session.quizResult?.score || 0,
          duration: session.endedAt && session.startedAt
            ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60))
            : 0,
          type: session.type
        }));

        await prisma.$disconnect();

        res.json({
          progress: {
            totalSessions,
            completedSessions: totalSessions,
            completedQuizzes,
            averageQuizScore: Math.round(averageQuizScore),
            progressLevel: clientProfile?.progressLevel || 1,
            sessionHistory,
            totalSessionsCompleted: clientProfile?.totalSessionsCompleted || 0,
            totalQuizzesCompleted: clientProfile?.totalQuizzesCompleted || 0
          }
        });
      } catch (error) {
        console.error("Get progress error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Helper function to check and award certifications
    async function checkAndAwardCertifications(prisma: any, userId: string, sessionsCompleted: number, quizzesCompleted: number, averageScore: number) {
      try {
        // Get all available certifications
        let certifications = await prisma.certification.findMany();

        // Create default certifications if they don't exist
        if (certifications.length === 0) {
          await prisma.certification.createMany({
            data: [
              {
                name: 'Anxiety Management Basics',
                description: 'Complete fundamental anxiety management techniques and demonstrate understanding through practical application.',
                requirements: ['Complete 2 therapy sessions', 'Pass 2 quizzes with 80% score'],
                requiredSessions: 2,
                requiredQuizzes: 2,
                minimumScore: 80
              },
              {
                name: 'Emotional Intelligence Explorer',
                description: 'Develop emotional awareness and regulation skills through guided therapy sessions.',
                requirements: ['Complete 3 therapy sessions', 'Pass 3 quizzes with 85% score'],
                requiredSessions: 3,
                requiredQuizzes: 3,
                minimumScore: 85
              },
              {
                name: 'Mindfulness Practitioner',
                description: 'Master mindfulness techniques and meditation practices for mental well-being.',
                requirements: ['Complete 4 therapy sessions', 'Pass 4 quizzes with 80% score'],
                requiredSessions: 4,
                requiredQuizzes: 4,
                minimumScore: 80
              }
            ]
          });

          // Refetch certifications after creation
          certifications = await prisma.certification.findMany();
        }

        // Check each certification for eligibility
        for (const cert of certifications) {
          // Check if user already has this certification
          const existing = await prisma.userCertification.findFirst({
            where: {
              userId: userId,
              certificationId: cert.id
            }
          });

          if (!existing) {
            // Check if user meets requirements
            const meetsSessionRequirement = sessionsCompleted >= cert.requiredSessions;
            const meetsQuizRequirement = quizzesCompleted >= cert.requiredQuizzes;
            const meetsScoreRequirement = averageScore >= cert.minimumScore;

            if (meetsSessionRequirement && meetsQuizRequirement && meetsScoreRequirement) {
              // Award certification
              await prisma.userCertification.create({
                data: {
                  userId: userId,
                  certificationId: cert.id,
                  status: 'completed',
                  progressPercentage: 100,
                  earnedAt: new Date(),
                  isApproved: true, // Auto-approve for now
                  approvedAt: new Date()
                }
              });

              console.log(`Awarded certification: ${cert.name} to user ${userId}`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking certifications:', error);
      }
    }

    // Get client certifications endpoint
    app.get("/api/client/certifications", async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
          return res.status(401).json({ error: "Access token required" });
        }

        const jwt = await import("jsonwebtoken");
        const { PrismaClient } = await import("@prisma/client");

        const JWT_SECRET =
          process.env.JWT_SECRET ||
          "abby-ai-therapy-platform-secret-key-production-2024";
        const decoded = jwt.default.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };

        const prisma = new PrismaClient({
          datasources: {
            db: {
              url:
                process.env.DATABASE_URL ||
                "postgresql://neondb_owner:npg_cSMJ5LefDyK3@ep-muddy-star-afitk52l-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
            },
          },
        });

        // Get user's certifications
        const userCertifications = await prisma.userCertification.findMany({
          where: { userId: decoded.userId },
          include: {
            certification: true,
          },
        });

        // Get all available certifications to show progress
        const allCertifications = await prisma.certification.findMany();

        // Get user progress for calculating certification eligibility
        const userProfile = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            clientProfile: true,
          },
        });

        const sessionsCompleted = userProfile?.clientProfile?.totalSessionsCompleted || 0;
        const quizzesCompleted = userProfile?.clientProfile?.totalQuizzesCompleted || 0;

        // Get average quiz score
        const sessions = await prisma.session.findMany({
          where: {
            clientId: decoded.userId,
            status: 'completed'
          },
          include: {
            quizResult: true
          }
        });

        const completedQuizResults = sessions.filter(s => s.quizResult);
        const averageScore = completedQuizResults.length > 0
          ? completedQuizResults.reduce((acc, s) => acc + (s.quizResult?.score || 0), 0) / completedQuizResults.length
          : 0;

        // Build response data
        const certifications = allCertifications.map(cert => {
          const userCert = userCertifications.find(uc => uc.certificationId === cert.id);

          if (userCert) {
            // User has this certification
            return {
              id: userCert.id,
              title: cert.name,
              description: cert.description,
              status: userCert.status,
              progressPercentage: userCert.progressPercentage,
              earnedAt: userCert.earnedAt,
              isUnlocked: userCert.status === 'completed',
              isApproved: userCert.isApproved,
              certification: cert
            };
          } else {
            // User doesn't have this certification yet - calculate progress
            const sessionProgress = Math.min(100, (sessionsCompleted / cert.requiredSessions) * 100);
            const quizProgress = Math.min(100, (quizzesCompleted / cert.requiredQuizzes) * 100);
            const scoreProgress = Math.min(100, (averageScore / cert.minimumScore) * 100);
            const overallProgress = Math.min(100, (sessionProgress + quizProgress + scoreProgress) / 3);

            return {
              id: `pending_${cert.id}`,
              title: cert.name,
              description: cert.description,
              status: 'pending',
              progressPercentage: Math.round(overallProgress),
              earnedAt: null,
              isUnlocked: false,
              isApproved: false,
              certification: cert,
              requirements: cert.requirements,
              currentProgress: {
                sessions: sessionsCompleted,
                requiredSessions: cert.requiredSessions,
                quizzes: quizzesCompleted,
                requiredQuizzes: cert.requiredQuizzes,
                averageScore: Math.round(averageScore),
                minimumScore: cert.minimumScore
              }
            };
          }
        });

        await prisma.$disconnect();

        res.json({ certifications });
      } catch (error) {
        console.error("Get certifications error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Add the express app as middleware to Vite dev server
    server.middlewares.use(app);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "./server"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), databaseServerPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));
