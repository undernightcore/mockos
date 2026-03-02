import { Router } from "express";
import { listProjects } from "../controllers/projects";

const router = Router();

router.get("/", listProjects);

export const projectsRouter = router;
