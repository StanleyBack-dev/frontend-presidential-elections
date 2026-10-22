import { Router } from "express";
import electionsRoutes from "./modules/elections/routes.js";

const router = Router();

router.use("/elections", electionsRoutes);

export default router;
