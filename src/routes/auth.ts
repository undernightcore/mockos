import { Router } from "express";
import {
  loginUser,
  loginWithGoogle,
  registerUser,
  requestLoginWithGoogle,
  requestResetUser,
  requestVerifyUser,
  resetUser,
  verifyUser,
} from "../controllers/auth";

const router = Router();

router.post("/register", registerUser);
router.post("/send-verify", requestVerifyUser);
router.post("/verify", verifyUser);

router.post("/login", loginUser);
router.post("/send-reset", requestResetUser);
router.post("/reset", resetUser);

router.get("/glogin", requestLoginWithGoogle);
router.post("/glogin", loginWithGoogle);

export const authRouter = router;
