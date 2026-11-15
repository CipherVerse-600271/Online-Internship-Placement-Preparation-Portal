"use strict";

// One-time local development helper. This script is not an HTTP endpoint.
require("dotenv").config({ quiet: true });

const readline = require("readline");
const mongoose = require("mongoose");
const User = require("../src/models/User");

const REQUIRED_DATABASE = "internship_portal_sprint2_test";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

class SafeSetupError extends Error {}

function validateEnvironment() {
  if (process.env.NODE_ENV !== "development") {
    throw new SafeSetupError("Refusing to run: NODE_ENV must be exactly development.");
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new SafeSetupError("Refusing to run: MONGODB_URI is not configured.");
  }
  if (uri.startsWith("mongodb+srv://")) {
    throw new SafeSetupError("Refusing to run: MongoDB SRV connections are not allowed.");
  }

  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new SafeSetupError("Refusing to run: MONGODB_URI is not a valid MongoDB URI.");
  }

  if (parsed.protocol !== "mongodb:") {
    throw new SafeSetupError("Refusing to run: only a local mongodb:// connection is allowed.");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!LOCAL_HOSTS.has(hostname) || parsed.host.includes(",")) {
    throw new SafeSetupError("Refusing to run: MongoDB must use a single local host.");
  }

  let databaseName;
  try {
    databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  } catch {
    throw new SafeSetupError("Refusing to run: the MongoDB database name is invalid.");
  }

  if (databaseName !== REQUIRED_DATABASE) {
    throw new SafeSetupError(
      `Refusing to run: the database must be exactly ${REQUIRED_DATABASE}.`
    );
  }

  return uri;
}

function askLine(prompt) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    terminal.question(prompt, (answer) => {
      terminal.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return Promise.reject(
      new SafeSetupError("Refusing to read a password without an interactive terminal.")
    );
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const stdin = process.stdin;
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          reject(new SafeSetupError("Admin setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u0008" || character === "\u007f") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  // Validate the configured target before asking for credentials or connecting.
  const uri = validateEnvironment();

  const fullName = await askLine("Admin name: ");
  const email = (await askLine("Admin email: ")).toLowerCase();
  if (!fullName) throw new SafeSetupError("Admin name is required.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SafeSetupError("Enter a valid admin email address.");
  }

  const password = await askHidden("Admin password (input hidden): ");
  const confirmation = await askHidden("Confirm password (input hidden): ");
  if (password.length < 8) {
    throw new SafeSetupError("Password must contain at least 8 characters.");
  }
  if (password !== confirmation) {
    throw new SafeSetupError("Passwords do not match.");
  }

  try {
    await mongoose.connect(uri);

    // Verify the database selected by the live connection as well as the URI.
    if (mongoose.connection.name !== REQUIRED_DATABASE) {
      throw new SafeSetupError(
        `Refusing to run: connected database is not ${REQUIRED_DATABASE}.`
      );
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      throw new SafeSetupError("That email already belongs to an account; no account was changed.");
    }

    // save() invokes the existing User model's bcrypt password-hashing hook.
    await new User({
      fullName,
      email,
      password,
      role: "admin",
      isEmailVerified: true,
    }).save();

    console.log("Development admin created successfully.");
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  if (error instanceof SafeSetupError) {
    console.error(error.message);
  } else {
    // Do not print driver errors, which could contain connection details.
    console.error("Admin provisioning failed. No credentials or connection details were displayed.");
  }
  process.exitCode = 1;
});
