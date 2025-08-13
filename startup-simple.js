#!/usr/bin/env node

const { spawn } = require("child_process");

console.log("🚀 Starting Hive Router application...");

async function runSeeder() {
   console.log("🌱 Running database seeder...");

   return new Promise((resolve) => {
      const seeder = spawn("npx", ["tsx", "src/Database/seeders/index.ts"], {
         stdio: "inherit",
         cwd: process.cwd(),
      });

      seeder.on("close", (code) => {
         if (code === 0) {
            console.log("✅ Database seeding completed successfully");
         } else {
            console.log("⚠️ Database seeding failed, but continuing with application startup...");
         }
         resolve();
      });

      seeder.on("error", (error) => {
         console.log("⚠️ Database seeding failed, but continuing with application startup...");
         console.log("Error:", error.message);
         resolve();
      });
   });
}

async function startApp() {
   try {
      // Run seeder first
      await runSeeder();

      // Start the Next.js application
      console.log("🚀 Starting Next.js application...");

      const app = spawn("node", ["server.js"], {
         stdio: "inherit",
         cwd: process.cwd(),
      });

      app.on("error", (error) => {
         console.error("❌ Failed to start application:", error);
         process.exit(1);
      });

      app.on("exit", (code) => {
         console.log("Application exited with code:", code);
         process.exit(code);
      });
   } catch (error) {
      console.error("❌ Startup failed:", error);
      process.exit(1);
   }
}

// Start the application
startApp();
