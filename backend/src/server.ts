import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`[CampusCycle Backend] Server running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  console.log(`[CampusCycle Backend] Health check: http://localhost:${env.PORT}/api/health`);
});

export default server;
