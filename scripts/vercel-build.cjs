#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🏗️  Starting Vercel build process...");

try {
  // Install dependencies
  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });

  // Generate Prisma client
  console.log("🔄 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });

  // Build client
  console.log("⚛️  Building client application...");
  execSync("npm run build:client", { stdio: "inherit" });

  // Copy API files to ensure they're available for Vercel functions
  console.log("🔌 Preparing API routes...");

  // Ensure api directory exists with all required files
  const apiDir = path.join(process.cwd(), "api");
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Create a simple health check endpoint
  const healthEndpoint = `
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless',
    version: '1.0.0'
  });
}
`;

  fs.writeFileSync(path.join(apiDir, "health.ts"), healthEndpoint);

  // Copy package.json to root level for Vercel
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  // Ensure all necessary dependencies are included
  const requiredDeps = [
    "@prisma/client",
    "bcryptjs",
    "express",
    "cors",
    "jsonwebtoken",
    "dotenv",
    "zod",
  ];

  requiredDeps.forEach((dep) => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      console.warn(`⚠️  Warning: ${dep} not found in dependencies`);
    }
  });

  console.log("✅ Vercel build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
