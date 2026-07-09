import { Router } from "express";
import { useMock } from "../controllers/mock";

const router = Router();

router.all("/:token/*route", useMock);
router.all("/:token", useMock);

export const mockRouter = router;
