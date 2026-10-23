import { Router } from "express";
import {
  currentVoterController,
  signInWithGoogleController,
  signOutController,
} from "./controllers/index.js";
import { voteRateLimiter } from "../../shared/security/rate-limiters.js";

const router = Router();

router.post("/google", voteRateLimiter, signInWithGoogleController());
router.get("/me", currentVoterController());
router.post("/logout", signOutController());

export default router;
