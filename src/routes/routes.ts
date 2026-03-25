import { Router } from "express";
import {
  createRoute,
  deleteRoute,
  editRoute,
  getRoutes,
  getRoutesRealtime,
  sortRoute,
} from "../controllers/routes";

const router = Router({ mergeParams: true });

router.get("/", getRoutes);
router.get("/realtime", getRoutesRealtime);
router.post("/", createRoute);
router.put("/:routeId", editRoute);
router.post("/:routeId/sort", sortRoute);
router.delete("/:routeId", deleteRoute);

export const routesRouter = router;
