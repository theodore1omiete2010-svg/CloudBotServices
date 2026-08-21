# CBS Backend - Phase 1

Implemented: Express foundation, PostgreSQL/Prisma schema, authentication, verification challenges, sessions, password reset, and business registration.

## Local setup
1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and fill `DATABASE_URL` and `JWT_SECRET`.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate dev --name init`.
6. Run `npm run dev`.

## Render
Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
Start command: `npm start`

Set environment variables from `.env.example`. Render provides `PORT`; do not hard-code it.

## Important Phase-1 limitation
Verification delivery currently logs codes to the server console outside production. Email/SMS providers are intentionally deferred to a dedicated delivery-integration phase. Do not use this adapter as production verification delivery.
