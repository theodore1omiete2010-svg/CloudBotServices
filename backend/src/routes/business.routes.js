import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../lib/app-error.js';
const router = Router();
router.post('/register', requireAuth, async (req,res,next) => { try {
  const data = z.object({ businessName:z.string().min(1), businessEmail:z.string().email(), phone:z.string().min(5), businessType:z.string().min(1), businessAddress:z.string().optional() }).parse(req.body);
  const business = await prisma.business.create({ data:{ name:data.businessName,email:data.businessEmail,phone:data.phone,businessType:data.businessType,address:data.businessAddress || null, memberships:{ create:{ userId:req.auth.sub,role:'OWNER' } }, settings:{ create:{} }, botConfiguration:{ create:{} }, subscription:{ create:{ planCode:'trial',status:'TRIAL',interval:'MONTHLY',amount:0,trialEndsAt:new Date(Date.now()+14*86400_000) } } } });
  res.status(201).json({ success:true,message:'Business registered successfully!',businessId:business.id,redirectUrl:'../Dashboard page/index.html' });
} catch(e) { if(e.name==='ZodError') return next(new AppError(400,e.issues[0].message,e.issues[0].path[0])); next(e); } });
export default router;
