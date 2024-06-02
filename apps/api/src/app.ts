import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext, createTrpcRouter, publicProcedure } from "./trpc";
import { z } from "zod";

const port = process.env.PORT || 5000;
const app = express();

export const appRouter = createTrpcRouter({
  getUser: publicProcedure.input(z.string()).query((opts) => {
    opts.input; // string
    return { id: opts.input, name: "React" };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;

app.use(
  "/trpc",
  cors({
    maxAge: 86400,
    credentials: true,
    origin: "*",
  }),
  cookieParser(),
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export async function startServet() {
  const server = app.listen(port, () => {
    console.log(`server started on http://localhost:${port}/trpc`);
  });

  //////////////////////////////////////////////////////////////////////
  const signals = ["SIGTERM", "SIGINT", "SIGHUP", "SIGBREAK"];
  const errorTypes = ["unhandledRejection", "uncaughtException"];

  errorTypes.forEach((type) => {
    process.on(type, async (error) => {
      try {
        console.error(`process exit due to ${type}`);
        console.error(error);
        process.exit(1);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signals.forEach((type) => {
    process.on(type, () => {
      console.log(`${type} signal received.`);
      console.log("Closing http server.");
      server.close((err) => {
        console.log("Http server closed.");
        process.exit(err ? 1 : 0);
      });
    });
  });
}
