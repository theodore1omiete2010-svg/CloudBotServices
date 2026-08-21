import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';

const codeFor = () => String(crypto.randomInt(100000, 1000000));
const fullName = (firstName, surname) => [firstName, surname].filter(Boolean).join(' ').trim();

export async function startVerification({ field, value, mode, countryCode, dialCode }) {
  if (!['email', 'phone'].includes(field)) throw new AppError(400, 'Invalid verification field.');
  if (!['signup', 'reset'].includes(mode)) throw new AppError(400, 'Invalid verification mode.');
  if (!value) throw new AppError(400, 'Verification value is required.');

  const challengeId = crypto.randomUUID();
  const code = codeFor();
  const purpose = mode === 'reset' ? 'reset' : `signup_${field}`;
  const expiresAt = new Date(Date.now() + env.verificationTtlMinutes * 60_000);

  await prisma.verificationChallenge.create({ data: { id: challengeId, field, value, purpose, codeHash: await bcrypt.hash(code, 10), expiresAt, metadata: { countryCode, dialCode } } });

  // Phase 1 delivery adapter: logs the code in development. Replace with email/SMS providers before production.
  if (env.nodeEnv !== 'production') console.log(`[CBS DEV VERIFICATION] ${field} ${value}: ${code}`);

  return { success: true, message: 'Verification code sent.', challengeId, redirect: null };
}

export async function verifyCode({ challengeId, code, mode, field }) {
  const challenge = await prisma.verificationChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.usedAt || challenge.expiresAt < new Date()) throw new AppError(400, 'Invalid or expired code.');
  if (challenge.field !== field) throw new AppError(400, 'Verification challenge does not match the requested field.');
  if (!await bcrypt.compare(String(code), challenge.codeHash)) {
    await prisma.verificationChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    throw new AppError(400, 'Invalid or expired code.');
  }
  await prisma.verificationChallenge.update({ where: { id: challenge.id }, data: { usedAt: new Date() } });

  if (mode === 'reset') {
    const user = await prisma.user.findFirst({ where: { OR: [{ email: challenge.value }, { phone: challenge.value }] } });
    if (!user) throw new AppError(400, 'Unable to complete password reset.');
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + env.resetTtlMinutes * 60_000) } });
    return { success: true, message: 'Verification successful.', resetToken: token };
  }

  return { success: true, message: 'Verification successful.', verified: field };
}

export async function resendCode({ challengeId }) {
  const challenge = await prisma.verificationChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.usedAt) throw new AppError(400, 'Verification session expired.');
  const code = codeFor();
  await prisma.verificationChallenge.update({ where: { id: challenge.id }, data: { codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + env.verificationTtlMinutes * 60_000), attempts: 0 } });
  if (env.nodeEnv !== 'production') console.log(`[CBS DEV VERIFICATION RESEND] ${challenge.field} ${challenge.value}: ${code}`);
  return { success: true, message: 'Code resent successfully.' };
}

export async function signup(input) {
  const { firstName, surname, email, phone, password, countryCode } = input;
  const name = fullName(firstName, surname);
  const emailCode = await prisma.verificationChallenge.findFirst({ where: { field: 'email', value: email, purpose: 'signup_email', usedAt: { not: null } } });
  const phoneCode = await prisma.verificationChallenge.findFirst({ where: { field: 'phone', value: phone, purpose: 'signup_phone', usedAt: { not: null } } });
  if (!emailCode || !phoneCode) throw new AppError(400, 'Please verify your email address and phone number before creating your account.');
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError(409, 'An account with this email already exists.', 'email');
  if (await prisma.user.findUnique({ where: { phone } })) throw new AppError(409, 'An account with this phone number already exists.', 'phone');
  const user = await prisma.user.create({ data: { name, email, phone, country: countryCode || null, password: await bcrypt.hash(password, 12) } });
  return { success: true, message: 'Account created successfully.', redirectUrl: '../Business registration page/index.html', user: { id: user.id, email: user.email, name: user.name } };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password || !await bcrypt.compare(password, user.password)) throw new AppError(401, 'Invalid email or password.');
  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return { token, user, redirect: '../Dashboard page/index.html' };
}

export async function forgotPassword({ identifier }) {
  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } });
  if (user) await startVerification({ field: user.email === identifier ? 'email' : 'phone', value: identifier, mode: 'reset' });
  return { success: true, message: 'If an account matches that information, a verification code has been sent.' };
}

export async function resetPassword({ token, password }) {
  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw new AppError(400, 'Invalid or expired reset token.');
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { password: await bcrypt.hash(password, 12) } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } })
  ]);
  return { success: true, message: 'Password reset successful.', redirectUrl: '../Login page/login.html' };
}
