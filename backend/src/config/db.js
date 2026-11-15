const mongoose = require("mongoose");

const REQUIRED_LOCAL_DATABASE = "internship_portal_sprint2_test";
const LOCAL_MONGODB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const validateNonProductionDatabase = uri => {
  if (process.env.NODE_ENV === "production") return;

  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("Refusing non-production startup: MongoDB URI is invalid.");
  }

  let databaseName;
  try {
    databaseName = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new Error("Refusing non-production startup: MongoDB database name is invalid.");
  }

  const hostname = parsed.hostname.replaceAll("[", "").replaceAll("]", "").toLowerCase();
  if (
    parsed.protocol !== "mongodb:" ||
    !LOCAL_MONGODB_HOSTS.has(hostname) ||
    parsed.host.includes(",") ||
    databaseName !== REQUIRED_LOCAL_DATABASE
  ) {
    throw new Error(
      `Refusing non-production startup: use a local MongoDB host and exactly ${REQUIRED_LOCAL_DATABASE}.`
    );
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured in the environment");
    }

    validateNonProductionDatabase(process.env.MONGODB_URI);

    const options = process.env.NODE_ENV === "production" ? {} : { autoIndex: true };
    await mongoose.connect(process.env.MONGODB_URI, options);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed; connection details were not displayed.");
    process.exit(1);
  }
};

module.exports = connectDB;
