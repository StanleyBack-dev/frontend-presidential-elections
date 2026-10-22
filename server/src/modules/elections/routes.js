import { Router } from "express";
import {
  castVoteController,
  getAnalyticsController,
  getCandidatesController,
  getResultsController,
} from "./controllers/index.js";
import { voteRateLimiter } from "../../shared/security/rate-limiters.js";

const router = Router();

router.get("/candidates", getCandidatesController());
router.get("/results", getResultsController());
router.get("/analytics", getAnalyticsController());
router.post("/votes", voteRateLimiter, castVoteController());

export default router;
