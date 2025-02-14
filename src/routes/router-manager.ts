import { Router }from 'express';
const router = Router();

import defaultRoute from './default-route.js';

router.use('/default', defaultRoute);

export default router;