import { Router } from "express";
import multer from "multer";
import { createResponse } from "../controllers/responses";

const router = Router({ mergeParams: true });

router.post(
  "/",
  multer({ limits: { fileSize: 1e7 } }).single("file"),
  createResponse
);

export const responsesRouter = router;
