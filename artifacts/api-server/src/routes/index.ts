import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import casesRouter from "./cases.js";
import partiesRouter from "./parties.js";
import hearingsRouter from "./hearings.js";
import feesRouter from "./fees.js";
import noticesRouter from "./notices.js";
import documentsRouter from "./documents.js";
import dashboardRouter from "./dashboard.js";
import activityRouter from "./activity.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(casesRouter);
router.use(partiesRouter);
router.use(hearingsRouter);
router.use(feesRouter);
router.use(noticesRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(activityRouter);
router.use(authRouter);

export default router;
