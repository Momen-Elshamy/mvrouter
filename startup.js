#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

console.log("🚀 Starting Hive Router application...");

async function checkDatabaseConnection() {
   console.log("⏳ Checking database connection...");

   try {
      // Import the database connection module
      const Connection = require("./src/Database/Connection").default;
      await Connection.getInstance().connect();
      console.log("✅ Database connection successful");
      return true;
   } catch (error) {
      console.log("❌ Database connection failed:", error.message);
      return false;
   }
}

async function waitForDatabase() {
   console.log("⏳ Waiting for database to be ready...");
   const maxAttempts = 30;
   let attempt = 1;

   while (attempt <= maxAttempts) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Checking database connection...`);

      if (await checkDatabaseConnection()) {
         console.log("✅ Database is ready!");
         return true;
      } else {
         if (attempt === maxAttempts) {
            console.log("❌ Failed to connect to database after", maxAttempts, "attempts");
            console.log("⚠️ Starting application anyway, but seeding may fail...");
            return false;
         }

         console.log("⏳ Database not ready yet, waiting 2 seconds...");
         await new Promise((resolve) => setTimeout(resolve, 2000));
         attempt++;
      }
   }
}

async function runSeeder() {
   console.log("🌱 Running database seeder...");

   try {
      const { stdout, stderr } = await execAsync("npx tsx src/Database/seeders/index.ts");
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr);
      console.log("✅ Database seeding completed successfully");
      return true;
   } catch (error) {
      console.log("⚠️ Database seeding failed, but continuing with application startup...");
      console.log("Error:", error.message);
      return false;
   }
}

async function startApplication() {
   try {
      // Wait for database
      await waitForDatabase();

      // Run seeder
      await runSeeder();

      // Start the Next.js application
      console.log("🚀 Starting Next.js application...");

      const child = spawn("node", ["server.js"], {
         stdio: "inherit",
         cwd: process.cwd(),
      });

      child.on("error", (error) => {
         console.error("❌ Failed to start application:", error);
         process.exit(1);
      });

      child.on("exit", (code) => {
         console.log("Application exited with code:", code);
         process.exit(code);
      });
   } catch (error) {
      console.error("❌ Startup failed:", error);
      process.exit(1);
   }
}

// Start the application
startApplication();
