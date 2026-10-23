import { Router } from "express";
import authRoutes from "./modules/auth/routes.js";
import electionsRoutes from "./modules/elections/routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/elections", electionsRoutes);

export default router;
