import { Router } from "express";

export const createHealthRouter = (): Router => {
  const router = Router();

  /**
   * @swagger
   * /v1/health:
   *   get:
   *     tags: [Health]
   *     summary: Health check endpoint
   *     description: Returns API health status (public endpoint)
   *     security: []  # Override global security - no authentication required
   *     responses:
   *       200:
   *         description: API is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "ok"
   */
  router.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  return router;
};
