import app from './app.js';
import { env } from './config/env.js';
app.listen(env.port, '0.0.0.0', () => console.log(`CBS backend listening on ${env.port}`));
