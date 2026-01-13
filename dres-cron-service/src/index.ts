import 'dotenv/config';
import cron from 'node-cron';
import { logger } from './utils/logger.js';
import { loadJobs, type CronJob } from './utils/jobLoader.js';

async function startCronService(): Promise<void> {
  try {
    logger.info('🚀 DRES Cron Service starting...');
    logger.info(`📍 API URL: ${process.env.API_URL}`);
    logger.info(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Load and register all cron jobs
    const jobs = await loadJobs();
    
    jobs.forEach((job: CronJob) => {
      logger.info(`⏰ Scheduling job: ${job.name} (${job.schedule})`);
      
      cron.schedule(job.schedule, async () => {
        const startTime = Date.now();
        logger.info(`🔄 Running job: ${job.name}`);
        
        try {
          await job.handler();
          const duration = Date.now() - startTime;
          logger.info(`✅ Job completed: ${job.name} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`❌ Job failed: ${job.name} (${duration}ms)`, errorMessage);
        }
      });
    });

    logger.info(`✨ Cron service running with ${jobs.length} scheduled jobs`);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('👋 Cron service shutting down...');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('💥 Failed to start cron service:', error);
    process.exit(1);
  }
}

startCronService();