import { logger } from '../utils/logger.js';
import { makeApiCall, type ApiResponse } from '../utils/apiClient.js';
import { type CronJob } from '../utils/jobLoader.js';

/**
 * Draft Reminder Job
 * Reminds sellers about their old draft products
 */
const draftReminderJob: CronJob = {
  name: 'draft-reminder',
  description: 'Remind sellers about draft products older than 3 days',
  
  // Testing: every minute | Production: daily at midnight UTC
  schedule: process.env.NODE_ENV === 'production' ? '* * * * *' : '* * * * *',
  
  async handler(): Promise<ApiResponse> {
    logger.info('📧 Starting draft reminder job...');
    
    const result = await makeApiCall('/api/styles/remind-drafts', 'POST', {});
    
    if (result.success) {
      const sellersNotified = result.stats?.sellersNotified as number || 0;
      logger.info(`📨 Draft reminders sent: ${sellersNotified} sellers notified`);
    }
    
    return result;
  }
};

export default draftReminderJob;