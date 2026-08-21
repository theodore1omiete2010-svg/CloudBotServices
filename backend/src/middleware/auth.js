import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies.cbs_session || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new AppError(401, 'Authentication required.');
    req.auth = jwt.verify(token, env.jwtSecret);
    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' ? new AppError(401, 'Invalid session.') : error);
  }
}
