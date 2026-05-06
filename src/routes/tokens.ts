import { Router } from "express";
import { createToken, deleteToken, listTokens } from "../controllers/tokens";

const router = Router({ mergeParams: true });

router.get("/tokens", listTokens);
router.post("/tokens", createToken);
router.delete("/tokens/:tokenId", deleteToken);

export const tokensRouter = router;
