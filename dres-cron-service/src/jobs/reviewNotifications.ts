import { logger } from '../utils/logger.js';
import { makeApiCall, type ApiResponse } from '../utils/apiClient.js';
import { type CronJob } from '../utils/jobLoader.js';

/**
 * Review Notifications Job
 * 
 * Sends review request notifications to buyers who have received their items.
 * 
 * Flow:
 * 1. When items are delivered, draft reviews are created
 * 2. This job picks up draft reviews that are X days old
 * 3. Sends notifications to buyers asking them to leave a review
 * 4. Marks reviews as 'pending'
 */
const reviewNotificationsJob: CronJob = {
  name: 'review-notifications',
  description: 'Send review request notifications to buyers with delivered items',
  
  // Run daily at 10:00 AM UTC (good time for most timezones)
  // In dev: run every 5 minutes for testing
  schedule: process.env.NODE_ENV === 'production' ? '0 10 * * *' : '*/5 * * * *',
  
  async handler(): Promise<ApiResponse> {
    logger.info('📝 Starting review notifications job...');
    
    // Default: send notifications for reviews that are 3 days old
    const daysAfterDelivery = parseInt(process.env.REVIEW_NOTIFICATION_DAYS || '3', 10);
    const batchSize = parseInt(process.env.REVIEW_NOTIFICATION_BATCH_SIZE || '100', 10);
    
    const result = await makeApiCall(
      `/api/notifications/send-review-requests?daysAfterDelivery=${daysAfterDelivery}&batchSize=${batchSize}`,
      'POST',
      {}
    );
    
    if (result.success) {
      logger.info(`⭐ Review notifications completed`, {
        jobId: result.jobId,
        params: result.params,
      });
    }
    
    return result;
  }
};

export default reviewNotificationsJob;
