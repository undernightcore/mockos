import { Router } from "express";
import multer from "multer";
import { importContract } from "../controllers/contracts";

const router = Router({ mergeParams: true });

router.post("/", multer().none(), importContract);

export const contractsRouter = router;
