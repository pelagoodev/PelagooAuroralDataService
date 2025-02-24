// src/routes/fitbit.routes.ts
import { Router } from 'express';
import * as fitbitController from '../controllers/fitbit.controller.js';

const router = Router();

router.get('/url', fitbitController.getAuthUrl);
router.get('/callback', fitbitController.handleCallback);
router.get('/refresh', fitbitController.refreshToken);

export default router;