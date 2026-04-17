import { Router } from "express";
import multer from "multer";
import { createResponse, getResponses } from "../controllers/responses";

const router = Router({ mergeParams: true });

router.get("/", getResponses);
router.post(
  "/",
  multer({ limits: { fileSize: 1e7 } }).single("body"),
  createResponse
);

export const responsesRouter = router;
