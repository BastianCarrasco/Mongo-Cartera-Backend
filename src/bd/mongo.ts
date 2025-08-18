import { MongoClient, Db } from "mongodb";
import "dotenv/config"; // Importa dotenv para cargar variables de entorno

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"; // Fallback a localhost
const DB_NAME = process.env.DB_NAME || "CARTERA"; // Fallback a CARTERA

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo() {
  if (db && client && client.options.serverApi !== undefined) {
    console.log("Already connected to MongoDB.");
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Successfully connected to MongoDB database: ${DB_NAME}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectToMongo first.");
  }
  return db;
}
