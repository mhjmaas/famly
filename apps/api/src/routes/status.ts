import { DeploymentConfigRepository } from "@modules/deployment-config/repositories/deployment-config.repository";
import { DeploymentConfigService } from "@modules/deployment-config/services/deployment-config.service";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";

export const createStatusRouter = (): Router => {
  const router = Router();

  /**
   * @swagger
   * /v1/status:
   *   get:
   *     tags: [Status]
   *     summary: Deployment status endpoint
   *     description: Returns deployment mode and onboarding status (public endpoint)
   *     security: []  # Override global security - no authentication required
   *     responses:
   *       200:
   *         description: Deployment status information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deploymentMode:
   *                   type: string
   *                   enum: [saas, standalone]
   *                 onboardingComplete:
   *                   type: boolean
   */
  router.get(
    "/status",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const repository = new DeploymentConfigRepository();
        const service = new DeploymentConfigService(repository);

        const status = await service.getStatus();

        res.status(200).json(status);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
