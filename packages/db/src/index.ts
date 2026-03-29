import { env } from "@vi-notes/env/server";
import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

export async function connectDB() {
  if (client) return client;
  
  await mongoose.connect(env.DATABASE_URL).catch((error) => {
    console.log("Error connecting to database:", error);
  });
  
  client = mongoose.connection.db;
  return client;
}

export { client };
