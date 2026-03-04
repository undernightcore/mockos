import { Router } from "express";
import { getRoutes, getRoutesRealtime } from "../controllers/routes";

const router = Router({ mergeParams: true });

router.get("/", getRoutes);
router.get("/realtime", getRoutesRealtime);

export const routesRouter = router;
