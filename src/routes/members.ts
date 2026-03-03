import { Router } from "express";
import {
  deleteMember,
  editMember,
  getMemberList,
  inviteMember,
} from "../controllers/members";

const router = Router({ mergeParams: true });

router.post("/", inviteMember);
router.get("/", getMemberList);
router.delete("/:memberId", deleteMember);
router.put("/:memberId", editMember);

export const membersRouter = router;
