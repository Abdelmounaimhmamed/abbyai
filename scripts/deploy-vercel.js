#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Deploying to Vercel...\n");

// Check if Vercel CLI is installed
try {
  execSync("vercel --version", { stdio: "pipe" });
} catch (error) {
  console.log("📦 Installing Vercel CLI...");
  execSync("npm install -g vercel", { stdio: "inherit" });
}

// Pre-deployment checks
console.log("🔍 Running pre-deployment checks...");

try {
  // Check TypeScript
  console.log("   ✓ Checking TypeScript...");
  execSync("npm run typecheck", { stdio: "pipe" });

  // Test build
  console.log("   ✓ Testing build...");
  execSync("npm run build:client", { stdio: "pipe" });

  console.log("   ✅ All checks passed!\n");
} catch (error) {
  console.error("❌ Pre-deployment checks failed:");
  console.error(error.message);
  console.log("\n🔧 Please fix the issues above before deploying.");
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  "vercel.json",
  "api/auth/[...route].ts",
  "api/client/[...route].ts",
  "api/doctor/[...route].ts",
  "api/admin/[...route].ts",
];

console.log("📋 Checking required Vercel files...");
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
  console.log(`   ✓ ${file}`);
}

// Check environment variables template
if (fs.existsSync("vercel.env.example")) {
  console.log("   ✓ Environment variables template found");
} else {
  console.log("   ⚠️  Environment variables template not found");
}

console.log("\n🌐 Deploying to Vercel...");

try {
  // Deploy to Vercel
  execSync("vercel --prod", { stdio: "inherit" });

  console.log("\n✅ Deployment successful!");
  console.log("\n📋 Post-deployment checklist:");
  console.log("   1. Check that your app loads correctly");
  console.log("   2. Test API endpoints");
  console.log("   3. Verify database connections");
  console.log("   4. Test user authentication");
  console.log("   5. Monitor for any errors");

  console.log("\n🔧 If you encounter issues:");
  console.log("   • Check Vercel function logs: vercel logs");
  console.log("   • Verify environment variables in Vercel dashboard");
  console.log("   • Check database connection string");
  console.log("   • Review DEPLOYMENT_CHECKLIST.md");
} catch (error) {
  console.error("\n❌ Deployment failed:");
  console.error(error.message);
  console.log("\n🔧 Troubleshooting tips:");
  console.log("   • Check your Vercel account permissions");
  console.log("   • Verify all environment variables are set");
  console.log("   • Review the build logs for errors");
  console.log("   • Consult VERCEL_DEPLOYMENT.md for detailed instructions");
  process.exit(1);
}
