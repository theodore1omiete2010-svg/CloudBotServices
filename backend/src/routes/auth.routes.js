import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../services/auth.service.js';

const router = Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const parse = (schema, data) => { const r = schema.safeParse(data); if (!r.success) throw new AppError(400, r.error.issues[0].message, r.error.issues[0].path[0] || null); return r.data; };

router.post('/signup', asyncRoute(async (req, res) => res.status(201).json(await auth.signup(parse(z.object({ firstName:z.string().min(1), surname:z.string().min(1), email:z.string().email(), phone:z.string().min(5), countryCode:z.string().optional().nullable(), dialCode:z.string().optional().nullable(), password:z.string().min(8) }), req.body)))));
router.post('/verification/start', asyncRoute(async (req, res) => res.json(await auth.startVerification(parse(z.object({ field:z.enum(['email','phone']), value:z.string().min(1), mode:z.enum(['signup','reset']), countryCode:z.string().optional().nullable(), dialCode:z.string().optional().nullable() }), req.body))));
router.post('/verify-code', asyncRoute(async (req, res) => res.json(await auth.verifyCode(parse(z.object({ challengeId:z.string().uuid(), code:z.string().length(6), mode:z.enum(['signup','reset']), field:z.enum(['email','phone']) }), req.body))));
router.post('/resend-code', asyncRoute(async (req, res) => res.json(await auth.resendCode(parse(z.object({ challengeId:z.string().uuid() }), req.body))));
router.post('/forgot-password', asyncRoute(async (req, res) => res.json(await auth.forgotPassword(parse(z.object({ identifier:z.string().min(1) }), req.body))));
router.post('/reset-password', asyncRoute(async (req, res) => res.json(await auth.resetPassword(parse(z.object({ token:z.string().min(20), password:z.string().min(8) }), req.body))));
router.post('/login', asyncRoute(async (req, res) => {
  const result = await auth.login(parse(z.object({ email:z.string().email(), password:z.string().min(1) }), req.body));
  const session = await prisma.session.create({ data: { token: result.token, userId: result.user.id, expiresAt: new Date(Date.now()+7*86400_000), userAgent:req.get('user-agent') || null, ipAddress:req.ip } });
  res.cookie('cbs_session', result.token, { httpOnly:true, sameSite:'lax', secure:env.cookieSecure, maxAge:7*86400_000 });
  res.json({ success:true, redirect:result.redirect, user:{ id:result.user.id, email:result.user.email, name:result.user.name }, sessionId:session.id });
}));
router.get('/session', requireAuth, asyncRoute(async (req, res) => { const user = await prisma.user.findUnique({ where:{ id:req.auth.sub }, select:{ id:true,name:true,email:true,phone:true } }); res.json({ success:true, user }); }));
router.post('/logout', requireAuth, asyncRoute(async (req, res) => { await prisma.session.deleteMany({ where:{ userId:req.auth.sub } }); res.clearCookie('cbs_session'); res.json({ success:true }); }));
export default router;
