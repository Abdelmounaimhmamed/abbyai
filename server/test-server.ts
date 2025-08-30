import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "Server is working" });
});

async function testRoutes() {
  try {
    console.log("Testing auth routes...");
    const { default: authRoutes } = await import("./routes/auth");
    app.use("/api/auth", authRoutes);
    console.log("✅ Auth routes loaded successfully");
  } catch (error) {
    console.error("❌ Error in auth routes:", error.message);
  }

  try {
    console.log("Testing client routes...");
    const { default: clientRoutes } = await import("./routes/client");
    app.use("/api/client", clientRoutes);
    console.log("✅ Client routes loaded successfully");
  } catch (error) {
    console.error("❌ Error in client routes:", error.message);
  }

  try {
    console.log("Testing doctor routes...");
    const { default: doctorRoutes } = await import("./routes/doctor");
    app.use("/api/doctor", doctorRoutes);
    console.log("✅ Doctor routes loaded successfully");
  } catch (error) {
    console.error("❌ Error in doctor routes:", error.message);
  }

  try {
    console.log("Testing admin routes...");
    const { default: adminRoutes } = await import("./routes/admin");
    app.use("/api/admin", adminRoutes);
    console.log("✅ Admin routes loaded successfully");
  } catch (error) {
    console.error("❌ Error in admin routes:", error.message);
  }

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
  });
}

testRoutes();
