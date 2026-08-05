import { Router, type IRouter } from "express";
import healthRouter from "./health";
import casesRouter from "./cases";
import partiesRouter from "./parties";
import hearingsRouter from "./hearings";
import feesRouter from "./fees";
import noticesRouter from "./notices";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";
import authRouter from "./auth";

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
