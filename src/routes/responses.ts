import { Router } from "express";
import multer from "multer";
import {
  createResponse,
  editResponse,
  getResponses,
  getResponsesRealtime,
} from "../controllers/responses";

const router = Router({ mergeParams: true });

router.get("/", getResponses);
router.get("/realtime", getResponsesRealtime);

router.post(
  "/",
  multer({ limits: { fileSize: 1e7 } }).single("body"),
  createResponse
);

router.put(
  "/:responseId",
  multer({ limits: { fileSize: 1e7 } }).single("body"),
  editResponse
);

export const responsesRouter = router;
