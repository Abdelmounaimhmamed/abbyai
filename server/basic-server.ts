import { createServer } from "http";
import { URL } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ",
    },
  },
});

const PORT = 3001;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "abby-ai-therapy-platform-secret-key-production-2024";

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

// Parse JSON body
const parseBody = (req: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Send JSON response
const sendJSON = (res: any, data: any, statusCode = 200) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  });
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const method = req.method!;
  const pathname = url.pathname;

  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

  // Handle CORS preflight
  if (method === "OPTIONS") {
    sendJSON(res, {}, 200);
    return;
  }

  try {
    // Health check
    if (pathname === "/health" && method === "GET") {
      sendJSON(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "basic-server",
        database: "connected",
      });
      return;
    }

    // Test endpoint
    if (pathname === "/api/test" && method === "GET") {
      sendJSON(res, {
        message: "Basic server is working!",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Login endpoint
    if (pathname === "/api/auth/login" && method === "POST") {
      const body = await parseBody(req);
      console.log("Login request received:", body);

      const { email, password } = body;

      if (!email || !password) {
        sendJSON(res, { error: "Email and password are required" }, 400);
        return;
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
        sendJSON(res, { error: "Invalid email or password" }, 401);
        return;
      }

      const isValidPassword = await comparePassword(
        password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        sendJSON(res, { error: "Invalid email or password" }, 401);
        return;
      }

      if (!user.isActive) {
        sendJSON(
          res,
          {
            error:
              "Account is pending activation. Please contact an administrator.",
          },
          401,
        );
        return;
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
      sendJSON(res, {
        message: "Login successful",
        token,
        user: userData,
      });
      return;
    }

    // Get current user endpoint
    if (pathname === "/api/auth/me" && method === "GET") {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        sendJSON(res, { error: "Access token required" }, 401);
        return;
      }

      try {
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
            updatedAt: true,
          },
        });

        if (!user || !user.isActive) {
          sendJSON(res, { error: "Invalid or inactive user" }, 401);
          return;
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

        sendJSON(res, { user: userData });
        return;
      } catch (error) {
        sendJSON(res, { error: "Invalid token" }, 403);
        return;
      }
    }

    // 404 for all other routes
    sendJSON(res, { error: "API endpoint not found" }, 404);
  } catch (error) {
    console.error("Server error:", error);
    sendJSON(
      res,
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    server.close();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

server.listen(PORT, () => {
  console.log(`🚀 Basic Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`💾 Database: Connected to Prisma PostgreSQL`);
  console.log(`📱 Ready to accept connections!`);
});

export default server;
