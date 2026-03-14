import MongoStore = require("connect-mongo");
import RedisStore from "connect-redis";
import { RequestHandler } from "express";
import Redis from "ioredis";
import expressSession = require("express-session");
import * as moment from "moment";

const isProduction = process.env.NODE_ENV === "production";

export default async function (
  redisConnectionString?: string,
  mongoConnectionString?: string
): Promise<RequestHandler> {
  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is required in production. " +
        "Set it to a strong, random string."
    );
  }

  let store: RedisStore | MongoStore | undefined;

  if (redisConnectionString) {
    const sessionClient = new Redis(redisConnectionString, {
      tls: {
        rejectUnauthorized: false
      }
    });
    sessionClient.on("error", err => {
      console.warn("Session Store Redis Client:", err);
    });
    store = new RedisStore({
      client: sessionClient
    });
  } else if (mongoConnectionString) {
    store = MongoStore.create({
      mongoUrl: mongoConnectionString,
      collectionName: "sessions",
      ttl: moment.duration(4, "weeks").asSeconds()
    });
  }

  const maxAge = moment.duration(4, "weeks").asMilliseconds();

  const session = expressSession({
    store,
    secret: process.env.SESSION_SECRET || "dev-secret-not-for-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction && process.env.HTTPS === "true"
    }
  });

  return session;
}
