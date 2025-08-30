import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Basic test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

async function loadRoutes() {
  try {
    console.log("Loading auth routes...");
    const { default: authRoutes } = await import("./routes/auth");
    app.use("/api/auth", authRoutes);
    console.log("✅ Auth routes loaded");

    console.log("Loading client routes...");
    const { default: clientRoutes } = await import("./routes/client");
    app.use("/api/client", clientRoutes);
    console.log("✅ Client routes loaded");

    console.log("Loading doctor routes...");
    const { default: doctorRoutes } = await import("./routes/doctor");
    app.use("/api/doctor", doctorRoutes);
    console.log("✅ Doctor routes loaded");

    console.log("Loading admin routes...");
    const { default: adminRoutes } = await import("./routes/admin");
    app.use("/api/admin", adminRoutes);
    console.log("✅ Admin routes loaded");
  } catch (error) {
    console.error("❌ Error loading routes:", error);
    process.exit(1);
  }
}

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Load routes and start server
loadRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Abby AI Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`👤 Client endpoints: http://localhost:${PORT}/api/client`);
    console.log(`👨‍⚕️ Doctor endpoints: http://localhost:${PORT}/api/doctor`);
    console.log(`👑 Admin endpoints: http://localhost:${PORT}/api/admin`);
    console.log("Ready to accept connections! 🎉");
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try {
    const { prisma } = await import("./lib/prisma");
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
});
