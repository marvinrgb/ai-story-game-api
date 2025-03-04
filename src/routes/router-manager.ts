import { Router }from 'express';
const router = Router();

import storiesRoute from './story-route.js';

router.use('/stories', storiesRoute);

export default router;