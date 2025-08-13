#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting application startup process...");

// Function to wait for database connection
async function waitForDatabase() {
   console.log("⏳ Waiting for database connection...");
   const maxAttempts = 30;

   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Checking database connection...`);

      try {
         // Try to connect to database
         const Connection = require("../src/Database/Connection").default;
         await Connection.getInstance().connect();
         console.log("✅ Database connection established");
         return true;
      } catch (error) {
         console.log(`❌ Database connection failed: ${error.message}`);

         if (attempt < maxAttempts) {
            console.log("Retrying in 5 seconds...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
         }
      }
   }

   console.log("💥 Failed to connect to database after maximum attempts");
   return false;
}

// Function to run database seeder
async function runSeeder() {
   console.log("🌱 Running database seeder...");

   return new Promise((resolve) => {
      const seeder = spawn("npm", ["run", "seed"], {
         stdio: "inherit",
         cwd: process.cwd(),
      });

      seeder.on("close", (code) => {
         if (code === 0) {
            console.log("✅ Database seeding completed successfully");
            resolve(true);
         } else {
            console.log("❌ Database seeding failed");
            resolve(false);
         }
      });

      seeder.on("error", (error) => {
         console.error("❌ Seeder error:", error);
         resolve(false);
      });
   });
}

// Function to start the application
function startApplication() {
   console.log("🚀 Starting application...");

   const isProduction = process.env.NODE_ENV === "production";
   const command = isProduction ? "node" : "npm";
   const args = isProduction ? ["server.js"] : ["run", "start"];

   const app = spawn(command, args, {
      stdio: "inherit",
      cwd: process.cwd(),
   });

   app.on("close", (code) => {
      console.log(`Application exited with code ${code}`);
      process.exit(code);
   });

   app.on("error", (error) => {
      console.error("Application error:", error);
      process.exit(1);
   });
}

// Main startup sequence
async function main() {
   try {
      // Wait for database to be ready
      if (!(await waitForDatabase())) {
         console.log("💥 Cannot proceed without database connection");
         process.exit(1);
      }

      // Run seeder
      if (!(await runSeeder())) {
         console.log("💥 Cannot proceed without database seeding");
         process.exit(1);
      }

      // Start the application
      startApplication();
   } catch (error) {
      console.error("💥 Startup failed:", error);
      process.exit(1);
   }
}

// Run main function
main();
