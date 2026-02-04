import cron from 'node-cron';
import { cleanupExpiredSessions } from './tasks/sessionCleanup.js';

export const initCronJobs = () => {
  console.log('[SYSTEM] Initializing Cron Jobs...');


  cron.schedule('*/15 * * * *', async () => {
    await cleanupExpiredSessions();
  });

  cleanupExpiredSessions();


  // cron.schedule('0 0 * * *', () => {
  //   console.log('Running daily maintenance...');
  // });
};