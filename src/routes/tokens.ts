import { Router } from "express";
import { createToken, deleteToken, listTokens } from "../controllers/tokens";

const router = Router({ mergeParams: true });

router.get("/", listTokens);
router.post("/", createToken);
router.delete("/:tokenId", deleteToken);

export const tokensRouter = router;
