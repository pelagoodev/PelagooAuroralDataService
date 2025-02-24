import { Router } from 'express';
import * as uiController from '../controllers/ui.controller.js';

const router = Router();

router.get('/trips', uiController.getLastTrips);
router.get('/lastKnownPos', uiController.getLastKnownPosition);

export default router;
