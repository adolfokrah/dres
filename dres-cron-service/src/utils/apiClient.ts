import axios, { type AxiosRequestConfig } from 'axios';
import { logger } from './logger.js';

const API_URL = process.env.API_URL || 'https://dres-production.up.railway.app';
const CRON_SECRET = process.env.CRON_SECRET || 'YOUR_CRON_SECRET_HERE';

export interface ApiResponse {
  success: boolean;
  message?: string;
  stats?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Make authenticated API calls to the main DRES app
 */
export async function makeApiCall(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  data: Record<string, unknown> = {}
): Promise<ApiResponse> {
  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      timeout: 30000, // 30 seconds
    };

    if (method !== 'GET') {
      config.data = data;
    }

    const response = await axios(config);
    return response.data as ApiResponse;
    
  } catch (error) {
    logger.error(`API call failed: ${method} ${endpoint}`, {
      status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
      data: axios.isAxiosError(error) ? error.response?.data : undefined,
      message: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

export { API_URL, CRON_SECRET };