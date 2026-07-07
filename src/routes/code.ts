import { Router } from "express";
import { editCode, getCode } from "../controllers/code";

const router = Router({ mergeParams: true });

router.get("/", getCode);
router.put("/", editCode);

export const codeRouter = router;
