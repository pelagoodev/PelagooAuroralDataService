import { Router } from 'express';
import * as nodeRedController  from '../controllers/nodered.controller.js';

const router = Router();


router.get('/fit/:property', nodeRedController.fitNR);
router.get('/bike/:property', nodeRedController.bikeNR);

export default router;