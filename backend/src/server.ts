
import "dotenv/config";

import mongoose from "mongoose";
import type { Server } from "http";

import app from "./app";
import connectDB from "./config/database";
import validateEnv from "./config/env";

// ==========================================
// SERVER CONFIGURATION
// ==========================================

const NODE_ENV = process.env.NODE_ENV || "development";

const SHUTDOWN_TIMEOUT = 15000;

// ==========================================
// SERVER STARTUP
// ==========================================

const startServer = async (): Promise<void> => {
  let server: Server | null = null;
  let isShuttingDown = false;

  try {
    // Validate environment variables first
    validateEnv();

    // Validate PORT after environment validation
    const PORT = Number(process.env.PORT || 5000);

    if (
      !Number.isInteger(PORT) ||
      PORT < 1 ||
      PORT > 65535
    ) {
      throw new Error(
        "PORT must be a valid number between 1 and 65535"
      );
    }

    // Connect to MongoDB before starting Express
    await connectDB();

    // Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`
========================================
  MiniMart API Server
========================================
  Status: Running
  Port: ${PORT}
  Environment: ${NODE_ENV}
  URL: http://localhost:${PORT}
  Health: http://localhost:${PORT}/api/health
  Database: Connected
========================================
      `);
    });

    // ==========================================
    // GRACEFUL SHUTDOWN
    // ==========================================

    const shutdown = (
      reason: string,
      error?: Error
    ): void => {
      if (isShuttingDown) {
        return;
      }

      isShuttingDown = true;

      console.log(
        `\n[SERVER] Shutdown initiated: ${reason}`
      );

      if (error) {
        console.error("[SERVER] Error:", error);
      }

      // Force shutdown if connections do not close
      const forceExitTimer = setTimeout(() => {
        console.error(
          "[SERVER] Shutdown timeout reached. Forcing exit."
        );

        process.exit(1);
      }, SHUTDOWN_TIMEOUT);

      forceExitTimer.unref();

      const closeDatabase = async (
        serverError?: Error
      ): Promise<void> => {
        try {
          await mongoose.disconnect();

          console.log(
            "[DATABASE] MongoDB connection closed"
          );

          console.log(
            "[SERVER] Shutdown completed"
          );

          process.exit(
            error || serverError ? 1 : 0
          );
        } catch (dbError) {
          console.error(
            "[DATABASE] Shutdown error:",
            dbError
          );

          process.exit(1);
        }
      };

      if (!server) {
        void closeDatabase();
        return;
      }

      // Stop accepting new HTTP connections
      server.close((serverError) => {
        if (serverError) {
          console.error(
            "[SERVER] HTTP shutdown error:",
            serverError
          );
        }

        void closeDatabase(serverError);
      });

      // Close idle keep-alive connections
      server.closeIdleConnections?.();
    };

    // ==========================================
    // PROCESS SIGNAL HANDLERS
    // ==========================================

    process.once("SIGINT", () => {
      shutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
      shutdown("SIGTERM");
    });

    // ==========================================
    // UNEXPECTED ERROR HANDLING
    // ==========================================

    process.on(
      "unhandledRejection",
      (reason: unknown) => {
        const error =
          reason instanceof Error
            ? reason
            : new Error(String(reason));

        console.error(
          "[SERVER] Unhandled Promise Rejection:",
          error
        );

        shutdown("unhandledRejection", error);
      }
    );

    process.on(
      "uncaughtException",
      (error: Error) => {
        console.error(
          "[SERVER] Uncaught Exception:",
          error
        );

        shutdown("uncaughtException", error);
      }
    );

    // ==========================================
    // HTTP SERVER ERROR HANDLING
    // ==========================================

    server.on(
      "error",
      (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          console.error(
            `[SERVER] Port ${PORT} is already in use.`
          );
        } else {
          console.error(
            "[SERVER] HTTP server error:",
            error
          );
        }

        shutdown("HTTP server error", error);
      }
    );
  } catch (error) {
    console.error(
      "[SERVER] Server startup failed:",
      error
    );

    // Cleanup database connection if startup fails
    try {
      await mongoose.disconnect();

      console.log(
        "[DATABASE] Startup cleanup completed"
      );
    } catch (dbError) {
      console.error(
        "[DATABASE] Startup cleanup failed:",
        dbError
      );
    }

    process.exit(1);
  }
};

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

void startServer();
