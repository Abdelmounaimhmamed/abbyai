import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import clientRoutes from "./routes/client";
import doctorRoutes from "./routes/doctor";
import adminRoutes from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler for API routes only
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    const { prisma } = await import("./lib/prisma");
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Client endpoints: http://localhost:${PORT}/api/client`);
  console.log(`👨‍⚕️ Doctor endpoints: http://localhost:${PORT}/api/doctor`);
  console.log(`👑 Admin endpoints: http://localhost:${PORT}/api/admin`);
});

export default app;

// Export createServer function for vite config compatibility
export const createServer = () => app;
