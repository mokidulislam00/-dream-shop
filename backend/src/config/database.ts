
import mongoose from "mongoose";

// ==========================================
// DATABASE CONNECTION EVENT HANDLERS
// ==========================================

let connectionEventsRegistered = false;

const registerConnectionEvents = (): void => {
  if (connectionEventsRegistered) {
    return;
  }

  mongoose.connection.on("error", (error: Error) => {
    console.error(
      "[DATABASE] MongoDB connection error:",
      error
    );
  });

  mongoose.connection.on("disconnected", () => {
    console.warn(
      "[DATABASE] MongoDB connection disconnected"
    );
  });

  mongoose.connection.on("reconnected", () => {
    console.log(
      "[DATABASE] MongoDB connection re-established"
    );
  });

  connectionEventsRegistered = true;
};

// ==========================================
// CONNECT DATABASE
// ==========================================

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI?.trim();

  if (!mongoURI) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables."
    );
  }

  try {
    registerConnectionEvents();

    // Avoid unnecessary reconnection
    if (mongoose.connection.readyState === 1) {
      console.log(
        "[DATABASE] MongoDB is already connected"
      );

      return;
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(
      "[DATABASE] MongoDB connected successfully"
    );

    console.log(
      `[DATABASE] Host: ${mongoose.connection.host}`
    );
  } catch (error) {
    console.error(
      "[DATABASE] MongoDB connection failed:",
      error
    );

    // Pass error to server.ts
    throw error;
  }
};

export default connectDB;
