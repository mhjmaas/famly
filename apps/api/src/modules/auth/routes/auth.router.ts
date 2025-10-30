import { toNodeHandler } from "better-auth/node";
import { Router } from "express";
import { getAuth } from "../better-auth";
import { createLoginRoute } from "./login.route";
import { createMeRoute } from "./me.route";
import { createRegisterRoute } from "./register.route";

export function createAuthRouter(): Router {
  const router = Router();

  // Custom routes (override Better Auth defaults for better DX)
  router.use(createRegisterRoute());
  router.use(createLoginRoute());
  router.use(createMeRoute());
  // Note: Password reset routes are handled by Better Auth's native handler below
  // to ensure the sendResetPassword callback is properly triggered

  // Mount Better Auth handler for all other endpoints:
  // - GET /token - Get new JWT access token
  // - GET /jwks - Get public keys for JWT verification
  // - POST /sign-out - Sign out and invalidate session
  // - GET /get-session - Get current session
  // And many more: https://www.better-auth.com/docs/concepts/api
  router.all("*", toNodeHandler(getAuth()));

  return router;
}
