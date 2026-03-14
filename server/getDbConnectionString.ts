let mongod;

export async function getDbConnectionString() {
  if (process.env.DB_CONNECTION_STRING) {
    return process.env.DB_CONNECTION_STRING;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DB_CONNECTION_STRING environment variable is required in production. " +
        "Set it to a valid MongoDB connection string."
    );
  }

  console.log("No connection string found, initializing in-memory DB");
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  mongod = await MongoMemoryServer.create();
  return await mongod.getUri();
}
