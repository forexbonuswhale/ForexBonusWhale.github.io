import { Router, type IRouter } from "express";
import healthRouter from "./health";
import githubSyncRouter from "./github-sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(githubSyncRouter);

export default router;
