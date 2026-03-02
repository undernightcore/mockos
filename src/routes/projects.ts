import { Router } from "express";
import {
  createProject,
  editProject,
  leaveProject,
  listProjects,
} from "../controllers/projects";

const router = Router();

router.get("/", listProjects);
router.post("/", createProject);
router.put("/:projectId", editProject);
router.delete("/:projectId", leaveProject);

export const projectsRouter = router;
