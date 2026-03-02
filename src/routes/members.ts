import { Router } from "express";
import { inviteMember } from "../controllers/members";

const router = Router({ mergeParams: true });

router.post("/members", inviteMember);

export const membersRouter = router;
