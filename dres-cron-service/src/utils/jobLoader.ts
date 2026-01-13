import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import { type ApiResponse } from './apiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CronJob {
  name: string;
  description: string;
  schedule: string;
  handler: () => Promise<ApiResponse | { success: boolean; message: string }>;
}

/**
 * Dynamically load all job files from the jobs directory
 */
export async function loadJobs(): Promise<CronJob[]> {
  const jobsDir = path.join(__dirname, '../jobs');
  const jobFiles = fs.readdirSync(jobsDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  
  const jobs: CronJob[] = [];
  
  for (const file of jobFiles) {
    try {
      const jobPath = path.join(jobsDir, file);
      const jobModule = await import(`file://${jobPath}`);
      const job: CronJob = jobModule.default;
      
      // Validate job structure
      if (!job.name || !job.schedule || !job.handler) {
        logger.warn(`Invalid job structure in ${file}. Skipping.`);
        continue;
      }
      
      jobs.push(job);
      logger.info(`Loaded job: ${job.name} from ${file}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to load job from ${file}:`, errorMessage);
    }
  }
  
  return jobs;
}