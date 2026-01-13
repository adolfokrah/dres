import { logger } from '../utils/logger.js';
import { makeApiCall, type ApiResponse } from '../utils/apiClient.js';
import { type CronJob } from '../utils/jobLoader.js';

/**
 * Saved Search Notifications Job
 * Queues and processes notification checks for all active saved searches
 */
const savedSearchNotificationsJob: CronJob = {
  name: 'saved-search-notifications',
  description: 'Check saved searches for new items and send notifications',
  
  // Run every 6 hours: 0:00, 6:00, 12:00, 18:00 UTC
  schedule: process.env.NODE_ENV === 'production' ? '0 0,6,12,18 * * *' : '*/10 * * * *',
  
  async handler(): Promise<ApiResponse> {
    logger.info('🔍 Starting saved search notification checks...');
    
    const result = await makeApiCall('/api/saved-searches/queue-notification-checks', 'POST', {});
    
    if (result.success) {
      const jobsQueued = result.jobsQueued as number || 0;
      logger.info(`📬 Saved search checks completed: ${jobsQueued} searches processed`);
    }
    
    return result;
  }
};

export default savedSearchNotificationsJob;
