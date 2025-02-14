import { Router, Request, Response, NextFunction} from 'express';
import { PrismaClient } from '@prisma/client';
const router = Router();

router.get('/', async (req:Request, res:Response, next:NextFunction) => {
  try {
    const db = new PrismaClient();
    
    res.json();
  } catch (error: unknown) {
    return next(error);
  }
})



export default router;